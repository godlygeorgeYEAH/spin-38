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
  spinStartedAt?: string;       // timestamp ISO de inicio del spin actual
  revealDurationSec?: number;   // duración del período revealing
  idleDurationSec?: number;     // duración del período idle
  outerPosition?: number | string; // posición durante revealing
  innerPosition?: number | string; // posición durante revealing
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
  private readonly RESET_LEAD_SEC = 10;
  private lastKnownRevealDurationSec = this.REVEAL_DURATION_SEC;

  private pollTimeout: any = null;
  private revealTimeout: any = null;
  private revealTickInterval: any = null;
  private spinGuardTimeout: any = null;
  private lastHandledRoundId: number | null = null;
  private lastSpinCommand: SpinCommand | null = null;
  private lastSpinStartTime: string | null = null;
  private lastSpinDurationSec = 30;
  private lastKnownIdleDurationSec = 0;
  private running = false;
  private onVisibilityChange = () => this.handleVisibilityChange();

  constructor(private http: HttpClient) {}

  public start(): void {
    if (this.running) return;
    this.running = true;
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.fetchHistory();
    this.poll();
  }

  public stop(): void {
    this.running = false;
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    if (this.pollTimeout) clearTimeout(this.pollTimeout);
    if (this.revealTimeout) clearTimeout(this.revealTimeout);
    if (this.revealTickInterval) clearInterval(this.revealTickInterval);
    if (this.spinGuardTimeout) clearTimeout(this.spinGuardTimeout);
  }

  private handleVisibilityChange(): void {
    if (document.hidden || !this.running) return;
    console.log('[Orchestrator] Pestaña visible — resincronizando con servidor');
    if (this.pollTimeout) clearTimeout(this.pollTimeout);
    this.poll();
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
    if (round.revealDurationSec) this.lastKnownRevealDurationSec = round.revealDurationSec;
    if (round.idleDurationSec) this.lastKnownIdleDurationSec = round.idleDurationSec;

    if (round.state === 'spinning' && round.id !== this.lastHandledRoundId) {
      this.lastHandledRoundId = round.id;

      let remainingDurationSec: number | undefined;
      if (round.spinStartedAt) {
        const elapsedSec = (Date.now() - new Date(round.spinStartedAt).getTime()) / 1000;
        remainingDurationSec = Math.max(0, this.lastSpinDurationSec - elapsedSec);
      }

      this.triggerSpin(round.id, remainingDurationSec);
      return;
    }

    // Si el servidor ya salió de spinning/revealing pero el cliente sigue atrasado,
    // forzar resync: limpiar timers locales y dejar que la lógica de idle/revealing tome el control
    if (currentState === 'SPINNING' || currentState === 'REVEALING') {
      if (round.state === 'idle' || round.state === 'revealing') {
        console.log(`[Orchestrator] Servidor en '${round.state}' pero cliente en '${currentState}' — forzando resync`);
        if (this.revealTimeout) { clearTimeout(this.revealTimeout); this.revealTimeout = null; }
        if (this.revealTickInterval) { clearInterval(this.revealTickInterval); this.revealTickInterval = null; }
        if (this.spinGuardTimeout) { clearTimeout(this.spinGuardTimeout); this.spinGuardTimeout = null; }
        // fall through para que el bloque idle/revealing actualice el estado
      } else {
        // Servidor también en spinning (misma ronda ya registrada) — la cuenta regresiva local se encarga
        return;
      }
    }

    if (round.state === 'idle' || round.state === 'revealing') {
      // Inferir idleDurationSec si el servidor no lo envía
      if (!round.idleDurationSec && round.state === 'idle' && round.secondsRemaining > this.lastKnownIdleDurationSec * 0.9) {
        this.lastKnownIdleDurationSec = round.secondsRemaining;
      }

      this.secondsSubject.next(round.secondsRemaining);
      this.transitionTo(round.secondsRemaining > 0 ? 'COUNTING_DOWN' : 'IDLE');
      const interval = round.secondsRemaining < 60 ? 5000 : 30000;
      this.scheduleNextPoll(interval);
    }
  }

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

        // Si el servidor ya terminó de girar, saltar directo a REVEALING sin animar
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
