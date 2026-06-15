import { Injectable } from '@angular/core';

/**
 * Servicio para manejar todos los efectos de sonido del juego.
 * Proporciona control centralizado de audio con opciones de volumen y silencio.
 */
@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private clickSound: HTMLAudioElement | null = null;
  private buttonSound: HTMLAudioElement | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.3; // Volumen por defecto (30%)
  private isLoaded: boolean = false;
  private isButtonLoaded: boolean = false;

  // Throttling para evitar reproducción excesiva en giros rápidos
  private minTimeBetweenClicks: number = 70; // Milisegundos mínimos entre clicks (50ms = máx 20 clicks/seg)
  private lastClickTime: number = 0;

  constructor() {
    this.initializeAudio();
  }

  /**
   * Inicializa el audio pre-cargando los archivos de sonido
   */
  private initializeAudio(): void {
    try {
      // Inicializar sonido de click
      this.clickSound = new Audio('/assets/audio/click.mp3');
      this.clickSound.volume = this.volume;
      this.clickSound.load();

      this.clickSound.addEventListener('canplaythrough', () => {
        this.isLoaded = true;
      }, { once: true });

      this.clickSound.addEventListener('error', (e) => {
        console.warn('Error cargando audio de click:', e);
        this.isLoaded = false;
      });

      // Inicializar sonido de botón
      this.buttonSound = new Audio('/assets/audio/button.mp3');
      this.buttonSound.volume = this.volume;
      this.buttonSound.load();

      this.buttonSound.addEventListener('canplaythrough', () => {
        this.isButtonLoaded = true;
      }, { once: true });

      this.buttonSound.addEventListener('error', (e) => {
        console.warn('Error cargando audio de botón:', e);
        this.isButtonLoaded = false;
      });
    } catch (error) {
      console.warn('No se pudo inicializar el audio:', error);
      this.clickSound = null;
      this.buttonSound = null;
    }
  }

  /**
   * Reproduce el sonido de click con throttling para evitar reproducción excesiva.
   * El sonido se reproduce solo si ha pasado el tiempo mínimo desde el último click.
   */
  public playClick(): void {
    if (!this.isEnabled || !this.clickSound || !this.isLoaded) {
      return;
    }

    // Throttling: verificar si ha pasado suficiente tiempo desde el último click
    const currentTime = Date.now();
    const timeSinceLastClick = currentTime - this.lastClickTime;

    if (timeSinceLastClick < this.minTimeBetweenClicks) {
      // Demasiado pronto, ignorar este click
      return;
    }

    this.lastClickTime = currentTime;

    try {
      // Reiniciar el audio al inicio para permitir clicks rápidos
      this.clickSound.currentTime = 0;

      // Reproducir el sonido
      const playPromise = this.clickSound.play();

      // Manejar la promesa de reproducción (requerido por algunos navegadores)
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Silenciar errores de reproducción automática
          console.debug('Audio play prevented:', error);
        });
      }
    } catch (error) {
      // Silenciar errores de reproducción
      console.debug('Error playing click sound:', error);
    }
  }

  /**
   * Reproduce el sonido del botón cuando se presiona el yin-yang central.
   * Este sonido se reproduce al activarse la animación de presión del botón.
   */
  public playButton(): void {
    if (!this.isEnabled || !this.buttonSound || !this.isButtonLoaded) {
      return;
    }

    try {
      // Reiniciar el audio al inicio
      this.buttonSound.currentTime = 0;

      // Reproducir el sonido
      const playPromise = this.buttonSound.play();

      // Manejar la promesa de reproducción
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.debug('Audio play prevented:', error);
        });
      }
    } catch (error) {
      console.debug('Error playing button sound:', error);
    }
  }

  /**
   * Habilita o deshabilita todos los sonidos del juego
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Establece el volumen del audio (0.0 a 1.0)
   */
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.clickSound) {
      this.clickSound.volume = this.volume;
    }
    if (this.buttonSound) {
      this.buttonSound.volume = this.volume;
    }
  }

  /**
   * Obtiene el volumen actual
   */
  public getVolume(): number {
    return this.volume;
  }
}
