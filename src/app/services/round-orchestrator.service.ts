import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export type RoundState = 'IDLE' | 'COUNTING_DOWN' | 'SPINNING' | 'REVEALING';

export interface RoundCurrentResponse {
  id: number;
  state: 'idle' | 'spinning' | 'revealing';
  secondsRemaining: number;
}

export interface RoundResultResponse {
  roundId: number;
  outerPosition: number | string;
  innerPosition: number | string;
}

export interface RoundHistoryEntry {
  roundId: number;
  outerPosition: number | string;
  innerPosition: number | string;
  timestamp: string;
}

export interface SpinCommand {
  outerPosition: string;
  innerPosition: string;
}

@Injectable({ providedIn: 'root' })
export class RoundOrchestratorService implements OnDestroy {
  private readonly baseUrl = environment.apiUrl;

  private stateSubject = new BehaviorSubject<RoundState>('IDLE');
  private secondsSubject = new BehaviorSubject<number>(0);
  private historySubject = new BehaviorSubject<RoundHistoryEntry[]>([]);
  private spinCommandSubject = new Subject<SpinCommand>();
  private spinCompleteSubject = new Subject<void>();

  public roundState$ = this.stateSubject.asObservable();
  public secondsToNextRound$ = this.secondsSubject.asObservable();
  public recentHistory$ = this.historySubject.asObservable();
  public spinCommand$ = this.spinCommandSubject.asObservable();

  private pollTimeout: any = null;
  private revealTimeout: any = null;
  private lastHandledRoundId: number | null = null;
  private running = false;

  constructor(private http: HttpClient) {}

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.poll();
  }

  public stop(): void {
    this.running = false;
    if (this.pollTimeout) clearTimeout(this.pollTimeout);
    if (this.revealTimeout) clearTimeout(this.revealTimeout);
  }

  public notifySpinComplete(): void {
    this.spinCompleteSubject.next();
    this.transitionTo('REVEALING');
    this.fetchHistory();

    // Volver a IDLE después del período de revealing (15s)
    this.revealTimeout = setTimeout(() => {
      this.transitionTo('IDLE');
      this.scheduleNextPoll(30000);
    }, 15000);
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
    this.secondsSubject.next(round.secondsRemaining);

    const currentState = this.stateSubject.value;

    if (round.state === 'spinning' && round.id !== this.lastHandledRoundId) {
      this.lastHandledRoundId = round.id;
      this.triggerSpin(round.id);
      return;
    }

    // Si estamos en SPINNING o REVEALING, no sobreescribir el estado
    if (currentState === 'SPINNING' || currentState === 'REVEALING') {
      this.scheduleNextPoll(5000);
      return;
    }

    if (round.state === 'idle' || round.state === 'revealing') {
      this.transitionTo(round.secondsRemaining > 0 ? 'COUNTING_DOWN' : 'IDLE');
      const interval = round.secondsRemaining < 60 ? 5000 : 30000;
      this.scheduleNextPoll(interval);
    }
  }

  private triggerSpin(roundId: number): void {
    this.http.get<RoundResultResponse>(`${this.baseUrl}/round/${roundId}/result`).subscribe({
      next: (result) => {
        this.sendAck(roundId);
        this.transitionTo('SPINNING');
        this.spinCommandSubject.next({
          outerPosition: String(result.outerPosition),
          innerPosition: String(result.innerPosition),
        });
      },
      error: (err) => {
        console.error('[Orchestrator] Error al obtener resultado:', err);
        this.scheduleNextPoll(5000);
      }
    });
  }

  private sendAck(roundId: number): void {
    this.http.post(`${this.baseUrl}/round/${roundId}/ack`, {}).subscribe({
      error: (err) => console.warn('[Orchestrator] ACK fallido:', err)
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
