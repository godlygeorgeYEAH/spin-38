/**
 * <app-porthole-water> — Angular standalone component for Ionic.
 *
 *   <app-porthole-water
 *     [size]="320"
 *     [frameSrc]="'assets/images/rueda/centrorueda.png'"
 *     [waterLevel]="0.5"
 *   ></app-porthole-water>
 *
 * Provide the brass frame PNG via `frameSrc` (required input).
 * The glass geometry inputs (glassCx/glassCy/glassR) are measured for THAT
 * artwork — re-measure if you swap it.
 *
 * See OJO-DE-BUEY.md for full prop reference and theory.
 */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface PWBubble {
  x: number;
  y: number;
  r: number;
  rise: number;
  dur: number;
  delay: number;
  drift: number;
}

function pwRand(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothOpenPath(points: { x: number; y: number }[]): string {
  const n = points.length;
  if (n < 2) return '';
  const get = (i: number) => points[Math.max(0, Math.min(n - 1, i))];
  let d = `M${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

interface Harmonic { amp: number; mult: number; phase: number; }

function buildWaterPath(
  x0: number, x1: number, surfaceY: number, bottomY: number,
  wavelength: number, ampPx: number, harmonics: Harmonic[],
): string {
  const k = (2 * Math.PI) / wavelength;
  const pts: { x: number; y: number }[] = [];
  const step = Math.max(3, wavelength / 22);
  for (let x = x0; x <= x1 + 0.0001; x += step) {
    let y = surfaceY;
    for (const h of harmonics) y -= ampPx * h.amp * Math.sin(k * h.mult * x + h.phase);
    pts.push({ x, y });
  }
  return smoothOpenPath(pts) + ` L${x1.toFixed(2)},${bottomY.toFixed(2)} L${x0.toFixed(2)},${bottomY.toFixed(2)} Z`;
}

const FRONT_H: Harmonic[] = [
  { amp: 1.0, mult: 1, phase: 0.0 },
  { amp: 0.5, mult: 2, phase: 1.1 },
  { amp: 0.28, mult: 3, phase: 2.3 },
];
const BACK_H: Harmonic[] = [
  { amp: 0.7, mult: 1, phase: 1.7 },
  { amp: 0.34, mult: 2, phase: 0.4 },
];

@Component({
  selector: 'app-porthole-water',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host { display: block; width: 100%; height: 100%; position: relative; line-height: 0; }
      @keyframes pw-sway {
        0%, 100% { transform: rotate(calc(var(--pw-sway) * -1)); }
        50%      { transform: rotate(var(--pw-sway)); }
      }
      @keyframes pw-blink {
        0%, 100% { opacity: 1; }
        50%      { opacity: 0.15; }
      }
      .pw-blink { animation: pw-blink 1s steps(1, end) infinite; }
      .pw-sway-g {
        animation: pw-sway var(--pw-sway-dur, 8s) ease-in-out infinite;
      }
      .pw-frame {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        user-select: none;
        transform: rotate(var(--pw-frame-rotation, 0deg));
      }
    `,
  ],
  template: `
    <svg
      width="100%"
      height="100%"
      [attr.viewBox]="'0 0 ' + size + ' ' + size"
      style="position: absolute; inset: 0; display: block"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath [attr.id]="uid + '-glass'">
          <circle [attr.cx]="cx" [attr.cy]="cy" [attr.r]="R" />
        </clipPath>
        <linearGradient [attr.id]="uid + '-water'" x1="0" [attr.y1]="surfaceY" x2="0" [attr.y2]="bottomY" gradientUnits="userSpaceOnUse">
          <stop offset="0%" [attr.stop-color]="lightColor" />
          <stop offset="22%" [attr.stop-color]="color" />
          <stop offset="100%" [attr.stop-color]="darkColor" />
        </linearGradient>
        <linearGradient [attr.id]="uid + '-air'" x1="0" [attr.y1]="cy - R" x2="0" [attr.y2]="surfaceY" gradientUnits="userSpaceOnUse">
          <stop offset="0%" [attr.stop-color]="airColor" stop-opacity="0.95" />
          <stop offset="100%" [attr.stop-color]="airColor" stop-opacity="0.55" />
        </linearGradient>
        <linearGradient [attr.id]="uid + '-caustic'" x1="0" [attr.y1]="surfaceY" x2="0" [attr.y2]="surfaceY + R * 0.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </linearGradient>
        <radialGradient [attr.id]="uid + '-vignette'" cx="50%" cy="42%" r="60%">
          <stop offset="60%" stop-color="#000000" stop-opacity="0" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.45" />
        </radialGradient>

        <!-- Fisheye lens for the countdown -->
        <filter [attr.id]="uid + '-lens'" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" [attr.x]="lensX" [attr.y]="lensY" [attr.width]="lensS" [attr.height]="lensS">
          <feImage [attr.href]="lensMapSrc" [attr.xlink:href]="lensMapSrc" [attr.x]="lensX" [attr.y]="lensY" [attr.width]="lensS" [attr.height]="lensS" preserveAspectRatio="none" result="lm" />
          <feDisplacementMap in="SourceGraphic" in2="lm" [attr.scale]="lensScale" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      <g [attr.clip-path]="'url(#' + uid + '-glass)'">
        <circle [attr.cx]="cx" [attr.cy]="cy" [attr.r]="R" [attr.fill]="airColor" />
        <rect [attr.x]="cx - R" [attr.y]="cy - R" [attr.width]="R * 2" [attr.height]="airRectH" [attr.fill]="'url(#' + uid + '-air)'" />

        <g class="pw-sway-g" [style.transform-origin]="cx + 'px ' + cy + 'px'" [style.--pw-sway]="sway + 'deg'" [style.--pw-sway-dur]="swayDur + 's'" [style.animation]="sway > 0 ? null : 'none'">
          <path [attr.d]="backPath" [attr.fill]="color" opacity="0.5">
            <animateTransform attributeName="transform" type="translate" from="0 0" [attr.to]="(dir * wavelength) + ' 0'" [attr.dur]="(waveSpeed * 1.7) + 's'" repeatCount="indefinite" />
          </path>
          <path [attr.d]="frontPath" [attr.fill]="'url(#' + uid + '-water)'">
            <animateTransform attributeName="transform" type="translate" from="0 0" [attr.to]="(dir * wavelength) + ' 0'" [attr.dur]="waveSpeed + 's'" repeatCount="indefinite" />
          </path>
          <path [attr.d]="frontPath" [attr.fill]="'url(#' + uid + '-caustic)'" opacity="0.6">
            <animateTransform attributeName="transform" type="translate" from="0 0" [attr.to]="(dir * wavelength) + ' 0'" [attr.dur]="waveSpeed + 's'" repeatCount="indefinite" />
          </path>
          <path [attr.d]="surfaceLine" fill="none" [attr.stroke]="lightColor" [attr.stroke-width]="strokeW" stroke-linecap="round" opacity="0.85">
            <animateTransform attributeName="transform" type="translate" from="0 0" [attr.to]="(dir * wavelength) + ' 0'" [attr.dur]="waveSpeed + 's'" repeatCount="indefinite" />
          </path>
        </g>

        <g>
          <circle *ngFor="let b of bubbles" [attr.cx]="b.x" [attr.cy]="b.y" [attr.r]="b.r" fill="#ffffff" opacity="0.5">
            <animateTransform attributeName="transform" type="translate" [attr.values]="'0 0; ' + b.drift + ' ' + (-b.rise)" [attr.dur]="b.dur + 's'" [attr.begin]="b.delay + 's'" repeatCount="indefinite" calcMode="spline" keySplines="0.3 0 0.7 1" />
            <animate *ngIf="bubbleFade" attributeName="opacity" values="0;0.6;0.6;0" keyTimes="0;0.15;0.7;1" [attr.dur]="b.dur + 's'" [attr.begin]="b.delay + 's'" repeatCount="indefinite" />
          </circle>
        </g>

        <circle [attr.cx]="cx" [attr.cy]="cy" [attr.r]="R" [attr.fill]="'url(#' + uid + '-vignette)'" />
      </g>

      <g [attr.clip-path]="'url(#' + uid + '-glass)'" [style.mix-blend-mode]="'screen'">
        <ellipse [attr.cx]="cx - R * 0.32" [attr.cy]="cy - R * 0.42" [attr.rx]="R * 0.42" [attr.ry]="R * 0.18" fill="#ffffff" opacity="0.14" [attr.transform]="'rotate(-32 ' + (cx - R * 0.32) + ' ' + (cy - R * 0.42) + ')'" />
      </g>

      <!-- Countdown — MM:SS, magnified through a fisheye lens, dead-center on the glass -->
      <g *ngIf="countdown !== null" [attr.filter]="'url(#' + uid + '-lens)'" style="pointer-events: none">
        <text
          [attr.x]="cx - 30"
          [attr.y]="cy - 30"
          text-anchor="middle"
          dominant-baseline="central"
          font-family="ui-sans-serif, system-ui, sans-serif"
          font-weight="700"
          [attr.font-size]="R * 0.55"
          [attr.fill]="urgent ? '#ffd23f' : '#eaf6fb'"
          [class.pw-blink]="urgent"
        >{{ fmtCountdown }}</text>
      </g>
    </svg>

    <img class="pw-frame" [src]="frameSrc" alt="Ojo de buey" draggable="false" [style.--pw-frame-rotation]="frameRotation + 'deg'" />
  `,
})
export class PortholeWaterComponent implements OnChanges, OnInit {
  @Input() size = 520;
  @Input() frameSrc = '';
  @Input() glassCx = 0.501;
  @Input() glassCy = 0.495;
  @Input() glassR = 0.283;
  @Input() waterLevel = 0.5;
  @Input() color = '#2f9fd6';
  @Input() lightColor = '#9be7fb';
  @Input() darkColor = '#0c4d74';
  @Input() airColor = '#0a2230';
  @Input() waveAmp = 0.01;
  @Input() waveCount = 2.4;
  @Input() waveSpeed = 7;
  @Input() flowRight = true;
  @Input() bubbleCount = 8;
  @Input() bubbleSpeed = 6;
  @Input() bubbleFade = true;
  @Input() sway = 1.2;
  /** displacement map used for the fisheye lens on the counter */
  @Input() lensMapSrc = 'assets/lens-map.png';
  /** rotation applied to the frame image only (water and counter are unaffected) */
  @Input() frameRotation = 0;

