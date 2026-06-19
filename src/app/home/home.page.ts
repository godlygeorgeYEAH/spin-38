import { Component, ViewChild, ChangeDetectorRef, OnInit, ElementRef, AfterViewInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { WheelContainerComponent } from '../components/wheel-container/wheel-container.component';
import { GameSettingsComponent } from '../components/game-settings/game-settings.component';
import { ResultsHistoryPanelComponent } from '../components/results-history-panel/results-history-panel.component';
import { JackpotDisplayComponent } from '../components/jackpot-display/jackpot-display.component';
import { WheelItem } from '../interfaces/wheel-general.interface';
import { ANIMAL_MAP } from '../data/animal-map';
import { RevealService } from '../components/results-animation/reveal.service';
import { WHEEL_PALETTES, ACTIVE_PALETTE } from '../components/wheel-container/wheel-palettes';
import { GameSettings } from '../interfaces/game-settings.interface';
import { GameState } from '../interfaces/game.enums';
import { AdminAuthService } from '../services/admin-auth.service';
import { DevicePerformanceTier, PerformanceDetectorService } from '../services/performance-detector.service';
import { ApiService } from '../services/api.service';
import { RoundOrchestratorService } from '../services/round-orchestrator.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.css'],
  standalone: true,
  imports: [
    IonContent, CommonModule,
    WheelContainerComponent, GameSettingsComponent,
    ResultsHistoryPanelComponent, JackpotDisplayComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(WheelContainerComponent) wheelContainer!: WheelContainerComponent;
  @ViewChild('backgroundVideo') backgroundVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('owlCanvas') owlCanvasRef?: ElementRef<HTMLCanvasElement>;

  public gameState: GameState = GameState.IDLE;

  // reloj
  public clockTime: string = '';
  private clockIntervalId: any = null;
  private resetInProgress: Promise<void> | null = null;

  // buho gif aleatorio
  // true = GIF siempre visible y animado (para posicionamiento/dev)
  // false = comportamiento normal (frame estático + disparo aleatorio)
  private readonly OWL_DEV_MODE = true;
  public owlGifSrc = 'assets/images/contenedores/buho.gif';
  public owlAnimating = false;
  private owlTimer: any = null;
  private readonly OWL_DURATION_MS = 700; // 7 frames × ~100ms — ajustar si es necesario
  public showSettings: boolean = false;
  public showJackpot: boolean = false;
  public isWheelDisplaced: boolean = false; // Controla el desplazamiento de la rueda
  public resultsPanelClass: '' | 'panel-exit' | 'panel-enter' = '';

  // Volumen de sonidos de interfaz (0-100)
  public uiVolume: number = 50;
  private readonly UI_VOLUME_KEY = 'uiVolume';

  // Sistema de carga de assets
  public isLoading: boolean = true;
  public loadingProgress: number = 0;

  // Suscripciones al orquestador, liberadas en ngOnDestroy
  private subs = new Subscription();

  public readonly animalsForWheel: WheelItem[] = [
    { position: '0' }, { position: '28' }, { position: '9' },  { position: '26' },
    { position: '30' }, { position: '11' }, { position: '7' },  { position: '20' },
    { position: '32' }, { position: '17' }, { position: '5' },  { position: '22' },
    { position: '34' }, { position: '15' }, { position: '3' },  { position: '24' },
    { position: '36' }, { position: '13' }, { position: '1' },  { position: '00' },
    { position: '27' }, { position: '10' }, { position: '25' }, { position: '29' },
    { position: '12' }, { position: '8' },  { position: '19' }, { position: '31' },
    { position: '18' }, { position: '6' },  { position: '21' }, { position: '33' },
    { position: '16' }, { position: '4' },  { position: '23' }, { position: '35' },
    { position: '14' }, { position: '2' },
  ];
  public spinDuration: number = 10000; // Duración rueda externa
  public innerWheelSpinDuration: number = 12000; // Duración rueda interna (multiplicadores)
  public expansionRange: number = 180;

  // Audio para botones de interfaz
  private pressAudio: HTMLAudioElement;

  constructor(
    private cdr: ChangeDetectorRef,
    private adminAuth: AdminAuthService,
    private performanceDetector: PerformanceDetectorService,
    private apiService: ApiService,
    public orchestrator: RoundOrchestratorService,
    private reveal: RevealService
  ) {
    // Cargar volumen de interfaz desde localStorage
    const savedUIVolume = localStorage.getItem(this.UI_VOLUME_KEY);
    if (savedUIVolume !== null) {
      this.uiVolume = parseInt(savedUIVolume, 10);
    }

    // Inicializar audio con el volumen guardado
    this.pressAudio = new Audio('assets/audio/press.mp3');
    this.pressAudio.volume = this.uiVolume / 100;

    this.loadSettings();
    this.setupAdminCommands();
  }

  ngOnInit(): void {
    this.gameState = GameState.IDLE;
    this.showSettings = false;
    this.isWheelDisplaced = false; // La rueda empieza centrada

    // Iniciar precarga de assets
    this.preloadAssets();
    this.startClock();
    if (this.OWL_DEV_MODE) {
      this.owlAnimating = true;
    } else {
      this.scheduleOwlAnimation();
    }
  }

  private captureOwlFirstFrame(): void {
    const img = new Image();
    img.onload = () => {
      const canvas = this.owlCanvasRef?.nativeElement;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')?.drawImage(img, 0, 0);
    };
    img.src = 'assets/images/contenedores/buho.gif';
  }

  private scheduleOwlAnimation(): void {
    const delay = 5000 + Math.random() * 10000;
    this.owlTimer = setTimeout(() => {
      this.owlGifSrc = `assets/images/contenedores/buho.gif?t=${Date.now()}`;
      this.owlAnimating = true;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.owlAnimating = false;
        this.cdr.markForCheck();
        this.scheduleOwlAnimation();
      }, this.OWL_DURATION_MS);
    }, delay);
  }

  private startClock(): void {
    this.updateClockTime();
    this.clockIntervalId = window.setInterval(() => {
      this.updateClockTime();
    }, 1000);
  }

  private updateClockTime(): void {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    this.clockTime = `${hours}:${minutes}`;
    this.cdr.markForCheck();
  }

  ngAfterViewInit(): void {
    if (!this.isXiaomiBrowser()) {
      this.setupBackgroundVideo();
    } else if (this.backgroundVideo?.nativeElement) {
      this.backgroundVideo.nativeElement.style.display = 'none';
    }
    if (!this.OWL_DEV_MODE) {
      this.captureOwlFirstFrame();
    }

    // Reset de rueda: se dispara RESET_LEAD_SEC segundos antes de que termine el revealing
    this.subs.add(this.orchestrator.resetCommand$.subscribe(() => {
      if (!this.wheelContainer) return;
      this.resetInProgress = this.wheelContainer.resetToPosition().then(() => {
        this.resetInProgress = null;
      });
    }));

    // Al terminar el revealing: sincronizar estado de juego
    this.subs.add(this.orchestrator.revealComplete$.subscribe(() => {
      this.gameState = GameState.IDLE;
      this.cdr.markForCheck();
    }));

    this.subs.add(this.orchestrator.spinCommand$.subscribe(async cmd => {
      if (!this.wheelContainer || this.wheelContainer.spinning) return;

      if (this.resetInProgress) {
        await this.resetInProgress;
        if (!this.wheelContainer || this.wheelContainer.spinning) return;
      }

      this.gameState = GameState.PLAYING;
      this.cdr.markForCheck();
      this.wheelContainer.spinToResult(cmd)
        .then(async () => {
          // Notificar al orquestador en cuanto para la rueda, antes del overlay,
          // para que el safety guard no se adelante y no haya doble llamada.
          this.orchestrator.notifySpinComplete();
          this.gameState = GameState.RESULT;
          this.cdr.markForCheck();

          const label = cmd.resultLabel?.trim();
          if (label) {
            const isDupla = String(cmd.outerPosition) === String(cmd.innerPosition);
            const _palette = WHEEL_PALETTES[ACTIVE_PALETTE];
            await this.reveal.play({
              leftImage:  ANIMAL_MAP[String(cmd.outerPosition)]?.image       ?? '',
              rightImage: ANIMAL_MAP[String(cmd.innerPosition)]?.image       ?? '',
              leftName:   ANIMAL_MAP[String(cmd.outerPosition)]?.name        ?? '',
              rightName:  ANIMAL_MAP[String(cmd.innerPosition)]?.name        ?? '',
              text: label,
              hype: isDupla,
              collapseTarget: this.wheelContainer.getWheelCenterViewport() ?? undefined,
              leftThemeColor:  _palette.outerWheelColors[0].stops[0].color,
              rightThemeColor: _palette.innerWheelColors[0].stops[0].color,
            });
          }
        })
        .catch(err => {
          console.error('[HomePage] spinToResult falló:', err);
          this.orchestrator.notifySpinComplete();
          this.gameState = GameState.IDLE;
          this.cdr.markForCheck();
        });
    }));

    let _portholeSeconds = 0;
    this.subs.add(this.orchestrator.secondsToNextRound$.subscribe(s => { _portholeSeconds = s; }));

    this.subs.add(this.orchestrator.roundState$.subscribe(state => {
      if (state === 'COUNTING_DOWN') {
        this.resultsPanelClass = 'panel-enter';
        this.wheelContainer?.startPortholeSequence(_portholeSeconds);
      } else if (state === 'SPINNING') {
        this.resultsPanelClass = 'panel-exit';
      }
      // REVEALING e IDLE: panel permanece oculto — REVEALING reservado para animación de resultado
      this.cdr.markForCheck();
    }));

    this.orchestrator.start();
  }

  private isXiaomiBrowser(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('miuibrowser') || ua.includes('xiaomi');
  }

  public onAnticipation(): void {
    // Punto de extensión: disparar animación de anticipación en la rueda cuando el countdown llega a 0
  }

  ngOnDestroy(): void {
    this.orchestrator.stop();
    this.subs.unsubscribe();

    if (this.clockIntervalId !== null) {
      window.clearInterval(this.clockIntervalId);
      this.clockIntervalId = null;
    }

    if (this.owlTimer !== null) {
      clearTimeout(this.owlTimer);
      this.owlTimer = null;
    }

    // Limpiar listeners del video
    if (this.backgroundVideo?.nativeElement) {
      const video = this.backgroundVideo.nativeElement;
      video.removeEventListener('pause', this.onVideoPause);
      video.removeEventListener('ended', this.onVideoEnded);
    }
  }

  private setupBackgroundVideo(): void {
    if (!this.backgroundVideo?.nativeElement) return;

    const video = this.backgroundVideo.nativeElement;

    // Safari iOS requiere configuración específica
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.muted = true;
    video.defaultMuted = true;

    // Función para reiniciar el video cuando se pausa
    const onVideoPause = () => {
      console.log('Video pausado, reiniciando...');
      video.play().catch(err => console.error('Error al reproducir video:', err));
    };

    // Función para asegurar el loop seamless
    const onVideoEnded = () => {
      console.log('Video terminado, reiniciando...');
      video.currentTime = 0;
      video.play().catch(err => console.error('Error al reproducir video:', err));
    };

    // Función específica para cuando el video puede reproducirse (Safari)
    const onCanPlay = () => {
      console.log('Video listo para reproducir');
      video.play().catch(err => console.error('Error en canplay:', err));
    };

    // Guardar referencias para poder removerlas en ngOnDestroy
    this.onVideoPause = onVideoPause.bind(this);
    this.onVideoEnded = onVideoEnded.bind(this);

    // Agregar listeners
    video.addEventListener('pause', this.onVideoPause);
    video.addEventListener('ended', this.onVideoEnded);
    video.addEventListener('canplay', onCanPlay, { once: true });

    // Detectar cuando la página recupera el foco
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && video.paused) {
        console.log('Página visible, reiniciando video...');
        video.play().catch(err => console.error('Error al reproducir video:', err));
      }
    });

    // Safari requiere que load() sea llamado explícitamente
    video.load();

    // Forzar reproducción inicial después de un pequeño delay
    setTimeout(() => {
      video.play().catch(err => {
        console.error('Error al iniciar video:', err);
        // Intentar nuevamente después de un breve delay
        setTimeout(() => {
          video.play().catch(e => console.error('Segundo intento fallido:', e));
        }, 1000);
      });
    }, 100);
  }

  private onVideoPause: any;
  private onVideoEnded: any;

  private loadSettings(): void {
    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
      try {
        const settings: GameSettings = JSON.parse(savedSettings);
        this.spinDuration = settings.spinDuration;
        this.innerWheelSpinDuration = settings.innerWheelSpinDuration ?? 12000; // Default si no existe
        this.expansionRange = settings.expansionRange;
      } catch (e) {
        console.error('Error loading settings', e);
      }
    }
  }

  public openSettings(): void {
    this.playPressSound();
    this.showSettings = true;
  }

  public closeSettings(): void {
    this.showSettings = false;
  }

  /**
   * Maneja el cambio de volumen de interfaz desde el modal de configuración
   */
  public onUIVolumeChange(volume: number): void {
    this.uiVolume = volume;

    // Actualizar el volumen del audio de interfaz
    const volumeDecimal = volume / 100;
    this.pressAudio.volume = volumeDecimal;

    // Guardar en localStorage
    localStorage.setItem(this.UI_VOLUME_KEY, volume.toString());
  }

  /**
   * Reproduce el sonido cuando se presiona un botón de configuración
   */
  private playPressSound(): void {
    try {
      // Reiniciar el audio al inicio para permitir múltiples clicks rápidos
      this.pressAudio.currentTime = 0;
      this.pressAudio.play().catch(error => {
        // Ignorar errores de autoplay - el navegador puede bloquear el audio
        console.log('Audio bloqueado por el navegador:', error);
      });
    } catch (error) {
      console.error('Error al reproducir sonido de botón:', error);
    }
  }

  /**
   * Configura los comandos globales de administración en la consola del navegador
   */
  // Flags estáticos: persisten entre recreaciones del componente
  private static adminStartupShown = false;
  private static adminCommandsShown = false;
  private static adminCommandsSetup = false;

  private setupAdminCommands(): void {
    // Mensaje discreto al inicio — solo una vez por ciclo de vida de la página
    if (!HomePage.adminStartupShown) {
      console.log('%c🔐 Sistema admin disponible', 'color: #6b7280; font-size: 11px;');
      HomePage.adminStartupShown = true;
    }

    // Registrar los comandos en window una sola vez, incluso si el componente se recrea
    if (HomePage.adminCommandsSetup) return;
    HomePage.adminCommandsSetup = true;

    // Exponer comandos globales
    (window as any).adminLogin = (username: string, password: string) => {
      if (this.adminAuth.isAuthenticated()) return;
      const result = this.adminAuth.login(username, password);
      console.log(result);

      // Si login exitoso, mostrar comandos solo la primera vez (se resetea en logout)
      if (result.includes('✅') && !HomePage.adminCommandsShown) {
        HomePage.adminCommandsShown = true;
        this.showAdminCommands();
      }
    };

    (window as any).adminStatus = () => {
      console.log(this.adminAuth.status());
    };

    (window as any).adminChangePassword = (currentPassword: string, newPassword: string) => {
      console.log(this.adminAuth.changePassword(currentPassword, newPassword));
    };

    (window as any).adminResetPassword = () => {
      console.log(this.adminAuth.resetPassword());
    };

    (window as any).adminLogout = () => {
      HomePage.adminCommandsShown = false;
      console.log(this.adminAuth.logout());
    };

    // Comandos de configuración de ruedas
    (window as any).adminGetWheelDurations = () => {
      console.log(`🎡 Duración rueda externa: ${this.spinDuration}ms`);
      console.log(`🎡 Duración rueda interna: ${this.innerWheelSpinDuration}ms`);
    };

    (window as any).adminSetOuterWheelDuration = (duration: number) => {
      if (!this.adminAuth.isAuthenticated()) {
        console.log('❌ Debes estar autenticado para cambiar duración de ruedas\n💡 Usa: adminLogin("admin", "contraseña")');
        return;
      }
      if (typeof duration !== 'number' || duration < 1000 || duration > 30000) {
        console.log('❌ La duración debe ser un número entre 1000ms y 30000ms');
        return;
      }
      const oldDuration = this.spinDuration;
      this.spinDuration = duration;
      console.log(`✅ Duración rueda externa actualizada: ${oldDuration}ms → ${duration}ms`);

      // Validar que la interna sea >= externa
      if (this.innerWheelSpinDuration < duration) {
        console.warn(`⚠️ La rueda interna (${this.innerWheelSpinDuration}ms) es menor que la externa. Se recomienda ajustarla.`);
      }
    };

    (window as any).adminSetInnerWheelDuration = (duration: number) => {
      if (!this.adminAuth.isAuthenticated()) {
        console.log('❌ Debes estar autenticado para cambiar duración de ruedas\n💡 Usa: adminLogin("admin", "contraseña")');
        return;
      }
      if (typeof duration !== 'number' || duration < 1000 || duration > 30000) {
        console.log('❌ La duración debe ser un número entre 1000ms y 30000ms');
        return;
      }
      if (duration < this.spinDuration) {
        console.warn(`⚠️ La duración de la rueda interna (${duration}ms) es menor que la externa (${this.spinDuration}ms).`);
        console.warn(`   Se ajustará automáticamente a ${this.spinDuration}ms durante el giro.`);
      }
      const oldDuration = this.innerWheelSpinDuration;
      this.innerWheelSpinDuration = duration;
      console.log(`✅ Duración rueda interna actualizada: ${oldDuration}ms → ${duration}ms`);
    };

    (window as any).adminResetWheelDurations = () => {
      if (!this.adminAuth.isAuthenticated()) {
        console.log('❌ Debes estar autenticado para resetear duraciones de ruedas\n💡 Usa: adminLogin("admin", "contraseña")');
        return;
      }
      this.spinDuration = 10000;
      this.innerWheelSpinDuration = 12000;
      console.log('✅ Duraciones reseteadas - Externa: 10000ms, Interna: 12000ms');
    };

    // Comandos de rendimiento gráfico
    (window as any).adminGetPerformanceProfile = () => {
      const profile = this.wheelContainer['performanceProfile'];
      console.log('%c📊 PERFIL DE RENDIMIENTO ACTUAL', 'color: #10b981; font-weight: bold;');
      console.log('🎯 Tier:', profile.tier.toUpperCase());
      console.log('🎊 Confetti Particles:', profile.confettiParticles);
      console.log('🎬 Video Background:', profile.videoBackground ? 'ON' : 'OFF');
      console.log('💨 Backdrop Blur:', profile.backdropBlur ? 'ON' : 'OFF');
      console.log('🎨 Animation Quality:', profile.animationQuality);
    };

    // Giro manual
    (window as any).adminSpinManual = (outerPosition?: string, innerPosition?: string, text?: string) => {
      if (!this.adminAuth.isAuthenticated()) {
        console.log('❌ Debes estar autenticado para iniciar un giro manual\n💡 Usa: adminLogin("admin", "contraseña")');
        return;
      }
      const outer = outerPosition ?? this.animalsForWheel[Math.floor(Math.random() * this.animalsForWheel.length)].position;
      const inner = innerPosition ?? this.animalsForWheel[Math.floor(Math.random() * this.animalsForWheel.length)].position;
      console.log(this.orchestrator.triggerManualSpin(outer, inner, text));
    };

    (window as any).adminSpinResult = (text: string) => {
      if (!this.adminAuth.isAuthenticated()) {
        console.log('❌ Debes estar autenticado para iniciar un giro manual\n💡 Usa: adminLogin("admin", "contraseña")');
        return;
      }
      if (!text?.trim()) {
        console.log('❌ adminSpinResult requiere un texto. Ej: adminSpinResult("DUPLA ESPECIAL")');
        return;
      }
      const outer = this.animalsForWheel[Math.floor(Math.random() * this.animalsForWheel.length)].position;
      const inner = this.animalsForWheel[Math.floor(Math.random() * this.animalsForWheel.length)].position;
      console.log(this.orchestrator.triggerManualSpin(outer, inner, text));
    };

    // Ping al servidor
    (window as any).adminPingServer = () => {
      if (!this.adminAuth.isAuthenticated()) {
        console.log('❌ Debes estar autenticado para realizar el ping\n💡 Usa: adminLogin("admin", "contraseña")');
        return;
      }
      console.log('🏓 Realizando ping al servidor...');
      this.apiService.ping().subscribe(result => {
        console.log('%c📡 PING SERVIDOR', 'color: #10b981; font-weight: bold;');
        console.log(`🔗 Endpoint: ${result.endpoint}`);
        console.log(`⏱️  Latencia: ${result.latencyMs}ms`);
        console.log(`📊 Estado HTTP: ${result.status}`);
        console.log(result.ok ? '✅ Servidor disponible' : '❌ Servidor no disponible o con errores');
      });
    };

    // Estado de conexión con el servidor
    (window as any).adminConnectionStatus = () => {
      if (!this.adminAuth.isAuthenticated()) {
        console.log('❌ Debes estar autenticado\n💡 Usa: adminLogin("admin", "contraseña")');
        return;
      }
      console.log('%c📡 Observando connectionStatus$ — los cambios se imprimirán aquí', 'color: #6b7280; font-size: 11px;');
      const sub = this.orchestrator.connectionStatus$.subscribe(status => {
        if (status === 'online') {
          console.log('%c✅ connectionStatus$: online', 'color: #10b981; font-weight: bold;');
        } else {
          console.log('%c❌ connectionStatus$: offline', 'color: #ef4444; font-weight: bold;');
        }
      });
      console.log('💡 Guarda el retorno para detener: const s = adminConnectionStatus(); s.unsubscribe()');
      return sub;
    };

    (window as any).adminSetPerformanceTier = (tier: 'high' | 'medium' | 'low') => {
      if (!this.adminAuth.isAuthenticated()) {
        console.log('❌ Debes estar autenticado para cambiar el tier de rendimiento\n💡 Usa: adminLogin("admin", "contraseña")');
        return;
      }
      if (!['high', 'medium', 'low'].includes(tier)) {
        console.log('❌ Tier inválido. Usa: "high", "medium" o "low"');
        return;
      }

      const performanceService = this.wheelContainer['performanceDetector'];
      const enumTier = tier === 'high' ? DevicePerformanceTier.HIGH :
                       tier === 'medium' ? DevicePerformanceTier.MEDIUM :
                       DevicePerformanceTier.LOW;
      performanceService.setDeviceTier(enumTier);

      // Recargar página para aplicar cambios
      console.log('✅ Tier de rendimiento cambiado a: ' + tier.toUpperCase());
      console.log('🔄 Recarga la página para aplicar los cambios completamente');
      console.log('💡 Tip: Ejecuta location.reload() o presiona F5');
    };
  }

  /**
   * Muestra los comandos disponibles después de login exitoso
   */
  private showAdminCommands(): void {
    console.groupCollapsed('%c🎰 COMANDOS ADMIN — expandir para ver lista completa', 'color: #f59e0b; font-weight: bold; font-size: 13px;');
    console.log('%c🔐 AUTENTICACIÓN', 'color: #10b981; font-weight: bold;');
    console.log('%c• adminStatus()', 'color: #3b82f6;', '- Ver estado de sesión actual');
    console.log('%c• adminChangePassword(currentPass, newPass)', 'color: #3b82f6;', '- Cambiar contraseña');
    console.log('%c• adminResetPassword()', 'color: #3b82f6;', '- Resetear contraseña a default');
    console.log('%c• adminLogout()', 'color: #3b82f6;', '- Cerrar sesión');
    console.log('%c\n🎡 CONFIGURACIÓN DE RUEDAS', 'color: #10b981; font-weight: bold;');
    console.log('%c• adminGetWheelDurations()', 'color: #3b82f6;', '- Ver duraciones actuales de ambas ruedas');
    console.log('%c• adminSetOuterWheelDuration(ms)', 'color: #3b82f6;', '- Establecer duración rueda externa (1000-30000ms)');
    console.log('%c• adminSetInnerWheelDuration(ms)', 'color: #3b82f6;', '- Establecer duración rueda interna (1000-30000ms)');
    console.log('%c• adminResetWheelDurations()', 'color: #3b82f6;', '- Resetear duraciones (Externa: 10000ms, Interna: 12000ms)');
    console.log('%c\n⚡ RENDIMIENTO GRÁFICO', 'color: #10b981; font-weight: bold;');
    console.log('%c• adminGetPerformanceProfile()', 'color: #3b82f6;', '- Ver perfil de rendimiento actual');
    console.log('%c• adminSetPerformanceTier("tier")', 'color: #3b82f6;', '- Cambiar tier: "high", "medium" o "low"');
    console.log('%c\n🎮 CONTROL DE RONDA', 'color: #10b981; font-weight: bold;');
    console.log('%c• adminSpinManual(outerPos?, innerPos?, text?)', 'color: #3b82f6;', '- Giro manual local (posiciones opcionales como strings, ej. "17", "3"; text activa animación de resultado)');
    console.log('%c• adminSpinResult(text)', 'color: #3b82f6;', '- Giro con posiciones aleatorias y animación de resultado con el texto dado');;
    console.log('%c• adminPingServer()', 'color: #3b82f6;', '- Probar conexión: latencia y estado HTTP del servidor');
    console.log('%c• adminConnectionStatus()', 'color: #3b82f6;', '- Observar connectionStatus$ en tiempo real (retorna suscripción)');
    console.log('%c\n🎬 DEBUG ANIMACIÓN RESULTADO', 'color: #10b981; font-weight: bold;');
    console.log('%c• adminRevealFreeze()', 'color: #3b82f6;', '- Congelar animación de resultado (mantenerla visible indefinidamente)');
    console.log('%c• adminRevealUnfreeze()', 'color: #3b82f6;', '- Descongelar y cerrar la animación normalmente');
    console.groupEnd();
  }

  /**
   * Precarga todos los assets de la aplicación (imágenes, videos, SVGs)
   * y actualiza el progreso de carga
   */
  private async preloadAssets(): Promise<void> {
    // Lista de assets a precargar. Solo se incluyen rutas que existen en disco
    // y son usadas por la app, para no generar peticiones 404 en consola.
    const imagePaths: string[] = [
      // Logo
      'assets/images/logo/logo1.png',
      'assets/images/logo/rexludus.png',

      // Animales (set "sin fondo" usado por la ruleta)
      'assets/images/animales-sin-fondo/AGUILA.png',
      'assets/images/animales-sin-fondo/ALACRAN.png',
      'assets/images/animales-sin-fondo/ARDILLA.png',
      'assets/images/animales-sin-fondo/BALLENA.png',
      'assets/images/animales-sin-fondo/BURRO.png',
      'assets/images/animales-sin-fondo/CABALLO.png',
      'assets/images/animales-sin-fondo/CAIMAN.png',
      'assets/images/animales-sin-fondo/CAMELLO.png',
      'assets/images/animales-sin-fondo/CARNERO.png',
      'assets/images/animales-sin-fondo/CEBRA.png',
      'assets/images/animales-sin-fondo/CERDO.png',
      'assets/images/animales-sin-fondo/CHIVO.png',
      'assets/images/animales-sin-fondo/CIEMPIES.png',
      'assets/images/animales-sin-fondo/CULEBRA.png',
      'assets/images/animales-sin-fondo/DELFIN.png',
      'assets/images/animales-sin-fondo/ELEFANTE.png',
      'assets/images/animales-sin-fondo/GALLINA.png',
      'assets/images/animales-sin-fondo/GALLO.png',
      'assets/images/animales-sin-fondo/GATO.png',
      'assets/images/animales-sin-fondo/IGUANA.png',
      'assets/images/animales-sin-fondo/JIRAFA.png',
      'assets/images/animales-sin-fondo/LAPA.png',
      'assets/images/animales-sin-fondo/LEON.png',
      'assets/images/animales-sin-fondo/MONO.png',
      'assets/images/animales-sin-fondo/OSO.png',
      'assets/images/animales-sin-fondo/PALOMA.png',
      'assets/images/animales-sin-fondo/PAVO.png',
      'assets/images/animales-sin-fondo/PERICO.png',
      'assets/images/animales-sin-fondo/PERRO.png',
      'assets/images/animales-sin-fondo/PESCADO.png',
      'assets/images/animales-sin-fondo/RANA.png',
      'assets/images/animales-sin-fondo/RATON.png',
      'assets/images/animales-sin-fondo/TIGRE.png',
      'assets/images/animales-sin-fondo/TORO.png',
      'assets/images/animales-sin-fondo/VACA.png',
      'assets/images/animales-sin-fondo/VENADO.png',
      'assets/images/animales-sin-fondo/ZAMURO.png',
      'assets/images/animales-sin-fondo/ZORRO.png',

      // Contenedores / paneles
      'assets/images/contenedores/buho.gif',
      'assets/images/contenedores/nombre-animal.png',
      'assets/images/contenedores/rueda-resultado-derecha.png',
      'assets/images/contenedores/rueda-resultado-izquierda.png',
      'assets/images/contenedores/scorepanel2.png',

      // Rueda
      'assets/images/rueda/bordedeagua.png',
      'assets/images/rueda/centrorueda.png',
      'assets/images/rueda/centroruedafondo.png',
      'assets/images/rueda/puntero1.png',

      // SVGs
      'assets/svg/arrow.svg',
      'assets/svg/share.svg',
      'assets/svg/brush.svg'
    ];

    const videoPaths: string[] = [
      'assets/videos/fondo-azul.webm'
    ];

    const totalAssets = imagePaths.length + videoPaths.length;
    let loadedAssets = 0;

    // Función para actualizar el progreso
    const updateProgress = () => {
      loadedAssets++;
      this.loadingProgress = Math.round((loadedAssets / totalAssets) * 100);
      this.cdr.markForCheck();
    };

    // Precargar imágenes
    const imagePromises = imagePaths.map(path => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          updateProgress();
          resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to load image: ${path}`);
          updateProgress();
          resolve();
        };
        img.src = path;
      });
    });

    // Precargar videos
    const videoPromises = videoPaths.map(path => {
      return new Promise<void>((resolve) => {
        const video = document.createElement('video');
        video.onloadeddata = () => {
          updateProgress();
          resolve();
        };
        video.onerror = () => {
          console.warn(`Failed to load video: ${path}`);
          updateProgress();
          resolve();
        };
        video.src = path;
        video.load();
      });
    });

    // Esperar a que todos los assets se carguen
    await Promise.all([...imagePromises, ...videoPromises]);

    // Pequeño delay para que el usuario vea el 100%
    await new Promise(resolve => setTimeout(resolve, 500));

    // Ocultar pantalla de carga
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  /**
   * Obtiene el tier de rendimiento del dispositivo
   * Usado en el template para aplicar clases CSS adaptativas
   */
  public getPerformanceTier(): DevicePerformanceTier {
    return this.performanceDetector.getDeviceTier();
  }
}