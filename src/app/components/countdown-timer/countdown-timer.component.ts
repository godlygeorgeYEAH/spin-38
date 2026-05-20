import { Component, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { RoundOrchestratorService, RoundState } from '../../services/round-orchestrator.service';

@Component({
  selector: 'app-countdown-timer',
  templateUrl: './countdown-timer.component.html',
  styleUrls: ['./countdown-timer.component.css'],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountdownTimerComponent implements OnInit, OnDestroy {
  @Output() anticipation = new EventEmitter<void>();

  public displayTime: string = '--:--';
  public roundState: RoundState = 'IDLE';
  private subs = new Subscription();
  private tickInterval: any = null;
  private currentSeconds = 0;

  constructor(
    private orchestrator: RoundOrchestratorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.orchestrator.roundState$.subscribe(state => {
        this.roundState = state;
        this.cdr.markForCheck();
      })
    );

    this.subs.add(
      this.orchestrator.secondsToNextRound$.subscribe(seconds => {
        // El servidor envía una nueva base — sincronizar y reiniciar el tick local
        this.currentSeconds = seconds;
        this.displayTime = this.format(seconds);
        this.startLocalTick();
        this.cdr.markForCheck();
      })
    );
  }

  get isHidden(): boolean {
    return this.roundState === 'SPINNING';
  }

  private startLocalTick(): void {
    if (this.tickInterval) clearInterval(this.tickInterval);

    this.tickInterval = setInterval(() => {
      if (this.currentSeconds > 0) {
        this.currentSeconds--;
        this.displayTime = this.format(this.currentSeconds);
        if (this.currentSeconds === 0) {
          this.anticipation.emit();
        }
      }
      this.cdr.markForCheck();
    }, 1000);
  }

  private format(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.tickInterval) clearInterval(this.tickInterval);
  }
}