  // --- Sequence (app-triggered fill + countdown) ---
  /** ms for the water to rise to full / drain back to default */
  @Input() fillDurationMs = 2000;
  @Input() drainDurationMs = 2000;
  /** Fired right after the water reaches full, as the countdown starts */
  @Output() countdownStart = new EventEmitter<number>();
  /** Fired every second with the remaining value */
  @Output() countdownTick = new EventEmitter<number>();
  /** Fired when the countdown hits 0 (before the water drains) */
  @Output() countdownEnd = new EventEmitter<void>();
  /** Fired when the whole sequence (rise → count → drain) is finished */
  @Output() sequenceEnd = new EventEmitter<void>();

  /** Value shown in the centered counter; null hides it */
  countdown: number | null = null;

  uid = 'pw' + Math.random().toString(36).slice(2, 8);

  // Internal animated level (starts at the resting `waterLevel`)
  private level = 0.5;
  private running = false;
  private raf = 0;
  private timer: any = 0;

  constructor(private cdr: ChangeDetectorRef, private zone: NgZone) {}

  cx = 0; cy = 0; R = 0;
  wavelength = 0; surfaceY = 0; bottomY = 0; airRectH = 0;
  dir = 1; strokeW = 2; swayDur = 8;
  frontPath = ''; backPath = ''; surfaceLine = '';
  bubbles: PWBubble[] = [];

