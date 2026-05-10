import { Component, ViewChild, ChangeDetectorRef, NgZone, OnInit, AfterViewInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { CommonModule, AsyncPipe } from '@angular/common';
import { WheelContainerComponent } from '../components/wheel-container/wheel-container.component';
import { GameState } from '../interfaces/game.enums';
import { DevicePerformanceTier, PerformanceDetectorService } from '../services/performance-detector.service';
import { RoundOrchestratorService } from '../services/round-orchestrator.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.css'],
  standalone: true,
  imports: [IonContent, CommonModule, AsyncPipe, WheelContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(WheelContainerComponent) wheelContainer!: WheelContainerComponent;

  public gameState: GameState = GameState.IDLE;
  public spinDuration = 10000;
  public innerWheelSpinDuration = 12000;

  constructor(
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private performanceDetector: PerformanceDetectorService,
    public orchestrator: RoundOrchestratorService
  ) {}

  ngOnInit(): void {
    this.gameState = GameState.IDLE;
  }

  ngAfterViewInit(): void {
    this.orchestrator.spinCommand$.subscribe(cmd => {
      if (!this.wheelContainer || this.wheelContainer.spinning) return;
      this.gameState = GameState.PLAYING;
      this.cdr.markForCheck();
      this.wheelContainer.spinToResult(cmd)
        .then(() => {
          this.orchestrator.notifySpinComplete();
          return this.wheelContainer.resetToPosition();
        })
        .then(() => {
          this.gameState = GameState.RESULT;
          this.cdr.markForCheck();
        })
        .catch(err => {
          console.error('[HomePage] spinToResult falló:', err);
          this.orchestrator.notifySpinComplete();
          this.gameState = GameState.IDLE;
          this.cdr.markForCheck();
        });
    });

    this.orchestrator.start();
  }

  ngOnDestroy(): void {
    this.orchestrator.stop();
  }

  public getPerformanceTier(): DevicePerformanceTier {
    return this.performanceDetector.getDeviceTier();
  }
}
