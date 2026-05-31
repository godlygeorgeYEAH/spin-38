/**
 * reveal-overlay.component.ts
 * ---------------------------------------------------------------------------
 * Animación de "Resultado Dupla" para Ionic / Angular (standalone component).
 *
 * Hace exactamente lo del prototipo HTML:
 *   1. Oscurece la pantalla y aplica blur (backdrop).
 *   2. Desplaza dos imágenes desde el centro-izquierda / centro-derecha al
 *      centro. Recibe los filenames de las dos imágenes a reproducir.
 *   3. Dibuja el texto grande delineado:
 *        · Modo normal: entra desde la izquierda hasta su posición.
 *        · Modo "hype" (cuando text === 'DUPLA' o config.hype === true):
 *            a) varios textos en ráfaga cruzando de izquierda a derecha,
 *            b) textos parpadeando uno a uno de arriba hacia abajo (rápido),
 *            c) un texto final con fade-in debajo de las dos imágenes.
 *   4. Al terminar, las imágenes (y el texto, en modo normal) convergen al
 *      centro, se hacen pequeñas, la pantalla se aclara y el blur se disipa.
 *
 * Uso típico (desde cualquier página):
 *
 *   constructor(private reveal: RevealService) {}
 *
 *   mostrarResultado() {
 *     this.reveal.play({
 *       leftImage:  'animal_03.png',     // filename (resuelto con basePath)
 *       rightImage: 'animal_07.png',     // o una URL absoluta / CDN
 *       text: 'DUPLA',
 *       enterMs: 2500, holdMs: 10000, exitMs: 2500,  // opcionales (ms)
 *       shrinkScale: 0.1,                // escala final (opcional)
 *       textY: 25,                       // posición vertical del texto (opcional)
 *       // hype: true,                   // forzar secuencia hype para cualquier texto
 *     });
 *   }
 *
 * El pool de X imágenes lo administra TU código; este componente solo recibe
 * las 2 que se van a reproducir (ver RevealService.playRandomFromPool()).
 * ---------------------------------------------------------------------------
 */

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  NgZone,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RevealService, RevealConfig, REVEAL_DEFAULTS } from './reveal.service';
import { Subscription } from 'rxjs';

type Phase = 'idle' | 'in' | 'hold' | 'shrink' | 'clear' | 'done';

/** Un texto de la secuencia hype con su posición vertical y animación CSS. */
interface HypeWord {
  top: string; // p.ej. '42%'
  anim: string; // valor de la propiedad CSS `animation`
}