  // Fisheye lens geometry (centered on the glass)
  lensR = 0; lensX = 0; lensY = 0; lensS = 0; lensScale = 0;
  blinkPx = 1;

  /** counter formatted as MM:SS */
  get fmtCountdown(): string {
    if (this.countdown === null) return '';
    const m = Math.floor(this.countdown / 60);
    const s = this.countdown % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  /** last 5 seconds → blink yellow */
  get urgent(): boolean {
    return this.countdown !== null && this.countdown <= 5;
  }

  ngOnInit() {
    this.level = this.waterLevel;
    this.recompute();
  }
  ngOnChanges() {
    // While idle, follow the bound waterLevel; during a sequence we drive it ourselves.
    if (!this.running) this.level = this.waterLevel;
    this.recompute();
  }
  ngOnDestroy() {
    cancelAnimationFrame(this.raf);
    clearTimeout(this.timer);
  }

  // =========================================================
  //  PUBLIC API — call this from your app (via @ViewChild)
  // =========================================================
  /**
   * Run the full sequence:
   *   1. water rises to full over `fillDurationMs`
   *   2. a counter shows `countdownSeconds` and ticks down once per second
   *   3. on 0 the counter hides and the water drains back to `waterLevel`
   * Returns a Promise that resolves when everything is done.
   */
  startSequence(countdownSeconds: number): Promise<void> {
    if (this.running) return Promise.resolve();
    this.running = true;
    const secs = Math.max(0, Math.round(countdownSeconds));
    const fillStartMs = Date.now();
    return this.animateLevel(1, this.fillDurationMs)
      .then(() => {
        const elapsed = Math.round((Date.now() - fillStartMs) / 1000);
        return this.runCountdown(Math.max(0, secs - elapsed));
      })
      .then(() => this.animateLevel(this.waterLevel, this.drainDurationMs))
      .then(() => {
        this.running = false;
        this.zone.run(() => this.sequenceEnd.emit());
      });
  }

  /** Abort an in-progress sequence and snap back to the default level. */
  cancelSequence() {
    cancelAnimationFrame(this.raf);
    clearTimeout(this.timer);
    this.running = false;
    this.countdown = null;
    this.level = this.waterLevel;
    this.recompute();
    this.cdr.detectChanges();
  }

  // ---- internals ----
  private animateLevel(to: number, durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      const from = this.level;
      const start = performance.now();
      const ease = (t: number) =>
        t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / durationMs);
        this.level = from + (to - from) * ease(p);
        this.recompute();
        this.cdr.detectChanges();
        if (p < 1) this.raf = requestAnimationFrame(tick);
        else resolve();
      };
      // Run outside Angular so we don't trigger global change detection 60x/s
      this.zone.runOutsideAngular(() => {
        this.raf = requestAnimationFrame(tick);
      });
    });
  }

  private runCountdown(seconds: number): Promise<void> {
    return new Promise((resolve) => {
      let remaining = seconds;
      this.countdown = remaining;
      this.cdr.detectChanges();
      this.zone.run(() => this.countdownStart.emit(remaining));
      const step = () => {
        remaining -= 1;
        if (remaining <= 0) {
          this.countdown = null;
          this.cdr.detectChanges();
          this.zone.run(() => this.countdownEnd.emit());
          resolve();
        } else {
          this.countdown = remaining;
          this.cdr.detectChanges();
          this.zone.run(() => this.countdownTick.emit(remaining));
          this.timer = setTimeout(step, 1000);
        }
      };
      this.zone.runOutsideAngular(() => {
        this.timer = setTimeout(step, 1000);
      });
    });
  }

  private recompute() {
    const cx = (this.cx = this.glassCx * this.size);
    const cy = (this.cy = this.glassCy * this.size);
    const R = (this.R = this.glassR * this.size);
    const ampPx = R * this.waveAmp;
    const wavelength = (this.wavelength = (2 * R) / Math.max(0.5, this.waveCount));
    const x0 = cx - R - wavelength;
    const x1 = cx + R + wavelength;
    const bottomY = (this.bottomY = cy + R * 1.25);
    const surfaceY = (this.surfaceY = cy + R - this.level * (2 * R));
    // Clamp to avoid tiny negative values from floating-point error when the
    // water is full (surfaceY ≈ cy - R), which SVG rejects for <rect> height.
    this.airRectH = Math.max(0, surfaceY - (cy - R));
    this.dir = this.flowRight ? 1 : -1;
    this.strokeW = Math.max(1.5, this.size * 0.006);
    this.swayDur = Math.max(this.waveSpeed * 1.6, 5);

    // Lens geometry
    this.lensR = R * 0.78;
    this.lensX = cx - this.lensR;
    this.lensY = cy - this.lensR;
    this.lensS = this.lensR * 2;
    this.lensScale = R * 0.82;
    this.blinkPx = Math.max(1, this.size * 0.004);

    this.frontPath = buildWaterPath(x0, x1, surfaceY, bottomY, wavelength, ampPx, FRONT_H);
    this.backPath = buildWaterPath(x0, x1, surfaceY - R * 0.05, bottomY, wavelength, ampPx * 0.8, BACK_H);

    const k = (2 * Math.PI) / wavelength;
    const pts: { x: number; y: number }[] = [];
    const step = Math.max(3, wavelength / 22);
    for (let x = x0; x <= x1 + 0.0001; x += step) {
      let y = surfaceY;
      for (const h of FRONT_H) y -= ampPx * h.amp * Math.sin(k * h.mult * x + h.phase);
      pts.push({ x, y });
    }
    this.surfaceLine = smoothOpenPath(pts);

    const rand = pwRand(7);
    this.bubbles = [];
    for (let i = 0; i < this.bubbleCount; i++) {
      const bx = cx - R * 0.85 + rand() * (R * 1.7);
      const startY = bottomY - rand() * (bottomY - surfaceY) * 0.4 - 4;
      const rise = (startY - surfaceY) + rand() * R * 0.2;
      this.bubbles.push({
        x: bx, y: startY, r: 1.4 + rand() * (this.size * 0.012),
        rise: Math.max(rise, R * 0.3),
        dur: this.bubbleSpeed * (0.7 + rand() * 0.9),
        delay: -rand() * this.bubbleSpeed * 1.5,
        drift: (rand() - 0.5) * R * 0.12,
      });
    }
  }
}
