/**
 * reveal-overlay.component.ts
 * ---------------------------------------------------------------------------
 * Overlay de "Resultado Spin" para Ionic / Angular (standalone component).
 * Calco 1:1 del prototipo HTML (Reveal Prototipo.html).
 *
 * Secuencia de fases (todas escaladas a la config):
 *   idle → in → hold → [franjas se repliegan] → shrink → clear → done
 *
 * Monta el componente UNA sola vez en la raíz (ver README) y dispáralo con
 * RevealService.play(...). El servicio resuelve las rutas de imágenes.
 * ---------------------------------------------------------------------------
 */

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RevealService, RevealConfig, REVEAL_DEFAULTS } from './reveal.service';
import { Subscription } from 'rxjs';

type Phase = 'idle' | 'in' | 'hold' | 'shrink' | 'clear' | 'done';

interface HypeWord {
  top: string;
  anim: string;
  flash: boolean;
}

@Component({
  selector: 'app-reveal-overlay',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./reveal-overlay.component.scss'],
  template: `
    <div class="reveal-root" *ngIf="active" [style]="rootVars" aria-hidden="true">
      <!-- Oscurecer + blur -->
      <div class="reveal-backdrop" [class.is-clear]="phase === 'clear' || phase === 'idle'"></div>

      <div class="reveal-stage">
        <!-- Franjas diagonales detrás de los anillos -->
        <div class="reveal-band left" [class.show]="bandsShown"></div>
        <div class="reveal-band right" [class.show]="bandsShown"></div>

        <!-- Texto: hype o normal -->
        <ng-container *ngIf="cfg?.hype; else normalText">
          <div
            *ngFor="let w of hypeWords"
            class="hype-word"
            [class.flash]="w.flash"
            [style.top]="w.top"
            [style.animation]="w.anim"
          >
            {{ cfg!.text }}
          </div>
          <div
            class="hype-final"
            [style.transform]="
              hypeFinalBase + (showHypeFinal && phase !== 'clear' ? ' scale(1)' : ' scale(1.28)')
            "
            [style.opacity]="showHypeFinal && phase !== 'clear' ? 1 : 0"
            [style.transition]="hypeFinalTransition"
          >
            {{ cfg!.text }}
          </div>
        </ng-container>

        <ng-template #normalText>
          <div
            class="reveal-text"
            [class.enter]="isVisible"
            [class.collapse]="isCollapsed"
            [class.gone]="phase === 'clear'"
          >
            {{ cfg?.text }}
          </div>
        </ng-template>

        <!-- Imagen izquierda -->
        <div
          class="reveal-img left"
          [class.enter]="isVisible"
          [class.collapse]="isCollapsed"
          [class.gone]="phase === 'clear'"
        >
          <div class="char-glow ring-left"></div>
          <img class="resultado-izq-bg" [src]="resultadoIzqSrc" aria-hidden="true" (error)="hide($event)" />
          <div class="char-ring ring-left">
            <div class="char-fill">
              <span class="char-fallback">{{ leftFallback }}</span>
              <img [src]="leftSrc" alt="" (error)="fadeOut($event)" (load)="fadeIn($event)" />
            </div>
          </div>
          <span class="char-name">{{ cfg?.leftName }}</span>
        </div>

        <!-- Imagen derecha -->
        <div
          class="reveal-img right"
          [class.enter]="isVisible"
          [class.collapse]="isCollapsed"
          [class.gone]="phase === 'clear'"
        >
          <div class="char-glow ring-right"></div>
          <img class="resultado-der-bg" [src]="resultadoDerSrc" aria-hidden="true" (error)="hide($event)" />
          <div class="char-ring ring-right">
            <div class="char-fill">
              <span class="char-fallback">{{ rightFallback }}</span>
              <img [src]="rightSrc" alt="" (error)="fadeOut($event)" (load)="fadeIn($event)" />
            </div>
          </div>
          <span class="char-name">{{ cfg?.rightName }}</span>
        </div>
      </div>
    </div>
  `,
})
export class RevealOverlayComponent implements OnDestroy {
  active = false;
  phase: Phase = 'idle';
  cfg: RevealConfig | null = null;

  // CSS custom properties inyectadas en el host raíz
  rootVars: { [k: string]: string } = {};

  // bandas
  bandsShown = false;

  // texto hype
  hypeWords: HypeWord[] = [];
  showHypeFinal = false;
  hypeFinalBase = 'translate(-50%, -50%)';
  hypeFinalTransition = '';

  // imágenes
  leftSrc = '';
  rightSrc = '';
  leftFallback = '';
  rightFallback = '';
  resultadoIzqSrc = '';
  resultadoDerSrc = '';

  private timers: any[] = [];
  private sub: Subscription;