@Component({
  selector: 'app-reveal-overlay',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./reveal-overlay.component.scss'],
  template: `
    <div
      class="reveal-root"
      *ngIf="config && phase !== 'done'"
      aria-hidden="true"
    >
      <!-- Oscurecer + blur -->
      <div class="reveal-backdrop" [class.is-clear]="phase === 'clear' || phase === 'idle'"></div>

      <div class="reveal-stage">
        <!-- ===== Texto ===== -->
        <ng-container *ngIf="isHype; else normalText">
          <!-- a) ráfaga horizontal izquierda -> derecha -->
          <div
            *ngFor="let w of hypeHoriz"
            class="hype-word"
            [style.top]="w.top"
            [style.animation]="w.anim"
          >
            {{ config.text }}
          </div>
          <!-- b) parpadeos verticales arriba -> abajo -->
          <div
            *ngFor="let w of hypeVert"
            class="hype-word flash"
            [style.top]="w.top"
            [style.animation]="w.anim"
          >
            {{ config.text }}
          </div>
          <!-- c) texto final que aterriza centrado y se mantiene -->
          <div
            class="hype-final"
            [style.transform]="
              hypeFinalTransform +
              (showHypeFinal && phase !== 'clear' ? ' scale(1)' : ' scale(1.28)')
            "
            [style.opacity]="showHypeFinal && phase !== 'clear' ? 1 : 0"
            [style.transition]="
              'transform ' + hypeFinalDur + ' cubic-bezier(.2,.9,.25,1), opacity ' + hypeFinalDur + ' ease'
            "
          >
            {{ config.text }}
          </div>
        </ng-container>

        <ng-template #normalText>
          <div
            class="reveal-text"
            [class.enter]="isVisible"
            [class.collapse]="isCollapsed"
            [class.gone]="phase === 'clear'"
          >
            {{ config.text }}
          </div>
        </ng-template>

        <!-- ===== Imagen izquierda ===== -->
        <div
          class="reveal-img left"
          [class.enter]="isVisible"
          [class.collapse]="isCollapsed"
          [class.gone]="phase === 'clear'"
        >
          <div class="char-ring ring-left">
            <div class="char-fill">
              <img [src]="config.leftImage" [alt]="''" />
            </div>
          </div>
        </div>

        <!-- ===== Imagen derecha ===== -->
        <div
          class="reveal-img right"
          [class.enter]="isVisible"
          [class.collapse]="isCollapsed"
          [class.gone]="phase === 'clear'"
        >
          <div class="char-ring ring-right">
            <div class="char-fill">
              <img [src]="config.rightImage" [alt]="''" />
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RevealOverlayComponent implements OnDestroy {
  config: RevealConfig | null = null;
  phase: Phase = 'idle';

  // --- estado de la secuencia hype ---
  isHype = false;
  hypeHoriz: HypeWord[] = [];
  hypeVert: HypeWord[] = [];
  showHypeFinal = false;
  hypeFinalTransform = 'translate(-50%, -50%)';
  hypeFinalDur = '600ms';

  private timers: any[] = [];
  private sub: Subscription;

  constructor(
    private reveal: RevealService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private el: ElementRef<HTMLElement>,
  ) {
    // El servicio emite una config cada vez que se llama play().
    this.sub = this.reveal.play$.subscribe((cfg) => this.run(cfg));
  }

  get isVisible(): boolean {
    return this.phase === 'in' || this.phase === 'hold' || this.phase === 'shrink';
  }
  get isCollapsed(): boolean {
    return this.phase === 'shrink' || this.phase === 'clear';
  }

  /** Expone las duraciones y la escala de reducción como CSS custom properties. */
  private applyVars(cfg: RevealConfig) {
    const enter = cfg.enterMs ?? REVEAL_DEFAULTS.enterMs;
    const exit = cfg.exitMs ?? REVEAL_DEFAULTS.exitMs;
    const shrink = Math.round(exit * 0.58);
    const clear = Math.max(120, exit - shrink);
    const imgShrink = cfg.shrinkScale ?? REVEAL_DEFAULTS.shrinkScale;
    const textShrink = Math.max(0.04, imgShrink * 0.4);
    const textY = cfg.textY ?? REVEAL_DEFAULTS.textY;
    const host = this.el.nativeElement;
    host.style.setProperty('--reveal-enter', `${enter}ms`);
    host.style.setProperty('--reveal-shrink', `${shrink}ms`);
    host.style.setProperty('--reveal-clear', `${clear}ms`);
    host.style.setProperty('--reveal-text-delay', `${Math.round(enter * 0.14)}ms`);
    host.style.setProperty('--reveal-img-shrink', `${imgShrink}`);
    host.style.setProperty('--reveal-text-shrink', `${textShrink}`);
    host.style.setProperty('--reveal-text-y', `${textY}vh`);
  }

  /** Detecta el modo hype y, si aplica, construye las ráfagas de texto. */
  private buildHype(cfg: RevealConfig) {
    this.isHype =
      cfg.hype != null
        ? cfg.hype
        : (cfg.text || '').trim().toUpperCase() === 'MOROCHA';

    this.hypeHoriz = [];
    this.hypeVert = [];
    this.showHypeFinal = false;
    if (!this.isHype) return;

    const E = cfg.enterMs ?? REVEAL_DEFAULTS.enterMs;
    const textY = cfg.textY ?? REVEAL_DEFAULTS.textY;
    const N = Math.max(1, Math.round(cfg.bursts ?? REVEAL_DEFAULTS.bursts)); // textos por ola
    const W = Math.max(1, Math.round(cfg.waves ?? REVEAL_DEFAULTS.waves)); // olas (repeticiones) por lado
    const frac = (x: number) => x - Math.floor(x);

    // a) ráfaga horizontal: W olas, cada una con N textos izquierda -> derecha
    const hPhase = E * 0.52;
    const hWave = hPhase / W;
    const hDur = hWave * 0.92;
    for (let w = 0; w < W; w++) {
      for (let i = 0; i < N; i++) {
        const delay = w * hWave + (N > 1 ? (hWave * 0.55 * i) / (N - 1) : 0);
        const top = 30 + 40 * frac((w * N + i + 1) * 0.618);
        this.hypeHoriz.push({
          top: top.toFixed(1) + '%',
          anim: `hype-slide ${Math.round(hDur)}ms cubic-bezier(.5,0,.5,1) ${Math.round(delay)}ms both`,
        });
      }
    }

    // b) parpadeos verticales: W olas, cada una un recorrido arriba -> abajo de N
    const vStart = E * 0.4;
    const vSpan = E * 0.42;
    const vWave = vSpan / W;
    for (let w = 0; w < W; w++) {
      for (let i = 0; i < N; i++) {
        const slot = vWave / N;
        const delay = vStart + w * vWave + i * slot;
        const dur = Math.max(70, slot * 0.9);
        const top = 18 + (N > 1 ? (60 * i) / (N - 1) : 30);
        this.hypeVert.push({
          top: top.toFixed(1) + '%',
          anim: `hype-flash ${Math.round(dur)}ms ease-out ${Math.round(delay)}ms both`,
        });
      }
    }

    // c) texto final: aterriza centrado (escala desde un poco más grande)
    this.hypeFinalTransform = `translate(-50%, -50%) translateY(${textY}vh)`;
    this.hypeFinalDur = `${Math.round(E * 0.34)}ms`;
  }

  private run(cfg: RevealConfig) {
    this.clearTimers();

    this.config = cfg;
    this.phase = 'idle';
    this.applyVars(cfg);
    this.buildHype(cfg);
    this.cdr.markForCheck();

    const enter = cfg.enterMs ?? REVEAL_DEFAULTS.enterMs;
    const hold = cfg.holdMs ?? REVEAL_DEFAULTS.holdMs;
    const exit = cfg.exitMs ?? REVEAL_DEFAULTS.exitMs;
    const shrink = exit * 0.58;
    const clear = Math.max(120, exit - shrink);

    // requestAnimationFrame para que la transición idle -> in se anime.
    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => this.set('in'));
      // el texto final (hype) aparece hacia el final de la entrada
      if (this.isHype) {
        this.at(enter * 0.8, () => {
          this.showHypeFinal = true;
          this.zone.run(() => this.cdr.markForCheck());
        });
      }
      this.at(enter, () => this.set('hold'));
      this.at(enter + hold, () => this.set('shrink'));
      this.at(enter + hold + shrink, () => this.set('clear'));
      this.at(enter + hold + shrink + clear, () => {
        this.set('done');
        this.reveal.emitDone(cfg);
      });
    });
  }

  private set(p: Phase) {
    this.zone.run(() => {
      this.phase = p;
      this.cdr.markForCheck();
    });
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
