import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export type RoundState = 'IDLE' | 'COUNTING_DOWN' | 'SPINNING' | 'REVEALING';

export interface RoundCurrentResponse {
  id: number;
  state: 'idle' | 'spinning' | 'revealing';
  secondsRemaining: number;
  spinDurationSec?: number;
  spinStartedAt?: string;       // R1: timestamp ISO de inicio del spin actual
  revealDurationSec?: number;   // R4: duración del período revealing
  idleDurationSec?: number;     // R6: duración del período idle
  outerPosition?: number | string; // R5: posición durante revealing
  innerPosition?: number | string; // R5: posición durante revealing
}

export interface RoundResultResponse {
  roundId: number;
  outerPosition: number | string;
  innerPosition: number | string;
  resultLabel?: string | null;
}

export interface RoundHistoryEntry {
  roundId: number;
  outerPosition: number | string;
  innerPosition: number | string;
  timestamp: string;
  image?: string;
  spinTime?: string;
}

export interface SpinCommand {
  outerPosition: string;
  innerPosition: string;
  outerDurationMs: number;
  innerDurationMs: number;
  resultLabel?: string | null;
}

@Injectable({ providedIn: 'root' })
export class RoundOrchestratorService implements OnDestroy {
  private readonly baseUrl = environment.apiUrl;

  private stateSubject = new BehaviorSubject<RoundState>('IDLE');
  private secondsSubject = new BehaviorSubject<number>(0);
  private historySubject = new BehaviorSubject<RoundHistoryEntry[]>([]);
  private spinCommandSubject = new Subject<SpinCommand>();
  private spinCompleteSubject = new Subject<void>();
  private revealCompleteSubject = new Subject<void>();
  private resetCommandSubject = new Subject<void>();

  public roundState$ = this.stateSubject.asObservable();
  public secondsToNextRound$ = this.secondsSubject.asObservable();
  public recentHistory$ = this.historySubject.asObservable();
  public spinCommand$ = this.spinCommandSubject.asObservable();
  public revealComplete$ = this.revealCompleteSubject.asObservable();
  public resetCommand$ = this.resetCommandSubject.asObservable();

  private readonly REVEAL_DURATION_SEC = 15;
  private readonly RESET_LEAD_SEC = 10; // segundos antes del fin de revealing para disparar el reset
  private lastKnownRevealDurationSec = this.REVEAL_DURATION_SEC;

  private pollTimeout: any = null;
  private revealTimeout: any = null;
  private revealTickInterval: any = null;
  private lastHandledRoundId: number | null = null;
  private lastSpinCommand: SpinCommand | null = null;
  private lastSpinStartTime: string | null = null;
  private lastSpinDurationSec = 30;
  private lastKnownIdleDurationSec = 0;
  private running = false;

