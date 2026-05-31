/**
 * reveal.service.ts
 * ---------------------------------------------------------------------------
 * Servicio que dispara la animación de resultado "Dupla" y resuelve las rutas
 * de las imágenes de forma DINÁMICA.
 *
 * Las imágenes pueden venir de cualquier origen:
 *   - assets locales            -> 'assets/animals/animal_03.png'
 *   - una URL absoluta / CDN     -> 'https://cdn.misitio.com/animals/zorro.png'
 *   - el filesystem de Capacitor -> Capacitor.convertFileSrc(uri)
 *   - tu backend (data-url, etc.)
 *
 * Cómo se resuelve cada ruta (método `resolve`):
 *   1. Si el valor ya es una URL absoluta (http/https/data/blob/file/// ) o
 *      empieza por '/', se usa TAL CUAL.
 *   2. Si no, se concatena con `basePath` (configurable) -> ruta dinámica.
 * ---------------------------------------------------------------------------
 */

import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

/** Duraciones/parámetros por defecto. Sobrescribibles por llamada. */
export const REVEAL_DEFAULTS = {
  enterMs: 2500, // fase de entrada
  holdMs: 10000, // fase "showing" / reposo
  exitMs: 2500, // fase de salida (encoger + aclarar)
  shrinkScale: 0.1, // escala final de los círculos (10%)
  textY: 30, // posición vertical del texto (+30vh)
  bursts: 3, // textos por ola en la secuencia hype (MOROCHA)
  waves: 5, // ráfagas: veces que se reproduce cada lado (MOROCHA)
};

export interface RevealConfig {
  /** filename o URL de la imagen izquierda. Se resuelve con `resolve()`. */
  leftImage: string;
  /** filename o URL de la imagen derecha. */
  rightImage: string;
  /** texto grande delineado a dibujar (p.ej. 'DUPLA') */
  text: string;
  /** duración de la fase de entrada en ms (por defecto 2500) */
  enterMs?: number;
  /** duración de la fase "showing" / reposo en ms (por defecto 10000) */
  holdMs?: number;
  /** duración de la fase de salida en ms (por defecto 2500) */
  exitMs?: number;
  /** escala final de los círculos al encogerse, 0–1 (por defecto 0.1) */
  shrinkScale?: number;
  /** posición vertical del texto en vh respecto al centro (por defecto 0) */
  textY?: number;
  /** cantidad de textos por ola en la secuencia hype / MOROCHA (por defecto 7) */
  bursts?: number;
  /** cantidad de ráfagas (veces que se reproduce cada lado) (por defecto 2) */
  waves?: number;
  /**
   * fuerza la secuencia "hype" (ráfaga + parpadeos + aterrizaje final).
   * Si se omite, se activa automáticamente cuando text === 'MOROCHA'.
   */
  hype?: boolean;
}

@Injectable({ providedIn: 'root' })
export class RevealService {
  /**
   * Base dinámica para resolver filenames relativos. Cámbiala en runtime
   * (p.ej. según idioma, tema o entorno):
   *
   *   this.reveal.basePath = 'assets/animals/';
   *   this.reveal.basePath = 'https://cdn.misitio.com/animals/';
   */
  basePath = 'assets/animals/';

  /**
   * Pool de X imágenes que el juego puede reproducir. Pueden ser filenames
   * (se resuelven con basePath) o URLs absolutas. Solo se reproducen 2 por
   * animación. Cárgalo dinámicamente desde tu backend si lo necesitas:
   *
   *   this.http.get<string[]>('/api/animals').subscribe(p => this.reveal.pool = p);
   */
  private playSubject = new Subject<RevealConfig>();
  private doneSubject = new Subject<RevealConfig>();

  /** El overlay se suscribe a esto. */
  play$: Observable<RevealConfig> = this.playSubject.asObservable();
  /** Emite cuando una animación termina (útil para encadenar lógica). */
  done$: Observable<RevealConfig> = this.doneSubject.asObservable();

  /**
   * Resuelve un filename/URL a una ruta usable por <img src>.
   * URLs absolutas o rutas que empiezan por '/' se devuelven sin tocar;
   * el resto se concatenan con `basePath`.
   */
  resolve(src: string): string {
    if (!src) return src;
    if (/^(https?:|data:|blob:|file:|\/\/|\/|assets\/)/i.test(src)) return src;
    const base = this.basePath.endsWith('/') ? this.basePath : this.basePath + '/';
    return base + src;
  }

  /** Reproduce la animación con dos imágenes y un texto concretos. */
  play(config: RevealConfig): Promise<void> {
    this.playSubject.next({
      ...REVEAL_DEFAULTS,
      ...config,
      // resolución dinámica de rutas
      leftImage: this.resolve(config.leftImage),
      rightImage: this.resolve(config.rightImage),
    });
    return new Promise((resolve) => {
      const sub = this.done$.subscribe(() => {
        sub.unsubscribe();
        resolve();
      });
    });
  }

  emitDone(config: RevealConfig) {
    this.doneSubject.next(config);
  }
}
