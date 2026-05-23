
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface Bubble {
  x: number;
  y: number;
  r: number;
  o: number;
  fadeDur: number;
  fadeDelay: number;
}

// ---------- helpers ----------
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothClosedPath(points: { x: number; y: number }[]): string {
  const n = points.length;
  const get = (i: number) => points[((i % n) + n) % n];
  let d = `M${get(0).x.toFixed(2)},${get(0).y.toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(
      2,
    )} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d + ' Z';
}

function irregularRingPath(
  cx: number,
  cy: number,
  base: number,
  amps: number[],
  freqs: number[],
  phases: number[],
  steps = 80,
): string {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    let r = base;
    for (let k = 0; k < amps.length; k++) {
      r += amps[k] * Math.sin(t * freqs[k] + phases[k]);
    }
    pts.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) });
  }
  return smoothClosedPath(pts);
}

function ringWavePath(
  cx: number,
  cy: number,
  base: number,
  amp: number,
  freq: number,
  phase: number,
  steps = 320,
): string {
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const r = base + amp * Math.sin(t * freq + phase);
    const x = cx + r * Math.cos(t);
    const y = cy + r * Math.sin(t);
    d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2) + ' ';
  }
  return d + 'Z';
}

@Component({
  selector: 'app-water-ring',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: inline-block;
        position: relative;
        line-height: 0;
      }
      @keyframes water-ring-spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
      .wr-rot {
        transform-origin: center;
        animation: water-ring-spin var(--rot-dur, 12s) linear infinite;
      }
      .wr-rot-slow {
        transform-origin: center;
        animation: water-ring-spin var(--rot-dur-slow, 26.4s) linear infinite;
      }
      .wr-rot-bubbles {
        transform-origin: center;
        animation: water-ring-spin var(--rot-dur-bubbles, 19.2s) linear infinite;
      }
    `,
  ],
  template: `
    <svg
      [attr.width]="canvas"
      [attr.height]="canvas"
      [attr.viewBox]="'0 0 ' + canvas + ' ' + canvas"
      [style.overflow]="'visible'"
      [style.position]="'absolute'"
      [style.left.px]="-pad"
      [style.top.px]="-pad"
      [style.pointer-events]="'none'"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient [attr.id]="uid + '-strand'" cx="50%" cy="50%" r="50%">
          <stop
            [attr.offset]="(ringRatio - ringWidth * 0.5) * 100 + '%'"
            [attr.stop-color]="darkColor"
            stop-opacity="0"
          />
          <stop
            [attr.offset]="(ringRatio - ringWidth * 0.25) * 100 + '%'"
            [attr.stop-color]="darkColor"
            stop-opacity="0.95"
          />
          <stop [attr.offset]="ringRatio * 100 + '%'" [attr.stop-color]="color" stop-opacity="1" />
          <stop
            [attr.offset]="(ringRatio + ringWidth * 0.25) * 100 + '%'"
            [attr.stop-color]="lightColor"
            stop-opacity="1"
          />
          <stop
            [attr.offset]="(ringRatio + ringWidth * 0.5) * 100 + '%'"
            [attr.stop-color]="lightColor"
            stop-opacity="0"
          />
        </radialGradient>

        <filter
          [attr.id]="uid + '-glow'"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feGaussianBlur [attr.stdDeviation]="size * 0.004" />
        </filter>

        <radialGradient [attr.id]="uid + '-spec'" cx="35%" cy="20%" r="55%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85" />
          <stop offset="45%" stop-color="#ffffff" stop-opacity="0.15" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>

        <mask [attr.id]="uid + '-ring-mask'">
          <rect
            [attr.x]="-canvas"
            [attr.y]="-canvas"
            [attr.width]="canvas * 3"
            [attr.height]="canvas * 3"
            fill="black"
          />
          <g class="wr-rot-slow" [style.--rot-dur-slow]="speed * 2.2 + 's'">
            <path [attr.d]="outerWaveFrames[0]" fill="white">
              <animate
                attributeName="d"
                [attr.dur]="outerWaveSpeed + 's'"
                [attr.values]="outerWaveFramesStr"
                repeatCount="indefinite"
                calcMode="spline"
                [attr.keySplines]="outerWaveKeySplines"
              />
            </path>
          </g>
          <circle [attr.cx]="cx" [attr.cy]="cy" [attr.r]="innerR" fill="black" />
        </mask>
      </defs>

      <!-- Rotating water mass + strands -->
      <g class="wr-rot" [style.--rot-dur]="speed + 's'">
        <g [attr.mask]="'url(#' + uid + '-ring-mask)'">
          <circle
            [attr.cx]="cx"
            [attr.cy]="cy"
            [attr.r]="baseR + size * ringWidth * 0.5"
            [attr.fill]="color"
            opacity="0.18"
          />
        </g>

        <g
          [attr.mask]="'url(#' + uid + '-ring-mask)'"
          [attr.filter]="'url(#' + uid + '-glow)'"
        >
          <path
            *ngFor="let d of strandPaths; let i = index"
            [attr.d]="d"
            fill="none"
            [attr.stroke]="'url(#' + uid + '-strand)'"
            [attr.stroke-width]="stroke"
            stroke-linecap="round"
            [attr.opacity]="0.85 - (i * 0.15) / strands"
          />
        </g>
      </g>

      <!-- Bubbles (no mask — can extend past the water edge) -->
      <g class="wr-rot-bubbles" [style.--rot-dur-bubbles]="speed * 1.6 + 's'">
        <g *ngFor="let b of bubbles; let i = index" [attr.opacity]="bubbleFade ? 0 : b.o">
          <ng-container *ngIf="bubbleFade">
            <animate
              attributeName="opacity"
              [attr.values]="'0;' + b.o + ';' + b.o + ';0'"
              keyTimes="0;0.25;0.75;1"
              [attr.dur]="b.fadeDur + 's'"
              [attr.begin]="b.fadeDelay + 's'"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.6 1;0 0 1 1;0.4 0 0.6 1"
            />
          </ng-container>
          <circle [attr.cx]="b.x" [attr.cy]="b.y" [attr.r]="b.r" fill="#ffffff" opacity="0.55" />
          <circle
            [attr.cx]="b.x - b.r * 0.3"
            [attr.cy]="b.y - b.r * 0.3"
            [attr.r]="b.r * 0.35"
            fill="#ffffff"
            opacity="0.9"
          />
        </g>
      </g>

      <!-- Specular highlight (static — like real light) -->
      <g
        *ngIf="showHighlight"
        [attr.mask]="'url(#' + uid + '-ring-mask)'"
        [style.pointer-events]="'none'"
      >
        <rect
          [attr.width]="canvas"
          [attr.height]="canvas"
          [attr.fill]="'url(#' + uid + '-spec)'"
        />
      </g>
    </svg>
  `,
})
export class WaterRingComponent implements OnChanges {
  @Input() size = 320;
  @Input() color = '#3087aa';
  @Input() lightColor = '#80b2c0';
  @Input() darkColor = '#146788';
  @Input() speed = 35;
  @Input() strands = 10;
  @Input() waves = 10;
  @Input() amp = 0.315;
  @Input() bubbleCount = 40;
  @Input() ringRatio = 0.78;
  @Input() ringWidth = 0.32;
  @Input() showHighlight = true;
  @Input() outerWaveAmp = 0.015;
  @Input() outerWaveFreq = 4;
  @Input() outerWaveSpeed = 9;
  @Input() outerKeyframes = 8;
  @Input() bubbleSpread = 1.5;
  @Input() bubbleFade = true;
  @Input() bubbleFadeSpeed = 10;