  constructor(private http: HttpClient) {}

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.fetchHistory();
    this.poll();
  }

  public stop(): void {
    this.running = false;
    if (this.pollTimeout) clearTimeout(this.pollTimeout);
    if (this.revealTimeout) clearTimeout(this.revealTimeout);
    if (this.revealTickInterval) clearInterval(this.revealTickInterval);
    if (this.spinGuardTimeout) clearTimeout(this.spinGuardTimeout);
  }

  public notifySpinComplete(): void {
    if (this.spinGuardTimeout) { clearTimeout(this.spinGuardTimeout); this.spinGuardTimeout = null; }
    this.spinCompleteSubject.next();
    this.transitionTo('REVEALING');

    // Agregar el resultado actual al historial inmediatamente sin esperar al servidor
    if (this.lastSpinCommand && this.lastHandledRoundId !== null) {
      const current: RoundHistoryEntry = {
        roundId: this.lastHandledRoundId,
        outerPosition: this.lastSpinCommand.outerPosition,
        innerPosition: this.lastSpinCommand.innerPosition,
        timestamp: new Date().toISOString(),
        spinTime: this.lastSpinStartTime ?? '',
      };
      this.historySubject.next([current, ...this.historySubject.value].slice(0, 10));
    }

    // Arrancar cuenta regresiva local desde revealing + idle conocido
    const revealDuration = this.lastKnownRevealDurationSec;
    let remaining = revealDuration + this.lastKnownIdleDurationSec;
    this.secondsSubject.next(remaining);

    if (this.revealTickInterval) clearInterval(this.revealTickInterval);
    this.revealTickInterval = setInterval(() => {
      remaining--;
      this.secondsSubject.next(Math.max(0, remaining));
      if (remaining <= 0) {
        clearInterval(this.revealTickInterval);
        this.revealTickInterval = null;
      }
    }, 1000);

    // Disparar reset de rueda RESET_LEAD_SEC segundos antes de que termine el revealing
    setTimeout(() => {
      this.resetCommandSubject.next();
    }, (revealDuration - this.RESET_LEAD_SEC) * 1000);

    // Al terminar el período de revealing: un único poll para sincronizar con servidor
    this.revealTimeout = setTimeout(() => {
      if (this.revealTickInterval) {
        clearInterval(this.revealTickInterval);
        this.revealTickInterval = null;
      }
      this.revealCompleteSubject.next();
      this.transitionTo('IDLE');
      this.scheduleNextPoll(0);
    }, revealDuration * 1000);
  }

  private poll(): void {
    if (!this.running) return;

    this.http.get<RoundCurrentResponse>(`${this.baseUrl}/round/current`).subscribe({
      next: (round) => this.handleRoundData(round),
      error: (err) => {
        console.error('[Orchestrator] Error al consultar /round/current:', err);
        this.scheduleNextPoll(10000);
      }
    });
  }

  private handleRoundData(round: RoundCurrentResponse): void {
    const currentState = this.stateSubject.value;

    if (round.spinDurationSec) this.lastSpinDurationSec = round.spinDurationSec;
    if (round.revealDurationSec) this.lastKnownRevealDurationSec = round.revealDurationSec;  // R4
    if (round.idleDurationSec) this.lastKnownIdleDurationSec = round.idleDurationSec;        // R6

    if (round.state === 'spinning' && round.id !== this.lastHandledRoundId) {
      this.lastHandledRoundId = round.id;

      // R1: calcular tiempo de spin restante si el servidor informa cuándo empezó
      let remainingDurationSec: number | undefined;
      if (round.spinStartedAt) {
        const elapsedSec = (Date.now() - new Date(round.spinStartedAt).getTime()) / 1000;
        remainingDurationSec = Math.max(0, this.lastSpinDurationSec - elapsedSec);
      }

      this.triggerSpin(round.id, remainingDurationSec);
      return;
    }

    // Durante SPINNING o REVEALING no interferir — la cuenta regresiva local se encarga
    if (currentState === 'SPINNING' || currentState === 'REVEALING') {
      return;
    }

    if (round.state === 'idle' || round.state === 'revealing') {
      // R6 fallback: inferir idleDurationSec si el servidor no lo envía
      if (!round.idleDurationSec && round.state === 'idle' && round.secondsRemaining > this.lastKnownIdleDurationSec * 0.9) {
        this.lastKnownIdleDurationSec = round.secondsRemaining;
      }

      this.secondsSubject.next(round.secondsRemaining);
      this.transitionTo(round.secondsRemaining > 0 ? 'COUNTING_DOWN' : 'IDLE');
      const interval = round.secondsRemaining < 60 ? 5000 : 30000;
      this.scheduleNextPoll(interval);
    }
  }

  private spinGuardTimeout: any = null;

  private triggerSpin(roundId: number, remainingDurationSec?: number): void {
    this.http.get<RoundResultResponse>(`${this.baseUrl}/round/${roundId}/result`).subscribe({
      next: (result) => {
        this.sendAck(roundId);
        this.lastSpinStartTime = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: false });

        const effectiveDurationSec = remainingDurationSec ?? this.lastSpinDurationSec;
        const cmd: SpinCommand = {
          outerPosition: String(result.outerPosition),
          innerPosition: String(result.innerPosition),
          outerDurationMs: Math.round(effectiveDurationSec * 1000 * 0.9),
          innerDurationMs: Math.round(effectiveDurationSec * 1000),
          resultLabel: result.resultLabel ?? null,
        };
        this.lastSpinCommand = cmd;

        // R1: si el servidor ya terminó de girar, saltar directo a REVEALING sin animar
        if (effectiveDurationSec <= 0) {
          this.transitionTo('SPINNING');
          this.notifySpinComplete();
          return;
        }

        this.transitionTo('SPINNING');
        if (this.spinGuardTimeout) clearTimeout(this.spinGuardTimeout);
        this.spinGuardTimeout = setTimeout(() => {
          if (this.stateSubject.value === 'SPINNING') {
            console.warn('[Orchestrator] Safety timeout — forzando notifySpinComplete()');
            this.notifySpinComplete();
          }
        }, cmd.innerDurationMs + 5000);

        this.spinCommandSubject.next(cmd);
      },
      error: (err) => {
        console.error('[Orchestrator] Error al obtener resultado:', err);
        this.scheduleNextPoll(5000);
      }
    });
  }

  private sendAck(roundId: number, attempt = 1): void {
    this.http.post(`${this.baseUrl}/round/${roundId}/ack`, {}).subscribe({
      error: (err) => {
        if (attempt < 3) {
          setTimeout(() => this.sendAck(roundId, attempt + 1), attempt * 2000);
        } else {
          console.error('[Orchestrator] ACK fallido tras 3 intentos:', err);
        }
      }
    });
  }

  private fetchHistory(): void {
    this.http.get<RoundHistoryEntry[]>(`${this.baseUrl}/history?limit=10`).subscribe({
      next: (history) => this.historySubject.next(history),
      error: (err) => console.warn('[Orchestrator] Error al obtener historial:', err)
    });
  }

  private transitionTo(state: RoundState): void {
    console.log(`[Orchestrator] ${this.stateSubject.value} → ${state}`);
    this.stateSubject.next(state);
  }

  private scheduleNextPoll(delayMs: number): void {
    if (!this.running) return;
    if (this.pollTimeout) clearTimeout(this.pollTimeout);
    this.pollTimeout = setTimeout(() => this.poll(), delayMs);
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
