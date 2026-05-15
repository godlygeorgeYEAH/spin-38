import * as CryptoJS from 'crypto-js';
import { Component, ViewChild, ChangeDetectorRef, NgZone, OnInit, ElementRef, AfterViewInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { CommonModule, AsyncPipe } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { WheelContainerComponent } from '../components/wheel-container/wheel-container.component';
import { GameSettingsComponent } from '../components/game-settings/game-settings.component';
import { BetHistoryComponent } from '../components/bet-history/bet-history.component';
import { Animal, AnimalBet, WheelItem, WheelSpinResult } from '../interfaces/wheel-general.interface';
import { GameSettings } from '../interfaces/game-settings.interface';
import { GameState } from '../interfaces/game.enums';
import { Transaction, TransactionType } from '../interfaces/transaction.interface';
import { BetHistory, BetEntry } from '../interfaces/bet-history.interface';
import { FindBetPipe } from '../pipes/find-bet.pipe';
import { addIcons } from 'ionicons';
import { settingsOutline, closeOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/angular/standalone';
import { AdminAuthService } from '../services/admin-auth.service';
import { AudioService } from '../services/audio.service';
import { DevicePerformanceTier, PerformanceDetectorService } from '../services/performance-detector.service';
import { ApiService } from '../services/api.service';
import { RoundOrchestratorService } from '../services/round-orchestrator.service';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.css'],
  standalone: true,
  imports: [
    IonContent, IonIcon, CommonModule, AsyncPipe,
    WheelContainerComponent, GameSettingsComponent, BetHistoryComponent, FindBetPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(WheelContainerComponent) wheelContainer!: WheelContainerComponent;
  @ViewChild('backgroundVideo') backgroundVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('resultCard', { read: ElementRef }) resultCard?: ElementRef<HTMLElement>;

  private betIdCounter = 0;
  private transactionIdCounter = 0;
  public selectedAnimals: AnimalBet[] = [];
  public totalBetAmountSubject = new BehaviorSubject<number>(0);
  public totalBetAmount$ = this.totalBetAmountSubject.asObservable();
  public gameResult: WheelSpinResult | null = null;
  public lastWin = 0;
  public totalAccumulatedWin = 0;
  public gameState: GameState = GameState.IDLE;
  public currentEditingAnimal: Animal | null = null;

  // Sistema de Balance
  public playerBalance: number = 10000; // Balance inicial del jugador
  public balanceSubject = new BehaviorSubject<number>(this.playerBalance);
  public balance$ = this.balanceSubject.asObservable();
  public transactions: Transaction[] = [];
  private readonly DEFAULT_BALANCE = 10000;

  
  public showResult = false;
  public resultOverlayTimer: number = 0;
  private resultOverlayInterval: any = null;
  // reloj
  public clockTime: string = '';
  public clockWidgetWidth: string = '400px';
  public clockWidgetHeight: string = '400px';
  public clockLabelFontSize: string = '0.72rem';
  public clockLabelTop: string = '0px';
  public clockLabelLeft: string = '0px';
  public clockLabelRight: string = 'auto';
  public clockLabelBottom: string = 'auto';
  public clockLabelTransform: string = 'none';
  public clockTimeFontSize: string = '1.1rem';
  public clockTimeTop: string = '120px';
  public clockTimeLeft: string = '200px';
  public clockTimeRight: string = 'auto';
  public clockTimeBottom: string = 'auto';
  public clockTimeTransform: string = 'none';
  private clockIntervalId: any = null;
  public errorMessage: string = '';
  private capturedScreenshot: File | null = null;
  public showSettings: boolean = false;
  public showBetHistory: boolean = false;
  public isBettingControlsVisible: boolean = true;
  public isWheelDisplaced: boolean = true; // Controla el desplazamiento de la rueda (separado de la visibilidad del panel)
  public bettingPanelAnimationState: 'hidden' | 'appearing' | 'visible' | 'disappearing' = 'visible';

  // Volumen de sonidos de interfaz (0-100)
  public uiVolume: number = 50;
  private readonly UI_VOLUME_KEY = 'uiVolume';

  // Sistema de Historial de Apuestas
  public betHistory: BetHistory[] = [];

  // Sistema de carga de assets
  public isLoading: boolean = true;
  public loadingProgress: number = 0;
  private historyIdCounter = 0;
  private readonly BET_HISTORY_KEY = 'betHistory';

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
  public coinValues: number[] = [1, 5, 10, 30, 50, 1000];
  public multiplierValues: number[] = [1, 1.5, 2, 3, 5, 10]; // 6 valores base que se duplican en la rueda
  public spinDuration: number = 10000; // Duración rueda externa
  public innerWheelSpinDuration: number = 12000; // Duración rueda interna (multiplicadores)
  public expansionRange: number = 180;

  // Audio para fichas y botones
  private chipAudio: HTMLAudioElement;
  private pressAudio: HTMLAudioElement;

  private readonly DEFAULT_COIN_VALUES = [1, 5, 10, 30, 50, 1000];
  private readonly DEFAULT_MULTIPLIER_VALUES = [1, 1.5, 2, 3, 5, 10];
  private readonly HASH_B64 = 'NWRkZDE2ZGY3ZGJhOThlOTUyZDNhZjA3MGM3NDA1ODdjYTAxMjM5OGFlZDFjYWVhZGYzOGRhMjNmOGYzMDcyYQ==';
  private readonly SALT_B64 = 'dW5hLWNhZGVuYS1hbGVhdG9yaWEteS1sYXJnYS1wYXJhLWRpZmljdWx0YXI=';

  constructor(
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private adminAuth: AdminAuthService,
    private audioService: AudioService,
    private performanceDetector: PerformanceDetectorService,
    private apiService: ApiService,
    public orchestrator: RoundOrchestratorService
  ) {
    addIcons({ settingsOutline, closeOutline });

    // Cargar volumen de interfaz desde localStorage
    const savedUIVolume = localStorage.getItem(this.UI_VOLUME_KEY);
    if (savedUIVolume !== null) {
      this.uiVolume = parseInt(savedUIVolume, 10);
    }

    // Inicializar audios con el volumen guardado
    this.chipAudio = new Audio('assets/audio/chip.mp3');
    this.chipAudio.volume = this.uiVolume / 100;

    this.pressAudio = new Audio('assets/audio/press.mp3');
    this.pressAudio.volume = this.uiVolume / 100;

    this.loadSettings();
    this.loadBetHistory();
    this.setupAdminCommands();

    // Sistema legacy - DEPRECADO - usar comandos admin nuevos
    (window as any).setDevPassword = (password: string) => {
      const secrets = this.getDevSecrets();
      const inputHash = CryptoJS.SHA256(password + secrets.salt).toString(CryptoJS.enc.Hex);
      if (inputHash === secrets.hash) {
        localStorage.setItem('devHash', inputHash);
        console.log("Ya estas dentro: ahora veras los resultados luego de jugar al girar la rueda!!")
        return {
          gameState: this.gameState,
          selectedAnimals: this.selectedAnimals,
          totalBet: this.totalBetAmountSubject.value,
          lastWin: this.lastWin,
          totalAccumulatedWin: this.totalAccumulatedWin,
          gameResult: this.gameResult
        };
      }
      return false;
    };
  }

  async ngOnInit(): Promise<void> {
    this.selectedAnimals = [];
    this.totalBetAmountSubject.next(0);
    this.gameResult = null;
    this.lastWin = 0;
    this.totalAccumulatedWin = 0;
    this.gameState = GameState.IDLE;
    this.currentEditingAnimal = null;
    this.showResult = false;

    this.errorMessage = '';
    this.showSettings = false;
    this.isBettingControlsVisible = false; // Oculto hasta que se seleccione un animal
    this.isWheelDisplaced = false; // La rueda empieza centrada
    this.betIdCounter = 0;
    this.transactionIdCounter = 0;

    // Obtener balance inicial del backend
    await this.initializeBalanceFromBackend();

    this.transactions = [];

    // Iniciar precarga de assets
    this.preloadAssets();
    this.startClock();
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
    const seconds = String(now.getSeconds()).padStart(2, '0');
    this.clockTime = `${hours}:${minutes}:${seconds}`;
    this.cdr.markForCheck();
  }

  /**
   * Inicializa el balance y la configuración obteniendo los valores del backend
   */
  private async initializeBalanceFromBackend(): Promise<void> {
    // Verificar si el ApiService está inicializado (tiene token)
    if (!this.apiService.isAuthenticated()) {
      console.warn('[HomePage] ApiService no está autenticado. Usando valores por defecto.');
      this.playerBalance = this.DEFAULT_BALANCE;
      this.balanceSubject.next(this.playerBalance);
      return;
    }

    try {
      console.log('[HomePage] Obteniendo configuración inicial y balance del backend...');

      // Llamar a ambos endpoints en paralelo
      const [configResponse, balanceResponse] = await Promise.all([
        this.apiService.getInitialConfig().toPromise(),
        this.apiService.getBalance().toPromise()
      ]);

      // Procesar configuración inicial (coinValues y multipliers)
      if (configResponse?.success && configResponse.data) {
        // Establecer coinValues
        if (configResponse.data.coinValues && Array.isArray(configResponse.data.coinValues)) {
          if (configResponse.data.coinValues.length === 6) {
            this.coinValues = [...configResponse.data.coinValues];
            console.log('[HomePage] ✅ Valores de fichas cargados del backend:', this.coinValues);
          } else {
            console.warn('[HomePage] ⚠️ Backend retornó coinValues con cantidad incorrecta (esperado: 6, recibido:', configResponse.data.coinValues.length + ')');
            console.log('[HomePage] Usando valores de fichas por defecto:', this.DEFAULT_COIN_VALUES);
          }
        } else {
          console.log('[HomePage] Backend no proporcionó coinValues. Usando valores por defecto:', this.DEFAULT_COIN_VALUES);
        }

        // Establecer multipliers
        if (configResponse.data.multipliers && Array.isArray(configResponse.data.multipliers)) {
          if (configResponse.data.multipliers.length === 6) {
            // Ordenar de menor a mayor antes de asignar
            this.multiplierValues = [...configResponse.data.multipliers].sort((a, b) => a - b);
            console.log('[HomePage] ✅ Valores de multiplicadores cargados del backend:', this.multiplierValues);
          } else {
            console.warn('[HomePage] ⚠️ Backend retornó multipliers con cantidad incorrecta (esperado: 6, recibido:', configResponse.data.multipliers.length + ')');
            console.log('[HomePage] Usando valores de multiplicadores por defecto:', this.DEFAULT_MULTIPLIER_VALUES);
          }
        } else {
          console.log('[HomePage] Backend no proporcionó multipliers. Usando valores por defecto:', this.DEFAULT_MULTIPLIER_VALUES);
        }
      } else {
        console.warn('[HomePage] ⚠️ No se pudo obtener configuración inicial. Usando valores por defecto.');
      }

      // Procesar balance
      if (balanceResponse?.success && balanceResponse.data) {
        this.playerBalance = balanceResponse.data.balance;
        this.balanceSubject.next(this.playerBalance);
        console.log('[HomePage] ✅ Balance inicial cargado del backend:', this.playerBalance);
      } else {
        throw new Error('Respuesta de balance inválida del backend');
      }
    } catch (error) {
      console.error('[HomePage] ❌ Error al obtener datos iniciales del backend:', error);
      console.log('[HomePage] Usando valores por defecto');

      // Usar valores por defecto si falla
      this.playerBalance = this.DEFAULT_BALANCE;
      this.balanceSubject.next(this.playerBalance);
    }
  }

  ngAfterViewInit(): void {
    if (!this.isXiaomiBrowser()) {
      this.setupBackgroundVideo();
    } else if (this.backgroundVideo?.nativeElement) {
      this.backgroundVideo.nativeElement.style.display = 'none';
    }

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

  private isXiaomiBrowser(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('miuibrowser') || ua.includes('xiaomi');
  }

  ngOnDestroy(): void {
    this.orchestrator.stop();

    if (this.clockIntervalId !== null) {
      window.clearInterval(this.clockIntervalId);
      this.clockIntervalId = null;
    }

    // Limpiar listeners del video
    if (this.backgroundVideo?.nativeElement) {
      const video = this.backgroundVideo.nativeElement;
      video.removeEventListener('pause', this.onVideoPause);
      video.removeEventListener('ended', this.onVideoEnded);
    }
  }

  /**
   * Muestra el panel de apuestas con animación de aparición
   */
  private showBettingPanel(): void {
    // Solo animar si el panel estaba oculto antes
    const shouldAnimate = !this.isBettingControlsVisible;

    this.isBettingControlsVisible = true;
    this.isWheelDisplaced = true; // Desplazar la rueda cuando aparece el panel

    if (shouldAnimate) {
      this.bettingPanelAnimationState = 'appearing';
      // Después de la animación, marcar como visible
      setTimeout(() => {
        if (this.bettingPanelAnimationState === 'appearing') {
          this.bettingPanelAnimationState = 'visible';
        }
      }, 600); // Duración de la animación
    } else {
      // Ya está visible, no animar
      this.bettingPanelAnimationState = 'visible';
    }
  }

  /**
   * Oculta el panel de apuestas con animación de desaparición
   */
  private hideBettingPanel(): void {
    this.bettingPanelAnimationState = 'disappearing';
    // Remover desplazamiento de la rueda con pequeño delay para evitar parpadeo
    requestAnimationFrame(() => {
      this.isWheelDisplaced = false;
    });
    // Después de la animación del panel, ocultar del DOM
    setTimeout(() => {
      this.isBettingControlsVisible = false;
      this.bettingPanelAnimationState = 'hidden';
    }, 600); // Duración de la animación del panel
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
        this.coinValues = settings.coinValues;
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

    // Actualizar el volumen de los audios de interfaz
    const volumeDecimal = volume / 100;
    this.chipAudio.volume = volumeDecimal;
    this.pressAudio.volume = volumeDecimal;

    // Guardar en localStorage
    localStorage.setItem(this.UI_VOLUME_KEY, volume.toString());
  }

  // ==================== Bet History Methods ====================

  private loadBetHistory(): void {
    const savedHistory = localStorage.getItem(this.BET_HISTORY_KEY);
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        // Convertir strings de fecha a Date objects
        this.betHistory = history.map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp)
        }));
        // Actualizar el contador para evitar IDs duplicados
        if (this.betHistory.length > 0) {
          this.historyIdCounter = Math.max(...this.betHistory.map(h => h.id)) + 1;
        }
      } catch (e) {
        console.error('Error loading bet history', e);
        this.betHistory = [];
      }
    }
  }

  private saveBetHistory(): void {
    try {
      localStorage.setItem(this.BET_HISTORY_KEY, JSON.stringify(this.betHistory));
    } catch (e) {
      console.error('Error saving bet history', e);
    }
  }

  private addToHistory(winningAnimal: Animal, winningMultiplier: number, winAmount: number, isWin: boolean): void {
    // Crear lista de apuestas (solo las que tienen amount > 0)
    const bets: BetEntry[] = this.selectedAnimals
      .filter(bet => bet.amount > 0)
      .map(bet => ({
        animal: bet.animal,
        amount: bet.amount
      }));

    const historyEntry: BetHistory = {
      id: this.historyIdCounter++,
      timestamp: new Date(),
      bets: bets,
      totalBet: this.totalBetAmountSubject.value,
      winningAnimal: winningAnimal,
      winningMultiplier: winningMultiplier,
      winAmount: winAmount,
      isWin: isWin,
      balanceAfter: this.playerBalance
    };

    this.betHistory = [historyEntry, ...this.betHistory];
    this.saveBetHistory();
  }

  public openBetHistory(): void {
    this.playPressSound();
    this.showBetHistory = true;
  }

  public closeBetHistory(): void {
    this.showBetHistory = false;
  }

  public clearBetHistory(): void {
    if (confirm('¿Estás seguro de que quieres borrar todo el historial?')) {
      this.betHistory = [];
      this.historyIdCounter = 0;
      this.saveBetHistory();
    }
  }

  public setCurrentEditingAnimal(animal: Animal): void {
    // Bug fix 5.1: Limpiar animal anterior si no tiene apuesta
    if (this.currentEditingAnimal) {
      const previousBet = this.selectedAnimals.find(bet => bet.animal.name === this.currentEditingAnimal!.name);
      if (previousBet && previousBet.amount === 0) {
        this.selectedAnimals = this.selectedAnimals.filter(bet => bet.animal.name !== this.currentEditingAnimal!.name);
      }
    }

    this.currentEditingAnimal = animal;

    // Mostrar panel solo si hay al menos un animal seleccionado
    if (this.selectedAnimals.length > 0) {
      this.showBettingPanel();
    } else {
      this.hideBettingPanel();
    }

    this.updateTotalBetAmount();
  }

  public addCoinToCurrentAnimal(value: number): void {
    if (this.gameState === 'playing' || !this.currentEditingAnimal) return;

    // Reproducir sonido de ficha
    this.playChipSound();

    const animalNameToUpdate = this.currentEditingAnimal.name;
    this.selectedAnimals = this.selectedAnimals.map(bet =>
      bet.animal.name === animalNameToUpdate
        ? { ...bet, amount: bet.amount + value }
        : bet
    );

    this.updateTotalBetAmount();
  }

  /**
   * Reproduce el sonido cuando se selecciona una ficha
   */
  private playChipSound(): void {
    try {
      // Reiniciar el audio al inicio para permitir múltiples clicks rápidos
      this.chipAudio.currentTime = 0;
      this.chipAudio.play().catch(error => {
        // Ignorar errores de autoplay - el navegador puede bloquear el audio
        console.log('Audio bloqueado por el navegador:', error);
      });
    } catch (error) {
      console.error('Error al reproducir sonido de ficha:', error);
    }
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

  public clearAllBets(): void {
    if (this.gameState === 'playing') return;

    // Reproducir sonido de botón
    this.playPressSound();

    this.selectedAnimals = [];
    this.currentEditingAnimal = null;
    this.hideBettingPanel();
    this.updateTotalBetAmount();
  }

  public clearAnimalBet(animal: Animal): void {
    if (this.gameState === 'playing') return;
    this.selectedAnimals = this.selectedAnimals.filter(bet => bet.animal.name !== animal.name);
    if (this.currentEditingAnimal && this.currentEditingAnimal.name === animal.name) {
      this.currentEditingAnimal = this.selectedAnimals.length > 0 ? this.selectedAnimals[0].animal : null;
    }
    this.updateTotalBetAmount();
  }

  /**
   * Limpia la apuesta del animal actualmente seleccionado (pone el monto en 0)
   */
  public clearCurrentAnimalBet(): void {
    if (this.gameState === 'playing') return;

    if (!this.currentEditingAnimal) {
      console.warn('No hay animal seleccionado para limpiar');
      return;
    }

    // Reproducir sonido de botón
    this.playPressSound();

    // Encontrar la apuesta del animal actual y poner su monto en 0
    const currentBet = this.selectedAnimals.find(bet => bet.animal.name === this.currentEditingAnimal!.name);
    if (currentBet) {
      currentBet.amount = 0;
    }

    // Actualizar el total
    this.updateTotalBetAmount();
  }

  public async spinWheels(): Promise<void> {
    if (!this.canSpin()) return;

    // Filtrar apuestas de $0 antes de girar (Bug fix 5.1)
    this.selectedAnimals = this.selectedAnimals.filter(bet => bet.amount > 0);

    // Si no hay apuestas válidas después del filtro, retornar
    if (this.selectedAnimals.length === 0) {
      this.errorMessage = 'Debe realizar al menos una apuesta válida antes de girar.';
      setTimeout(() => {
        this.zone.run(() => {
          this.errorMessage = '';
          this.cdr.markForCheck();
        });
      }, 3000);
      return;
    }

    this.updateTotalBetAmount();

    if (this.totalBetAmountSubject.value === 0) return;

    // Validación de fondos suficientes
    const totalBet = this.totalBetAmountSubject.value;
    if (this.playerBalance < totalBet) {
      this.errorMessage = `Fondos insuficientes. Balance: ${this.playerBalance}, Apuesta: ${totalBet}`;
      console.error(this.errorMessage);

      // Desvanecer mensaje de error después de 3 segundos
      setTimeout(() => {
        this.zone.run(() => {
          this.errorMessage = '';
          this.cdr.markForCheck();
        });
      }, 3000);

      return;
    }

    // Deducir apuesta del balance
    this.deductBet(totalBet);

    // Log solo visible para administradores autenticados
    if (this.adminAuth.isAuthenticated()) {
      console.log('Game data before spin:', {
        gameState: this.gameState,
        selectedAnimals: this.selectedAnimals,
        totalBet: this.totalBetAmountSubject.value,
        lastWin: this.lastWin,
        totalAccumulatedWin: this.totalAccumulatedWin,
        gameResult: this.gameResult
      });
    }

    // ==================== COMUNICACIÓN CON BACKEND ====================
    // Enviar apuesta al backend antes de girar la ruleta
    try {
      console.log('[HomePage] Enviando apuesta al backend...');

      // Preparar datos de la apuesta para el backend
      const betData = {
        bets: this.selectedAnimals.map(bet => ({
          animal: bet.animal.name,
          amount: bet.amount,
          index: this.animalsForWheel.findIndex(a => a.position === bet.animal.position) + 1
        })),
        totalAmount: totalBet
      };

      // Registrar la apuesta en el backend (esto añadirá automáticamente el token)
      const betResponse = await this.apiService.placeBet(betData).toPromise();

      console.log('[HomePage] Respuesta del backend:', betResponse);

      if (!betResponse?.success) {
        // Si el backend rechaza la apuesta, mostrar error y revertir
        this.errorMessage = betResponse?.message || 'Error al procesar la apuesta';

        // Revertir deducción del balance
        this.playerBalance += totalBet;
        this.balanceSubject.next(this.playerBalance);

        setTimeout(() => {
          this.zone.run(() => {
            this.errorMessage = '';
            this.cdr.markForCheck();
          });
        }, 3000);

        return;
      }

      // Guardar el betId para el siguiente request (spin)
      const betId = betResponse.data?.betId || '';
      console.log('[HomePage] Apuesta registrada exitosamente. BetId:', betId);

      // ==================== EJECUTAR SPIN EN EL BACKEND ====================
      console.log('[HomePage] Ejecutando spin en el backend...');

      const spinResponse = await this.apiService.spin({ betId }).toPromise();

      console.log('[HomePage] Respuesta del spin:', spinResponse);

      if (!spinResponse?.success || !spinResponse.data) {
        throw new Error(spinResponse?.message || 'Error al ejecutar el spin');
      }

      const backendResult = spinResponse.data;
      console.log('[HomePage] Resultado del backend:', {
        outerPosition: backendResult.outerPosition,
        innerPosition: backendResult.innerPosition,
        winAmount: backendResult.winAmount,
        isWin: backendResult.isWin
      });

      // ==================== ANIMAR RULETA HACIA RESULTADO DEL BACKEND ====================
      this.hideBettingPanel();
      this.gameState = GameState.PLAYING;
      this.wheelContainer.spinDuration = this.spinDuration;
      this.wheelContainer.innerWheelSpinDuration = this.innerWheelSpinDuration;

      console.log('[HomePage] Girando ruleta hacia resultado del backend...');

      const result = await this.wheelContainer.spinToResult({
        outerPosition: backendResult.outerPosition,
        innerPosition: backendResult.innerPosition,
      });

      console.log('[HomePage] Ruleta completada. Resultado visual:', result);

      // Usar datos del backend para actualizar el juego
      this.gameResult = result;
      this.lastWin = backendResult.winAmount;
      this.totalAccumulatedWin += this.lastWin;

      // ==================== ACTUALIZAR BALANCE DESDE BACKEND ====================
      console.log('[HomePage] Obteniendo balance actualizado del backend...');

      try {
        const balanceResponse = await this.apiService.getBalance().toPromise();

        if (balanceResponse?.success && balanceResponse.data) {
          this.playerBalance = balanceResponse.data.balance;
          this.balanceSubject.next(this.playerBalance);
          console.log('[HomePage] ✅ Balance actualizado desde /api/balance:', this.playerBalance);
        } else {
          // Si falla, usar el balance del resultado del spin como fallback
          console.warn('[HomePage] ⚠️ No se pudo obtener balance. Usando balanceAfter del spin');
          this.playerBalance = backendResult.balanceAfter;
          this.balanceSubject.next(this.playerBalance);
        }
      } catch (balanceError) {
        // Si falla el endpoint de balance, usar el balance del spin como fallback
        console.error('[HomePage] ❌ Error al obtener balance:', balanceError);
        console.log('[HomePage] Usando balanceAfter del spin como fallback');
        this.playerBalance = backendResult.balanceAfter;
        this.balanceSubject.next(this.playerBalance);
      }

      // Agregar resultado al historial
      this.addToHistory(
        { position: String(result.outerPosition), name: String(result.outerPosition), emoji: '' },
        0,
        this.lastWin,
        backendResult.isWin
      );

      this.gameState = GameState.RESULT;
      this.showResult = true;

    } catch (error: any) {
      console.error('[HomePage] Error en el flujo de juego:', error);

      // Mostrar error al usuario
      this.errorMessage = error.message || 'Error de conexión con el servidor';

      // Revertir deducción del balance
      this.playerBalance += totalBet;
      this.balanceSubject.next(this.playerBalance);

      setTimeout(() => {
        this.zone.run(() => {
          this.errorMessage = '';
          this.cdr.markForCheck();
        });
      }, 5000);

      return;
    }
    // ==================== FIN COMUNICACIÓN CON BACKEND ====================

    // Log solo visible para administradores autenticados
    if (this.adminAuth.isAuthenticated()) {
      console.log('Game data after spin:', {
        gameState: this.gameState,
        selectedAnimals: this.selectedAnimals,
        totalBet: this.totalBetAmountSubject.value,
        lastWin: this.lastWin,
        totalAccumulatedWin: this.totalAccumulatedWin,
        gameResult: this.gameResult
      });
    }
    this.cdr.markForCheck();

    // Pre-capturar screenshot del modal para compartir (solo cuando hay victoria)
    // Esperar a que termine la animación de entrada (fadeIn 0.5s + slideInUp 0.5s) + margen
    if (this.lastWin > 0) {
      setTimeout(() => {
        this.preCaptureScreenshot(); // Esta función internamente esperará a que las imágenes se carguen
      }, 800);
    }

    // NOTA: Temporizador automático eliminado - el usuario debe cerrar manualmente
  }

  /**
   * Inicia el temporizador de cierre automático del overlay de resultados (30 segundos)
   */
  private startResultOverlayTimer(): void {
    // Limpiar cualquier temporizador previo
    if (this.resultOverlayInterval) {
      clearInterval(this.resultOverlayInterval);
    }

    this.resultOverlayTimer = 30;

    this.resultOverlayInterval = setInterval(() => {
      this.zone.run(() => {
        this.resultOverlayTimer--;

        if (this.resultOverlayTimer <= 0) {
          this.closeResultOverlay();
        }

        this.cdr.markForCheck();
      });
    }, 1000);
  }

  /**
   * Cierra el overlay de resultados manualmente o automáticamente
   */
  public closeResultOverlay(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    // Limpiar temporizador
    if (this.resultOverlayInterval) {
      clearInterval(this.resultOverlayInterval);
      this.resultOverlayInterval = null;
    }

    this.zone.run(() => {
      this.showResult = false;
      this.resultOverlayTimer = 0;
      this.gameResult = null;
      this.currentEditingAnimal = null;
      this.gameState = GameState.IDLE;
      this.capturedScreenshot = null; // Limpiar screenshot pre-capturado
      this.cdr.markForCheck();

      // Forzar detección de cambios en el componente wheel-container
      if (this.wheelContainer) {
        this.wheelContainer['cdr'].markForCheck();
      }
    });
  }

  /**
   * Cierra el overlay y gira la rueda inmediatamente
   */
  public spinAgain(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    // Cerrar el overlay
    this.closeResultOverlay();

    // Reproducir sonido del botón sincronizado con la animación
    this.audioService.playButton();

    // Girar inmediatamente
    this.zone.run(() => {
      this.spinWheels();
    });
  }

  /**
   * Limpia todas las apuestas y cierra el overlay de resultados
   */
  public clearWheelAndClose(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    // Cerrar el overlay
    this.closeResultOverlay();

    // Limpiar todas las apuestas
    this.clearAllBets();
  }

  /**
   * Pre-captura el screenshot del modal cuando aparece
   * Esto permite que shareWin() sea síncrono y no pierda el user gesture
   * Espera a que todas las imágenes estén completamente cargadas antes de capturar
   */
  private async preCaptureScreenshot(): Promise<void> {
    if (!this.resultCard?.nativeElement) {
      if (this.adminAuth.isAuthenticated()) {
        console.warn('No se puede pre-capturar: Modal no encontrado');
      }
      return;
    }

    try {
      // Esperar a que todas las imágenes dentro del modal estén completamente cargadas
      const modalElement = this.resultCard.nativeElement;
      const images = Array.from(modalElement.querySelectorAll('img')) as HTMLImageElement[];

      // Crear promesas para cada imagen
      const imageLoadPromises = images.map((img) => {
        return new Promise<void>((resolve) => {
          if (img.complete && img.naturalHeight !== 0) {
            // Imagen ya está cargada
            resolve();
          } else {
            // Esperar a que la imagen se cargue
            img.onload = () => {
              resolve();
            };
            img.onerror = () => {
              if (this.adminAuth.isAuthenticated()) {
                console.warn('Error al cargar imagen:', img.src);
              }
              resolve(); // Continuar aunque falle
            };
          }
        });
      });

      // Esperar a que todas las imágenes se carguen (con timeout de 5 segundos)
      await Promise.race([
        Promise.all(imageLoadPromises),
        new Promise(resolve => setTimeout(resolve, 5000))
      ]);

      // Espera adicional para asegurar que el CSS y filtros estén completamente aplicados
      await new Promise(resolve => setTimeout(resolve, 500));

      const resultElement = this.resultCard.nativeElement;

      // Ocultar el botón de cerrar temporalmente
      const closeButton = resultElement.querySelector('.close-button') as HTMLElement;
      const originalDisplay = closeButton ? closeButton.style.display : '';
      if (closeButton) closeButton.style.display = 'none';

      // Esperar un frame para que se aplique el cambio
      await new Promise(resolve => requestAnimationFrame(resolve));

      const canvas = await html2canvas(resultElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        width: resultElement.scrollWidth,
        height: resultElement.scrollHeight,
        onclone: (clonedDoc) => {
          // En el documento clonado, asegurarse de que todos los elementos tengan opacidad completa
          const clonedElement = clonedDoc.querySelector('[class*="result-container"]') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.opacity = '1';
            clonedElement.style.animation = 'none'; // Deshabilitar animaciones en el clon
            clonedElement.style.overflow = 'visible'; // OVERFLOW POWER!
          }

          // Asegurar que el content wrapper permita overflow
          const resultContent = clonedDoc.querySelector('.result-content') as HTMLElement;
          if (resultContent) {
            resultContent.style.overflow = 'visible'; // OVERFLOW POWER!
          }

          // Asegurar que el wrapper del animal permita overflow
          const animalWrapper = clonedDoc.querySelector('.result-animal-wrapper') as HTMLElement;
          if (animalWrapper) {
            animalWrapper.style.overflow = 'visible'; // OVERFLOW POWER!
          }

          // Obtener referencias a las imágenes originales para copiar sus dimensiones computadas
          const originalAnimalImage = resultElement.querySelector('.result-animal-full-image') as HTMLImageElement;
          const originalMultiplierBadge = resultElement.querySelector('.result-multiplier-badge') as HTMLImageElement;

          // Forzar que las imágenes mantengan sus dimensiones exactas del DOM original
          const animalImage = clonedDoc.querySelector('.result-animal-full-image') as HTMLImageElement;
          if (animalImage && originalAnimalImage) {
            const computedStyle = window.getComputedStyle(originalAnimalImage);
            animalImage.style.width = computedStyle.width;
            animalImage.style.height = computedStyle.height;
            animalImage.style.maxWidth = computedStyle.maxWidth;
            animalImage.style.maxHeight = computedStyle.maxHeight;
            animalImage.style.objectFit = 'contain';
          }

          const multiplierBadge = clonedDoc.querySelector('.result-multiplier-badge') as HTMLImageElement;
          if (multiplierBadge && originalMultiplierBadge) {
            const computedStyle = window.getComputedStyle(originalMultiplierBadge);
            multiplierBadge.style.animation = 'none'; // Deshabilitar animación de pulse
            multiplierBadge.style.width = computedStyle.width;
            multiplierBadge.style.height = computedStyle.height;
            multiplierBadge.style.objectFit = 'contain';
          }
        }
      });

      // Restaurar el botón de cerrar
      if (closeButton) closeButton.style.display = originalDisplay;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('No se pudo convertir canvas a blob'));
        }, 'image/png', 1.0);
      });

      this.capturedScreenshot = new File([blob], 'victoria-ruleta-zodiaco.png', { type: 'image/png' });
    } catch (error) {
      if (this.adminAuth.isAuthenticated()) {
        console.error('Error al pre-capturar screenshot:', error);
      }
      this.capturedScreenshot = null;
    }
  }

  /**
   * Comparte el resultado de la victoria como screenshot del modal usando Web Share API
   * Usa el screenshot pre-capturado para mantener el user gesture
   */
  public async shareWin(): Promise<void> {
    if (this.adminAuth.isAuthenticated()) {
      console.log('=== shareWin() llamado ===');
    }

    if (!this.gameResult || this.lastWin <= 0) {
      if (this.adminAuth.isAuthenticated()) {
        console.warn('No hay resultado de juego o ganancia para compartir');
      }
      this.showInfoMessage('⚠️ No hay resultado para compartir');
      return;
    }

    // Si no hay screenshot pre-capturado, intentar capturarlo ahora como fallback
    if (!this.capturedScreenshot) {
      if (this.adminAuth.isAuthenticated()) {
        console.warn('Screenshot no estaba pre-capturado, intentando capturar ahora...');
      }
      this.showInfoMessage('⚠️ Preparando imagen, intenta de nuevo en 1 segundo');
      await this.preCaptureScreenshot();
      return;
    }

    if (this.adminAuth.isAuthenticated()) {
      console.log('Screenshot disponible, procediendo a compartir...');
    }

    try {
      const shareTitle = '¡Gané en la Ruleta del Zodiaco Chino!';
      const shareText = `¡Acabo de ganar $${this.lastWin}! 🎰`;

      // Verificar APIs disponibles
      const hasShare = !!navigator.share;
      const hasCanShare = !!navigator.canShare;
      const canShareFiles = hasCanShare && navigator.canShare({ files: [this.capturedScreenshot] });

      if (this.adminAuth.isAuthenticated()) {
        console.log('APIs disponibles:', { hasShare, hasCanShare, canShareFiles });
        console.log('Usando screenshot pre-capturado:', Math.round(this.capturedScreenshot.size / 1024), 'KB');
      }

      // IMPORTANTE: Llamar a navigator.share() INMEDIATAMENTE
      // Sin operaciones async previas, manteniendo el user gesture
      if (hasShare && canShareFiles) {
        if (this.adminAuth.isAuthenticated()) {
          console.log('Compartiendo con Web Share API (con imagen)...');
        }

        await navigator.share({
          title: shareTitle,
          text: shareText,
          files: [this.capturedScreenshot]
        });

        if (this.adminAuth.isAuthenticated()) {
          console.log('¡Compartido exitosamente!');
        }
        this.showInfoMessage('✅ ¡Compartido exitosamente!');
      } else if (hasShare) {
        // Fallback: compartir sin imagen si no soporta archivos
        if (this.adminAuth.isAuthenticated()) {
          console.log('Web Share API no soporta archivos, compartiendo sin imagen...');
        }

        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: window.location.href
        });

        if (this.adminAuth.isAuthenticated()) {
          console.log('¡Compartido exitosamente (sin imagen)!');
        }
        this.showInfoMessage('✅ ¡Compartido exitosamente (sin imagen)!');
      } else {
        // Fallback final: descargar la imagen
        if (this.adminAuth.isAuthenticated()) {
          console.log('Web Share API no disponible, descargando imagen...');
        }
        this.downloadCapturedImage();
        this.showInfoMessage('✅ Imagen descargada');
      }

    } catch (error: any) {
      // Si el usuario canceló, no hacer nada
      if (error.name === 'AbortError') {
        if (this.adminAuth.isAuthenticated()) {
          console.log('Usuario canceló el compartir');
        }
        this.showInfoMessage('ℹ️ Compartir cancelado por el usuario');
        return;
      }

      // Mostrar error detallado
      if (this.adminAuth.isAuthenticated()) {
        console.error('Error al compartir:', error);
      }
      const errorDetails = `❌ ERROR: ${error.name || 'Unknown'}\n${error.message || 'Sin mensaje'}\nStack: ${error.stack?.substring(0, 100) || 'N/A'}`;
      this.showInfoMessage(errorDetails, 10000); // Mostrar por 10 segundos
    }
  }

  /**
   * Descarga la imagen pre-capturada como fallback
   */
  private downloadCapturedImage(): void {
    if (!this.capturedScreenshot) {
      if (this.adminAuth.isAuthenticated()) {
        console.error('No hay screenshot pre-capturado para descargar');
      }
      this.showInfoMessage('❌ Error: No hay imagen para descargar');
      return;
    }

    try {
      const link = document.createElement('a');
      link.download = `victoria-ruleta-zodiaco-${Date.now()}.png`;
      link.href = URL.createObjectURL(this.capturedScreenshot);
      link.click();
      URL.revokeObjectURL(link.href);
      if (this.adminAuth.isAuthenticated()) {
        console.log('Imagen descargada exitosamente');
      }
    } catch (error) {
      if (this.adminAuth.isAuthenticated()) {
        console.error('Error al descargar imagen:', error);
      }
      this.showInfoMessage('❌ Error al descargar imagen');
    }
  }

  /**
   * Muestra un mensaje informativo temporal al usuario
   */
  private showInfoMessage(message: string, duration: number = 3000): void {
    this.errorMessage = message;
    setTimeout(() => {
      this.errorMessage = '';
    }, duration);
  }

  /**
   * Función helper para crear delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async resetGame(): Promise<void> {
    this.selectedAnimals = [];
    this.lastWin = 0;
    this.totalAccumulatedWin = 0;
    this.gameResult = null;
    this.showResult = false;
    this.gameState = GameState.IDLE;
    this.currentEditingAnimal = null;
    this.showBettingPanel();
    this.capturedScreenshot = null; // Limpiar screenshot pre-capturado
    this.updateTotalBetAmount();
  }


  private updateTotalBetAmount(): void {
    const total = this.selectedAnimals.reduce((sum, bet) => sum + bet.amount, 0);
    this.totalBetAmountSubject.next(total);
  }

  public canSpin(): boolean {
    return this.selectedAnimals.length > 0 && this.gameState !== 'playing';
  }

  public getDisplayedAnimals(): AnimalBet[] {
    if (this.lastWin > 0 && this.gameResult) {
      const winningBet = this.selectedAnimals.find(bet => String(bet.animal.name) === String(this.gameResult!.outerPosition));
      return winningBet ? [winningBet] : [];
    }
    return this.selectedAnimals;
  }

  public getSelectedAnimalNames(): string[] {
    return this.selectedAnimals.map(bet => bet.animal.name);
  }

  /**
   * Obtiene la ruta de la imagen de la ficha basada en su valor
   * Las fichas están numeradas 1-6 según su orden en coinValues
   * coin-bg-1.png = coinValues[0], coin-bg-2.png = coinValues[1], etc.
   */
  public getCoinImage(coinValue: number): string {
    const index = this.coinValues.indexOf(coinValue);
    if (index === -1) return '';
    return `assets/images/fichas/coin-bg-${index + 1}.png`;
  }

  private calculateWinnings(result: WheelSpinResult): void {
    const winningBet = this.selectedAnimals.find(bet => String(bet.animal.name) === String(result.outerPosition));
    if (winningBet) {
      this.lastWin = winningBet.amount;
    } else {
      this.lastWin = 0;
    }
  }

  /**
   * Deduce una apuesta del balance del jugador
   * @param amount - Monto a deducir
   */
  private deductBet(amount: number): void {
    const balanceBefore = this.playerBalance;
    this.playerBalance -= amount;
    this.balanceSubject.next(this.playerBalance);

    // Registrar transacción
    const transaction: Transaction = {
      id: this.transactionIdCounter++,
      type: TransactionType.BET,
      amount: -amount, // Negativo porque es una deducción
      balanceBefore: balanceBefore,
      balanceAfter: this.playerBalance,
      timestamp: new Date(),
      description: `Apuesta realizada: ${amount}`
    };
    this.transactions.push(transaction);
  }

  /**
   * Agrega ganancias al balance del jugador
   * @param amount - Monto a agregar
   */
  private addWinnings(amount: number): void {
    if (amount <= 0) return;

    const balanceBefore = this.playerBalance;
    this.playerBalance += amount;
    this.balanceSubject.next(this.playerBalance);

    // Registrar transacción
    const transaction: Transaction = {
      id: this.transactionIdCounter++,
      type: TransactionType.WIN,
      amount: amount,
      balanceBefore: balanceBefore,
      balanceAfter: this.playerBalance,
      timestamp: new Date(),
      description: `Ganancia obtenida: ${amount}`
    };
    this.transactions.push(transaction);
  }

  /**
   * Registra una pérdida (apuesta sin ganancia)
   */
  private recordLoss(betAmount: number): void {
    // Registrar transacción de pérdida
    const transaction: Transaction = {
      id: this.transactionIdCounter++,
      type: TransactionType.LOSS,
      amount: 0, // La pérdida ya se dedujo con la apuesta
      balanceBefore: this.playerBalance,
      balanceAfter: this.playerBalance,
      timestamp: new Date(),
      description: `Apuesta perdida: ${betAmount}`
    };
    this.transactions.push(transaction);
  }

  /**
   * Establece el balance del jugador a un valor específico (comando admin)
   * @param amount - Nuevo balance
   */
  private setBalance(amount: number): string {
    // Validación: debe ser un número
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '❌ El balance debe ser un número válido';
    }

    // Validación: debe ser positivo o cero
    if (amount < 0) {
      return '❌ El balance no puede ser negativo';
    }

    // Validación: debe ser entero
    if (!Number.isInteger(amount)) {
      return '❌ El balance debe ser un número entero';
    }

    const oldBalance = this.playerBalance;
    this.playerBalance = amount;
    this.balanceSubject.next(this.playerBalance);

    return `✅ Balance actualizado: $${oldBalance} → $${this.playerBalance}`;
  }

  /**
   * Agrega una cantidad al balance del jugador (comando admin)
   * @param amount - Cantidad a agregar
   */
  private addBalance(amount: number): string {
    // Validación: debe ser un número
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '❌ La cantidad debe ser un número válido';
    }

    // Validación: debe ser entero
    if (!Number.isInteger(amount)) {
      return '❌ La cantidad debe ser un número entero';
    }

    // Validación: no puede resultar en balance negativo
    if (this.playerBalance + amount < 0) {
      return `❌ No se puede agregar ${amount} al balance actual ($${this.playerBalance}). Resultaría en balance negativo.`;
    }

    const oldBalance = this.playerBalance;
    this.playerBalance += amount;
    this.balanceSubject.next(this.playerBalance);

    return `✅ Balance actualizado: $${oldBalance} ${amount >= 0 ? '+' : ''}${amount} = $${this.playerBalance}`;
  }

  public trackByBet(index: number, bet: AnimalBet): number {
    return bet.id;
  }

  /**
   * Configura los comandos globales de administración en la consola del navegador
   */
  private setupAdminCommands(): void {
    // Mensaje discreto al inicio
    console.log('%c🔐 Sistema admin disponible', 'color: #6b7280; font-size: 11px;');

    // Exponer comandos globales
    (window as any).adminLogin = (username: string, password: string) => {
      const result = this.adminAuth.login(username, password);
      console.log(result);

      // Si login exitoso, mostrar comandos disponibles
      if (result.includes('✅')) {
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
      console.log(this.adminAuth.logout());
    };

    // Comandos de gestión de fichas
    (window as any).adminSetCoinValues = (values: number[]) => {
      if (!this.adminAuth.isAuthenticated()) {
        console.log('❌ Debes estar autenticado para cambiar valores de fichas\n💡 Usa: adminLogin("admin", "contraseña")');
        return;
      }
      console.log(this.setCoinValues(values));
    };

    (window as any).adminGetCoinValues = () => {
      console.log(`💰 Valores de fichas actuales: [${this.coinValues.join(', ')}]`);
    };

    (window as any).adminResetCoinValues = () => {
      if (!this.adminAuth.isAuthenticated()) {
        console.log('❌ Debes estar autenticado para resetear valores de fichas\n💡 Usa: adminLogin("admin", "contraseña")');
        return;
      }
      this.coinValues = [...this.DEFAULT_COIN_VALUES];
      this.cdr.markForCheck();
      console.log(`✅ Valores reseteados a: [${this.coinValues.join(', ')}]`);
    };

    // Comandos de gestión de balance
    (window as any).adminGetBalance = () => {
      console.log(`💰 Balance actual del jugador: $${this.playerBalance}`);
    };

    (window as any).adminSetBalance = (amount: number) => {
      if (!this.adminAuth.isAuthenticated()) {
        console.log('❌ Debes estar autenticado para cambiar el balance\n💡 Usa: adminLogin("admin", "contraseña")');
        return;
      }
      console.log(this.setBalance(amount));
    };

    (window as any).adminAddBalance = (amount: number) => {
      if (!this.adminAuth.isAuthenticated()) {
        console.log('❌ Debes estar autenticado para agregar balance\n💡 Usa: adminLogin("admin", "contraseña")');
        return;
      }
      console.log(this.addBalance(amount));
    };

    (window as any).adminResetBalance = () => {
      if (!this.adminAuth.isAuthenticated()) {
        console.log('❌ Debes estar autenticado para resetear el balance\n💡 Usa: adminLogin("admin", "contraseña")');
        return;
      }
      this.playerBalance = this.DEFAULT_BALANCE;
      this.balanceSubject.next(this.playerBalance);
      console.log(`✅ Balance reseteado a: $${this.DEFAULT_BALANCE}`);
    };

    (window as any).adminGetTransactions = (limit?: number) => {
      const transactionsToShow = limit ? this.transactions.slice(-limit) : this.transactions;
      if (transactionsToShow.length === 0) {
        console.log('📋 No hay transacciones registradas');
        return;
      }
      console.log(`📋 Historial de transacciones (${transactionsToShow.length}):`);
      console.table(transactionsToShow.map(t => ({
        ID: t.id,
        Tipo: t.type.toUpperCase(),
        Monto: t.amount,
        'Balance Antes': t.balanceBefore,
        'Balance Después': t.balanceAfter,
        Fecha: t.timestamp.toLocaleString(),
        Descripción: t.description
      })));
    };

    (window as any).adminClearTransactions = () => {
      if (!this.adminAuth.isAuthenticated()) {
        console.log('❌ Debes estar autenticado para limpiar transacciones\n💡 Usa: adminLogin("admin", "contraseña")');
        return;
      }
      this.transactions = [];
      this.transactionIdCounter = 0;
      console.log('✅ Historial de transacciones limpiado');
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
      console.log('🌀 Aurora Rings:', profile.auroraRings);
      console.log('✨ Aurora Filters:', profile.auroraFilters ? 'ON' : 'OFF');
      console.log('🎊 Confetti Particles:', profile.confettiParticles);
      console.log('🎬 Video Background:', profile.videoBackground ? 'ON' : 'OFF');
      console.log('💨 Backdrop Blur:', profile.backdropBlur ? 'ON' : 'OFF');
      console.log('🎨 Animation Quality:', profile.animationQuality);
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
    console.log('%c\n🎰 COMANDOS ADMIN DISPONIBLES 🎰', 'color: #f59e0b; font-weight: bold; font-size: 14px;');
    console.log('%c• adminStatus()', 'color: #3b82f6;', '- Ver estado de sesión actual');
    console.log('%c• adminChangePassword(currentPass, newPass)', 'color: #3b82f6;', '- Cambiar contraseña');
    console.log('%c• adminResetPassword()', 'color: #3b82f6;', '- Resetear contraseña a default');
    console.log('%c• adminLogout()', 'color: #3b82f6;', '- Cerrar sesión');
    console.log('%c\n💰 GESTIÓN DE FICHAS', 'color: #10b981; font-weight: bold;');
    console.log('%c• adminSetCoinValues([valores])', 'color: #3b82f6;', '- Establecer valores de fichas (6 valores)');
    console.log('%c• adminGetCoinValues()', 'color: #3b82f6;', '- Ver valores actuales');
    console.log('%c• adminResetCoinValues()', 'color: #3b82f6;', '- Resetear a valores por defecto');
    console.log('%c\n💵 GESTIÓN DE BALANCE', 'color: #10b981; font-weight: bold;');
    console.log('%c• adminGetBalance()', 'color: #3b82f6;', '- Ver balance actual del jugador');
    console.log('%c• adminSetBalance(monto)', 'color: #3b82f6;', '- Establecer balance del jugador');
    console.log('%c• adminAddBalance(monto)', 'color: #3b82f6;', '- Agregar/quitar balance (+ o -)');
    console.log('%c• adminResetBalance()', 'color: #3b82f6;', '- Resetear balance a $10000');
    console.log('%c• adminGetTransactions(limit?)', 'color: #3b82f6;', '- Ver historial de transacciones');
    console.log('%c• adminClearTransactions()', 'color: #3b82f6;', '- Limpiar historial de transacciones');
    console.log('%c\n🎡 CONFIGURACIÓN DE RUEDAS', 'color: #10b981; font-weight: bold;');
    console.log('%c• adminGetWheelDurations()', 'color: #3b82f6;', '- Ver duraciones actuales de ambas ruedas');
    console.log('%c• adminSetOuterWheelDuration(ms)', 'color: #3b82f6;', '- Establecer duración rueda externa (1000-30000ms)');
    console.log('%c• adminSetInnerWheelDuration(ms)', 'color: #3b82f6;', '- Establecer duración rueda interna (1000-30000ms)');
    console.log('%c• adminResetWheelDurations()', 'color: #3b82f6;', '- Resetear duraciones (Externa: 10000ms, Interna: 12000ms)');
    console.log('%c\n⚡ RENDIMIENTO GRÁFICO', 'color: #10b981; font-weight: bold;');
    console.log('%c• adminGetPerformanceProfile()', 'color: #3b82f6;', '- Ver perfil de rendimiento actual');
    console.log('%c• adminSetPerformanceTier("tier")', 'color: #3b82f6;', '- Cambiar tier: "high", "medium" o "low"');
  }

  /**
   * Establece nuevos valores para las fichas
   * @param values - Array de valores de fichas (debe tener exactamente 6 valores)
   * @returns Mensaje de resultado
   */
  private setCoinValues(values: number[]): string {
    // Validación 1: Debe ser un array
    if (!Array.isArray(values)) {
      return '❌ Los valores deben ser un array\n💡 Ejemplo: adminSetCoinValues([1, 10, 50, 100, 500, 2000])';
    }

    // Validación 2: Debe tener exactamente 6 fichas
    if (values.length !== 6) {
      return `❌ Debes proporcionar exactamente 6 valores de fichas (proporcionaste ${values.length})`;
    }

    // Validación 3: Solo números positivos
    if (!values.every(v => typeof v === 'number' && v > 0 && Number.isInteger(v))) {
      return '❌ Todos los valores deben ser números enteros positivos';
    }

    // Validación 4: Sin duplicados
    const uniqueValues = new Set(values);
    if (uniqueValues.size !== values.length) {
      return '❌ No se permiten valores duplicados';
    }

    // Ordenar y asignar
    this.coinValues = [...values].sort((a, b) => a - b);
    this.cdr.markForCheck();

    return `✅ Valores actualizados: [${this.coinValues.join(', ')}]`;
  }

  private getDevSecrets(): { hash: string, salt: string } {
    const hash = atob(this.HASH_B64);
    const salt = atob(this.SALT_B64);
    return { hash, salt };
  }

  /**
   * Precarga todos los assets de la aplicación (imágenes, videos, SVGs)
   * y actualiza el progreso de carga
   */
  private async preloadAssets(): Promise<void> {
    // Lista de todos los assets a precargar
    const imagePaths: string[] = [
      // Logo
      'assets/images/logo/logo.png',
      'assets/images/logo/rexludus.png',

      // Animales principales
      'assets/images/animales/RATA.png',
      'assets/images/animales/BUEY.png',
      'assets/images/animales/TIGRE.png',
      'assets/images/animales/CONEJO.png',
      'assets/images/animales/DRAGON.png',
      'assets/images/animales/SERPIENTE.png',
      'assets/images/animales/CABALLO.png',
      'assets/images/animales/CABRA.png',
      'assets/images/animales/MONO.png',
      'assets/images/animales/GALLO.png',
      'assets/images/animales/PERRO.png',
      'assets/images/animales/CERDO.png',

      // Animales MINGORE
      'assets/images/animales/RATA-MINGORE.png',
      'assets/images/animales/BUEY-MINGORE.png',
      'assets/images/animales/TIGRE-MINGORE.png',
      'assets/images/animales/CONEJO-MINGORE.png',
      'assets/images/animales/DRAGON-MINGORE.png',
      'assets/images/animales/SERPIENTE-MINGORE.png',
      'assets/images/animales/CABALLO-MINGORE.png',
      'assets/images/animales/CABRA-MINGORE.png',
      'assets/images/animales/MONO-MINGORE.png',
      'assets/images/animales/GALLO-MINGORE.png',
      'assets/images/animales/PERRO-MINGORE.png',
      'assets/images/animales/CERDO-MINGORE.png',

      // Multiplicadores
      'assets/images/multiplicadores/X1.png',
      'assets/images/multiplicadores/X1.5.png',
      'assets/images/multiplicadores/X2.png',
      'assets/images/multiplicadores/X3.png',
      'assets/images/multiplicadores/X5.png',
      'assets/images/multiplicadores/X10.png',

      // Contenedores
      'assets/images/contenedores/aro-dorado.png',
      'assets/images/contenedores/nombre-animal.png',
      'assets/images/contenedores/saldo.png',
      'assets/images/contenedores/apuesta.png',
      'assets/images/contenedores/apuesta-total.png',
      'assets/images/contenedores/panel-apuestas.png',
      'assets/images/contenedores/nube-1.png',
      'assets/images/contenedores/nube-2.png',
      'assets/images/contenedores/resultado-victoria.png',
      'assets/images/contenedores/resultado-derrota.png',

      // Fichas
      'assets/images/fichas/coin-bg-1.png',
      'assets/images/fichas/coin-bg-2.png',
      'assets/images/fichas/coin-bg-3.png',
      'assets/images/fichas/coin-bg-4.png',
      'assets/images/fichas/coin-bg-5.png',
      'assets/images/fichas/coin-bg-6.png',

      // Rueda
      'assets/images/rueda/puntero.png',
      'assets/images/rueda/borde.png',
      'assets/images/rueda/ying-yang.png',

      // Botones
      'assets/images/botones/limpiar.png',

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