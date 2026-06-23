/**
 * reveal.service.ts
 * ---------------------------------------------------------------------------
 * Servicio que dispara la animación de "Resultado Spin" y resuelve las rutas
 * de las imágenes de forma DINÁMICA.
 *
 * Equivalente 1:1 al prototipo HTML (Reveal Prototipo.html):
 *   - texto normal (azul neón) o secuencia "hype" (dorado, ráfagas + parpadeos)
 *   - dos imágenes en círculo con anillo de color por jugada
 *   - franjas diagonales detrás de cada anillo
 *   - oscurecer + blur, convergencia final al centro
 *
 * Uso típico:
 *
 *   constructor(private reveal: RevealService) {}
 *
 *   async resultado() {
 *     await this.reveal.play({
 *       leftImage:  'DELFIN.png',
 *       rightImage: 'ZORRO.png',
 *       leftThemeColor:  '#128DFC',
 *       rightThemeColor: '#FFE28F',
 *       text: 'DUPLA',
 *       hype: true,            // o playNormal() => hype:false
 *     });
 *   }
 * ---------------------------------------------------------------------------
 */

import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

/** Parámetros por defecto. Sobrescribibles por llamada. */
export const REVEAL_DEFAULTS = {
  enterMs: 2500, // fase de entrada
  holdMs: 5000, // fase "espera" / reposo
  exitMs: 2500, // fase de salida (franjas + encoger + aclarar)
  shrinkScale: 0.1, // escala final de los círculos (10%)
  textY: 30, // posición vertical del texto (+30vh)
  bursts: 3, // textos por ola en la secuencia hype
  waves: 5, // ráfagas: veces que se reproduce cada lado
  leftThemeColor: '#128DFC',
  rightThemeColor: '#FFE28F',
};

export interface RevealConfig {
  /** filename o URL de la imagen izquierda (p.ej. 'DELFIN.png'). */
  leftImage: string;
  /** filename o URL de la imagen derecha. */
  rightImage: string;
  /** texto grande a dibujar (p.ej. 'DUPLA') */
  text: string;
  /** color del anillo / franja izquierda (def. '#128DFC') */
  leftThemeColor?: string;
  /** color del anillo / franja derecha (def. '#FFE28F') */
  rightThemeColor?: string;
  /** etiqueta opcional bajo el círculo izquierdo */
  leftName?: string;
  /** etiqueta opcional bajo el círculo derecho */
  rightName?: string;
  /** duración de la fase de entrada en ms (def. 2500) */
  enterMs?: number;
  /** duración de la fase "espera" / reposo en ms (def. 5000) */
  holdMs?: number;
  /** duración de la fase de salida en ms (def. 2500) */
  exitMs?: number;
  /** escala final de los círculos al encogerse, 0–1 (def. 0.1) */
  shrinkScale?: number;
  /** posición vertical del texto en vh respecto al centro (def. 30) */
  textY?: number;
  /** textos por ola en la secuencia hype (def. 3) */
  bursts?: number;
  /** ráfagas: veces que se reproduce cada lado (def. 5) */
  waves?: number;
  /**
   * true => secuencia "hype" (dorada, ráfagas). false => texto normal (azul).
   * Si se omite, se activa cuando text === 'DUPLA'.
   */
  hype?: boolean;
}

@Injectable({ providedIn: 'root' })
export class RevealService {
  /**
   * Base dinámica para resolver filenames de animales relativos.
   *   this.reveal.animalsBasePath = 'assets/images/animales-sin-fondo/';
   *   this.reveal.animalsBasePath = 'https://cdn.misitio.com/animales/';
   */
  animalsBasePath = 'assets/images/animales-sin-fondo/';

  /** Imágenes decorativas de "rueda resultado" (detrás de cada círculo). */
  resultadoIzqSrc = 'assets/images/contenedores/rueda-resultado-izquierda.png';
  resultadoDerSrc = 'assets/images/contenedores/rueda-resultado-derecha.png';

  private playSubject = new Subject<RevealConfig>();
  private doneSubject = new Subject<RevealConfig>();

  /** El overlay se suscribe a esto. */
  play$: Observable<RevealConfig> = this.playSubject.asObservable();
  /** Emite cuando una animación termina. */
  done$: Observable<RevealConfig> = this.doneSubject.asObservable();

  /** Resuelve un filename/URL de animal a ruta usable por <img src>. */
  resolveAnimal(src: string): string {
    if (!src) return src;
    if (/^(https?:|data:|blob:|file:|\/\/|\/)/i.test(src)) return src;
    const base = this.animalsBasePath.endsWith('/')
      ? this.animalsBasePath
      : this.animalsBasePath + '/';
    return base + src;
  }

  /** Reproduce la animación. La promesa resuelve al terminar. */
  play(config: RevealConfig): Promise<void> {
    const merged: RevealConfig = {
      ...REVEAL_DEFAULTS,
      hype: (config.text || '').trim().toUpperCase() === 'DUPLA',
      ...config,
    };
    this.playSubject.next(merged);
    return new Promise((resolve) => {
      const sub = this.done$.subscribe(() => {
        sub.unsubscribe();
        resolve();
      });
    });
  }

  /** Atajo: texto normal (azul). */
  playNormal(config: Omit<RevealConfig, 'hype'>): Promise<void> {
    return this.play({ ...config, hype: false });
  }

  /** Atajo: secuencia hype (dorada). */
  playHype(config: Omit<RevealConfig, 'hype'>): Promise<void> {
    return this.play({ ...config, hype: true });
  }

  /** Llamado por el overlay al terminar. */
  emitDone(config: RevealConfig) {
    this.doneSubject.next(config);
  }
}