  constructor(
    private reveal: RevealService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {
    this.resultadoIzqSrc = reveal.resultadoIzqSrc;
    this.resultadoDerSrc = reveal.resultadoDerSrc;
    this.sub = this.reveal.play$.subscribe((c) => this.run(c));
  }

  get isVisible(): boolean {
    return this.phase === 'in' || this.phase === 'hold' || this.phase === 'shrink';
  }
  get isCollapsed(): boolean {
    return this.phase === 'shrink' || this.phase === 'clear';
  }

  // --- handlers de <img> (degradación elegante) ---
  fadeOut(e: Event) { (e.target as HTMLElement).style.opacity = '0'; }
  fadeIn(e: Event) { (e.target as HTMLElement).style.opacity = '1'; }
  hide(e: Event) { (e.target as HTMLElement).style.opacity = '0'; }

  private buildVars(cfg: RevealConfig) {
    const enter = cfg.enterMs!;
    const exit = cfg.exitMs!;
    const shrink = Math.round(exit * 0.58);
    const clear = Math.max(120, exit - shrink);
    const imgShrk = cfg.shrinkScale!;
    const textShrk = Math.max(0.04, imgShrk * 0.4);
    this.rootVars = {
      '--reveal-enter': `${enter}ms`,
      '--reveal-shrink': `${shrink}ms`,
      '--reveal-clear': `${clear}ms`,
      '--reveal-text-delay': `${Math.round(enter * 0.14)}ms`,
      '--reveal-img-shrink': `${imgShrk}`,
      '--reveal-text-shrink': `${textShrk}`,
      '--reveal-text-y': `${cfg.textY}vh`,
      '--reveal-collapse-x': '0px',
      '--reveal-collapse-y': '0px',
      '--reveal-band-out': `${Math.max(260, Math.round(exit * 0.5))}ms`,
      '--ring-left-color': cfg.leftThemeColor!,
      '--ring-right-color': cfg.rightThemeColor!,
    };
  }

  private buildHype(cfg: RevealConfig) {
    this.hypeWords = [];
    this.showHypeFinal = false;
    if (!cfg.hype) return;

    const E = cfg.enterMs!;
    const N = Math.max(1, Math.round(cfg.bursts ?? REVEAL_DEFAULTS.bursts));
    const W = Math.max(1, Math.round(cfg.waves ?? REVEAL_DEFAULTS.waves));
    const frac = (x: number) => x - Math.floor(x);

    // a) ráfaga horizontal — W olas × N textos, izq → der
    const hPhase = E * 0.52;
    const hWave = hPhase / W;
    const hDur = hWave * 0.92;
    for (let w = 0; w < W; w++) {
      for (let i = 0; i < N; i++) {
        const delay = w * hWave + (N > 1 ? (hWave * 0.55 * i) / (N - 1) : 0);
        const top = 30 + 40 * frac((w * N + i + 1) * 0.618);
        this.hypeWords.push({
          flash: false,
          top: top.toFixed(1) + '%',
          anim: `hype-slide ${Math.round(hDur)}ms cubic-bezier(.5,0,.5,1) ${Math.round(delay)}ms both`,
        });
      }
    }

    // b) parpadeos verticales — W olas, arriba → abajo
    const vStart = E * 0.4;
    const vSpan = E * 0.42;
    const vWave = vSpan / W;
    for (let w = 0; w < W; w++) {
      for (let i = 0; i < N; i++) {
        const slot = vWave / N;
        const delay = vStart + w * vWave + i * slot;
        const dur = Math.max(70, slot * 0.9);
        const top = 18 + (N > 1 ? (60 * i) / (N - 1) : 30);
        this.hypeWords.push({
          flash: true,
          top: top.toFixed(1) + '%',
          anim: `hype-flash ${Math.round(dur)}ms ease-out ${Math.round(delay)}ms both`,
        });
      }
    }

    // c) texto final que aterriza centrado
    const finalDur = `${Math.round(E * 0.34)}ms`;
    this.hypeFinalBase = `translate(-50%, -50%) translateY(${cfg.textY}vh)`;
    this.hypeFinalTransition = `transform ${finalDur} cubic-bezier(.2,.9,.25,1), opacity ${finalDur} ease`;
  }

  private run(cfg: RevealConfig) {
    this.clearTimers();
    this.cfg = cfg;

    // imágenes + fallbacks
    this.leftSrc = this.reveal.resolveAnimal(cfg.leftImage);
    this.rightSrc = this.reveal.resolveAnimal(cfg.rightImage);
    this.leftFallback = cfg.leftImage.replace(/\.png$/i, '');
    this.rightFallback = cfg.rightImage.replace(/\.png$/i, '');

    this.buildVars(cfg);
    this.buildHype(cfg);

    this.active = true;
    this.phase = 'idle';
    this.bandsShown = false;
    this.cdr.markForCheck();

    const enter = cfg.enterMs!;
    const hold = cfg.holdMs!;
    const exit = cfg.exitMs!;
    const shrink = exit * 0.58;
    const clear = Math.max(120, exit - shrink);
    const bandOut = Math.max(260, Math.round(exit * 0.5));

    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        this.set('in');
        this.setBands(true); // las franjas se despliegan

        if (cfg.hype) {
          this.at(enter * 0.8, () => {
            this.showHypeFinal = true;
            this.flush();
          });
        }

        this.at(enter, () => this.set('hold'));
        // 1) las franjas se repliegan PRIMERO
        this.at(enter + hold, () => this.setBands(false));
        // 2) luego colapsan texto + imágenes
        this.at(enter + hold + bandOut, () => this.set('shrink'));
        this.at(enter + hold + bandOut + shrink, () => this.set('clear'));
        this.at(enter + hold + bandOut + shrink + clear, () => {
          this.phase = 'done';
          this.active = false;
          this.flush();
          this.reveal.emitDone(cfg);
        });
      });
    });
  }

  private set(p: Phase) {
    this.phase = p;
    this.flush();
  }
  private setBands(shown: boolean) {
    this.bandsShown = shown;
    this.flush();
  }
  private flush() {
    this.zone.run(() => this.cdr.markForCheck());
  }
  private at(ms: number, fn: () => void) {
    this.timers.push(setTimeout(fn, ms));
  }
  private clearTimers() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  ngOnDestroy() {
    this.clearTimers();
    this.sub?.unsubscribe();
  }
}