  uid = 'wr' + Math.random().toString(36).slice(2, 8);

  // Computed geometry
  pad = 0;
  canvas = 0;
  cx = 0;
  cy = 0;
  baseR = 0;
  outerR = 0;
  innerR = 0;
  stroke = 0;
  strandPaths: string[] = [];
  outerWaveFrames: string[] = [];
  outerWaveFramesStr = '';
  outerWaveKeySplines = '';
  bubbles: Bubble[] = [];

  ngOnChanges(_: SimpleChanges) {
    this.recompute();
  }

  ngOnInit() {
    this.recompute();
  }

  private recompute() {
    this.pad = Math.ceil(this.size * (this.outerWaveAmp * 2.2 + 0.15));
    this.canvas = this.size + this.pad * 2;
    this.cx = this.canvas / 2;
    this.cy = this.canvas / 2;
    this.baseR = (this.size / 2) * this.ringRatio;
    this.stroke = this.size * this.ringWidth * 0.55;
    this.outerR = this.baseR + this.size * this.ringWidth * 0.5;
    this.innerR = this.baseR - this.size * this.ringWidth * 0.5;
    const ampPx = this.size * this.amp;

    // Strands
    this.strandPaths = [];
    for (let i = 0; i < this.strands; i++) {
      const phase = (i / this.strands) * Math.PI * 2;
      this.strandPaths.push(
        ringWavePath(this.cx, this.cy, this.baseR, ampPx, this.waves, phase),
      );
    }

    // Outer wave keyframes (seamless loop — integer cycles per harmonic)
    const a1 = this.size * this.outerWaveAmp;
    const a2 = a1 * 0.55;
    const a3 = a1 * 0.3;
    const f1 = this.outerWaveFreq;
    const f2 = this.outerWaveFreq * 1.7 + 1;
    const f3 = this.outerWaveFreq * 0.6 + 0.5;
    const baseOut = this.outerR + a1 * 0.15;
    const TWO_PI = Math.PI * 2;
    const c1 = 1, c2 = 2, c3 = -1;
    this.outerWaveFrames = [];
    for (let k = 0; k <= this.outerKeyframes; k++) {
      const u = k / this.outerKeyframes;
      const p1 = u * TWO_PI * c1;
      const p2 = u * TWO_PI * c2 + 0.5;
      const p3 = u * TWO_PI * c3 + 1.8;
      this.outerWaveFrames.push(
        irregularRingPath(this.cx, this.cy, baseOut, [a1, a2, a3], [f1, f2, f3], [p1, p2, p3]),
      );
    }
    this.outerWaveFramesStr = this.outerWaveFrames.join(';');
    this.outerWaveKeySplines = this.outerWaveFrames
      .slice(1)
      .map(() => '0.42 0 0.58 1')
      .join(';');

    // Bubbles
    const rand = mulberry32(42);
    const maxInward = this.size * this.outerWaveAmp * (1 + 0.55 + 0.3);
    const inner = this.innerR + this.size * 0.008;
    const safeOuter = this.outerR - maxInward - this.size * 0.012;
    const outer = inner + Math.max(safeOuter - inner, 0) * this.bubbleSpread;
    const span = Math.max(outer - inner, 0);
    this.bubbles = [];
    for (let i = 0; i < this.bubbleCount; i++) {
      const t = rand() * Math.PI * 2;
      const u = this.bubbleSpread > 0.7 ? Math.pow(rand(), 0.7) : rand();
      const r = inner + u * span;
      this.bubbles.push({
        x: this.cx + r * Math.cos(t),
        y: this.cy + r * Math.sin(t),
        r: 1.2 + rand() * (this.size * 0.012),
        o: 0.5 + rand() * 0.5,
        fadeDur: this.bubbleFadeSpeed * (0.6 + rand() * 0.8),
        fadeDelay: -rand() * this.bubbleFadeSpeed * 2,
      });
    }
  }
}
