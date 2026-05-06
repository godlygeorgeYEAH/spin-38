import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnChanges, SimpleChanges, OnInit, AfterViewInit, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WheelSpinResult, Animal, WheelItem } from '../../interfaces/wheel-general.interface';
import { GameState } from '../../interfaces/game.enums';
import { AudioService } from '../../services/audio.service';
import { PerformanceDetectorService, PerformanceProfile } from '../../services/performance-detector.service';

const animalMap: { [key: string]: Animal } = {
  'Rata': { name: 'Rata', emoji: '🐀', image: '/assets/images/animales/RATA-MINGORE.png', description: 'Inteligencia' },
  'Buey': { name: 'Buey', emoji: '🐂', image: '/assets/images/animales/BUEY-MINGORE.png', description: 'Fuerza' },
  'Tigre': { name: 'Tigre', emoji: '🐅', image: '/assets/images/animales/TIGRE-MINGORE.png', description: 'Valentía' },
  'Conejo': { name: 'Conejo', emoji: '🐇', image: '/assets/images/animales/CONEJO-MINGORE.png', description: 'Elegancia' },
  'Dragón': { name: 'Dragón', emoji: '🐉', image: '/assets/images/animales/DRAGON-MINGORE.png', description: 'Poder' },
  'Serpiente': { name: 'Serpiente', emoji: '🐍', image: '/assets/images/animales/SERPIENTE-MINGORE.png', description: 'Sabiduría' },
  'Caballo': { name: 'Caballo', emoji: '🐎', image: '/assets/images/animales/CABALLO-MINGORE.png', description: 'Energía' },
  'Cabra': { name: 'Cabra', emoji: '🐐', image: '/assets/images/animales/CABRA-MINGORE.png', description: 'Calma' },
  'Mono': { name: 'Mono', emoji: '🐒', image: '/assets/images/animales/MONO-MINGORE.png', description: 'Ingenio' },
  'Gallo': { name: 'Gallo', emoji: '🐓', image: '/assets/images/animales/GALLO-MINGORE.png', description: 'Confianza' },
  'Perro': { name: 'Perro', emoji: '🐕', image: '/assets/images/animales/PERRO-MINGORE.png', description: 'Lealtad' },
  'Cerdo': { name: 'Cerdo', emoji: '🐖', image: '/assets/images/animales/CERDO-MINGORE.png', description: 'Honestidad' }
};

@Component({
  selector: 'app-wheel-container',
  templateUrl: './wheel-container.component.html',
  styleUrls: ['./wheel-container.component.css'],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WheelContainerComponent implements OnInit, AfterViewInit, OnChanges {
  private static nextId = 0;
  public readonly componentId: number;

  @Input() animals: WheelItem[] = [];
  @Input() selectedAnimals: string[] = [];
  @Input() gameState: GameState = GameState.IDLE;
  @Input() isRandomPositioning: boolean = false;
  @Input() spinDuration: number = 8000; // Duración giro rueda externa
  @Input() innerWheelSpinDuration: number = 10000; // Duración giro rueda interna (debe ser >= spinDuration)
  @Input() expansionRange: number = 180;
  @Input() tutorialStage: string = '';
  @Input() set multiplierValues(values: number[] | undefined) {
    if (values && Array.isArray(values) && values.length === 6) {
      // Generar array de 12 valores (cada valor aparece 2 veces)
      // Orden: menor a mayor, repitiéndose
      this.numbers = [...values, ...values];
    }
    // Si no se proporciona o es inválido, mantener valores por defecto
  }
  @Output() onAnimalToggle = new EventEmitter<Animal>();
  @Output() manualSpinRequested = new EventEmitter<void>();

  @ViewChild('outerWheel', { static: true }) outerWheel!: ElementRef<SVGGElement>;
  @ViewChild('innerWheel', { static: true }) innerWheel!: ElementRef<SVGGElement>;

  public spinning = false;
  public displayItems: Animal[] = [];
  public errorMessage: string = '';
  public winningNumberIndex: number | null = null;
  public showConfetti = false;
  public pointerBounce = false;

  private isDragging = false;
  private lastMouseAngle = 0;
  private manualRotation = 0;
  private isDragIntent = false;
  private dragStartCoords = { x: 0, y: 0 };
  private potentialTapTarget: Animal | null = null;
  private justProcessedTap = false; // Prevenir doble emisión

  private adjustmentAngularRange: number = 90;
  private velocityThreshold: number = 2.5;
  // private expansionRange: number = 180; // Now an Input
  private isAdjustmentMode: boolean = false;
  private adjustmentStartAngle: number = 0;
  private lastUpdateTime: number = 0;
  private lastAngle: number = 0;

  private restingOuterAngle = 0;
  private restingInnerAngle = 0;

  private targetOuterAngle = 0;
  private targetInnerAngle = 0;

  public numbers = [10, 5, 3, 2, 1.5, 1, 10, 5, 3, 2, 1.5, 1];
  private readonly fallbackZodiacs = ['Rata', 'Buey', 'Tigre', 'Conejo', 'Dragón', 'Serpiente', 'Caballo', 'Cabra', 'Mono', 'Gallo', 'Perro', 'Cerdo'];
  private readonly segmentsCount = 12;
  private readonly degreesPerSegment = 360 / this.segmentsCount;

  // Cache para cálculos trigonométricos
  private segmentPathCache = new Map<string, string>();
  private textPathCache = new Map<number, string>();
  private animalTransformCache = new Map<number, string>();
  private numberTransformCache = new Map<number, string>();

  // ==========================================
  // CONFIGURACIÓN DE POSICIONAMIENTO SVG
  // ==========================================
  // El SVG tiene viewBox="-210 -210 420 420", lo que nos da un sistema de coordenadas
  // que va de -210 a +210 en ambos ejes X e Y, centrado en (0,0).
  // Todos los cálculos de radio son relativos a este espacio de coordenadas del viewBox.

  /**
   * Radio máximo disponible en el sistema de coordenadas del viewBox SVG.
   * Define el "canvas" donde se dibuja la rueda completa.
   *
   * IMPORTANTE: Este valor debe ser mayor que el outerRingRadius para que
   * la rueda no se corte en los bordes. Debe haber espacio (padding) entre
   * el anillo exterior y los límites del viewBox.
   *
   * Fórmula recomendada: SVG_VIEWBOX_RADIUS > outerRingRadius + padding
   * Ejemplo: Si outerRingRadius = 200, usar radius >= 210 (10px de padding)
   *
   * Para aumentar límites de la rueda: incrementa este valor.
   * Valor base: 210 (viewBox="420×420")
   */
  private readonly SVG_VIEWBOX_RADIUS = 300;

  /**
   * Ratio para posicionar las imágenes de animales en la rueda.
   * Los animales se posicionan al 76.2% del radio del viewBox.
   * Esto los mantiene en el anillo exterior de la rueda.
   *
   * Para ajustar: aumentar ratio para mover animales hacia afuera (máx 1.0),
   *               disminuir para moverlos hacia adentro (mín 0.0)
   */
  private readonly ANIMAL_POSITION_RATIO = 0.720; // 160/210 ≈ 0.762

  /**
   * Ratio para posicionar las etiquetas numéricas en la rueda.
   * Los números se posicionan al 47.6% del radio del viewBox.
   * Esto los mantiene en el anillo interior, más cerca del centro.
   *
   * Para ajustar: aumentar ratio para mover números hacia afuera (máx < ANIMAL_POSITION_RATIO),
   *               disminuir para moverlos hacia adentro (mín 0.0)
   */
  private readonly NUMBER_POSITION_RATIO = 0.450; // 100/210 ≈ 0.476

  /**
   * Ratio para posicionar el texto curvado de nombres de animales.
   * El texto se posiciona al 88% del radio del anillo exterior.
   * Esto lo coloca cerca del borde externo del segmento rojo.
   *
   * Para ajustar: aumentar para mover el texto hacia el borde exterior (máx ~0.95),
   *               disminuir para moverlo hacia el centro (mín 0.0)
   */
  private readonly ANIMAL_TEXT_POSITION_RATIO = 0.88;

  /**
   * Radio calculado para posicionamiento de animales (en unidades SVG).
   * Este es el radio real usado en los cálculos trigonométricos.
   */
  private get animalRadius(): number {
    return this.SVG_VIEWBOX_RADIUS * this.ANIMAL_POSITION_RATIO;
  }

  /**
   * Radio calculado para posicionamiento de números (en unidades SVG).
   * Este es el radio real usado en los cálculos trigonométricos.
   */
  private get numberRadius(): number {
    return this.SVG_VIEWBOX_RADIUS * this.NUMBER_POSITION_RATIO;
  }

  /**
   * Offset angular para hacer que 0° apunte hacia arriba en lugar de derecha.
   * En trigonometría estándar, 0° apunta a la derecha (3 en punto).
   * Restar π/2 (90°) rota la referencia para que 0° apunte arriba (12 en punto).
   */
  private readonly ANGLE_OFFSET_FOR_TOP = Math.PI / 2;

  /**
   * Ratio para el radio del anillo exterior (segmentos de animales).
   * Define el tamaño del anillo exterior como porcentaje del radio del viewBox.
   * Valor base: 200 unidades SVG / 210 radio = 0.952
   *
   * ⚠️ ADVERTENCIA CRÍTICA: Este ratio DEBE ser < 1.0
   *
   * Si OUTER_RING_RATIO ≥ 1.0, el anillo se dibujará FUERA del viewBox y se verá
   * cuadrado/cortado porque el SVG no puede renderizar contenido fuera de sus límites.
   *
   * ✅ CORRECTO para aumentar tamaño:
   * 1. Aumentar SVG_VIEWBOX_RADIUS primero
   * 2. Mantener OUTER_RING_RATIO < 1.0 (recomendado ≤ 0.95)
   *
   * ❌ INCORRECTO:
   * - OUTER_RING_RATIO = 2 → anillo 2x más grande que viewBox → se corta
   * - OUTER_RING_RATIO = 1.5 → anillo 1.5x más grande que viewBox → se corta
   * - OUTER_RING_RATIO = 1.01 → anillo excede viewBox → se corta
   *
   * Rango válido: 0.3 (pequeño) a 0.98 (muy cercano al borde)
   */
  private readonly OUTER_RING_RATIO = 0.999; // 200/210 ≈ 0.952

  /**
   * Ratio para el radio del anillo interior (segmentos de números).
   * El anillo interior ocupa el 57.1% del radio del viewBox.
   * Valor base: 120 unidades SVG / 210 radio = 0.571
   *
   * Para ajustar: aumentar para anillo más grande (máx < OUTER_RING_RATIO),
   *               disminuir para anillo más pequeño (mín ~0.3 para visibilidad)
   * esto controla el tamaño de la rueda de los numeros
   */
  private readonly INNER_RING_RATIO = 0.555; // 120/210 ≈ 0.571

  /**
   * Ratio para el tamaño de las imágenes de animales en la rueda.
   * Las imágenes tienen un tamaño de 23.8% del radio del viewBox.
   * Valor base: 50 unidades SVG / 210 radio = 0.238
   *
   * Para ajustar: aumentar para imágenes más grandes (máx ~0.4 sin solapamiento),
   *               disminuir para imágenes más pequeñas (mín ~0.1 para visibilidad)
   */
  private readonly ANIMAL_IMAGE_SIZE_RATIO = 0.299; // 50/210 ≈ 0.238

  /**
   * Tamaño calculado de las imágenes de animales (en unidades SVG).
   * Se calcula como un porcentaje del radio del viewBox para mantener proporciones
   * consistentes cuando cambie el tamaño de la rueda.
   */
  public get animalImageSize(): number {
    return this.SVG_VIEWBOX_RADIUS * this.ANIMAL_IMAGE_SIZE_RATIO;
  }

  /**
   * Offset calculado para centrar las imágenes de animales.
   * El offset es negativo y equivale a la mitad del tamaño de la imagen,
   * lo que centra la imagen en las coordenadas calculadas.
   *
   * Ejemplo: Si animalImageSize = 50, offset = -25
   * Esto posiciona la imagen desde -25 hasta +25 en ambos ejes, centrada en (0,0).
   */
  public get animalImageOffset(): number {
    return -this.animalImageSize / 2;
  }

  /**
   * Radio calculado del anillo exterior de la rueda (en unidades SVG).
   * Este radio define el tamaño de los segmentos rojos donde se posicionan los animales.
   * Se calcula dinámicamente basado en el radio del viewBox.
   *
   * Ejemplo: Si SVG_VIEWBOX_RADIUS = 210, outerRingRadius = 200
   */
  public get outerRingRadius(): number {
    return this.SVG_VIEWBOX_RADIUS * this.OUTER_RING_RATIO;
  }

  /**
   * Radio calculado del anillo interior de la rueda (en unidades SVG).
   * Este radio define el tamaño de los segmentos de colores donde se posicionan los números.
   * Se calcula dinámicamente basado en el radio del viewBox.
   *
   * Ejemplo: Si SVG_VIEWBOX_RADIUS = 210, innerRingRadius = 120
   */
  public get innerRingRadius(): number {
    return this.SVG_VIEWBOX_RADIUS * this.INNER_RING_RATIO;
  }

  /**
   * String del viewBox SVG calculado dinámicamente.
   * Define el sistema de coordenadas del SVG centrado en (0,0).
   * Formato: "minX minY width height"
   *
   * Ejemplo: Si SVG_VIEWBOX_RADIUS = 210:
   * - viewBox = "-210 -210 420 420"
   * - Coordenadas van de -210 a +210 en ambos ejes
   *
   * Al cambiar SVG_VIEWBOX_RADIUS, el viewBox se ajusta automáticamente.
   */
  public get viewBoxSize(): string {
    const r = this.SVG_VIEWBOX_RADIUS;
    return `${-r} ${-r} ${r * 2} ${r * 2}`;
  }

  private currentVelocity: number = 0;
  private lastDeltaAngle: number = 0;
  private playIntentThreshold: number = 300;

  // Variables para detección de cruce de segmentos y audio
  private lastSegmentIndex: number = -1;
  private animationFrameId: number | null = null;

  // Sistema optimizado de monitoreo basado en tiempo (sin getComputedStyle)
  private spinStartTime: number = 0;
  private spinStartAngle: number = 0;
  private spinTargetAngle: number = 0;
  private spinDurationMs: number = 0;

  public performanceProfile: PerformanceProfile;
  public auroraRingsArray: number[] = [];
  public confettiArray: { index: number; angle: number; distance: number; delay: number; duration: number }[] = [];
  public isSafari: boolean = false; // Detectar Safari para desactivar animación problemática

  constructor(
    private zone: NgZone,
    private audioService: AudioService,
    private cdr: ChangeDetectorRef,
    private performanceDetector: PerformanceDetectorService
  ) {
    this.componentId = ++WheelContainerComponent.nextId;
    this.performanceProfile = this.performanceDetector.getPerformanceProfile();

    // Detectar Safari (incluyendo Safari iOS)
    this.isSafari = this.detectSafari();
    if (this.isSafari) {
      console.log('🦁 Safari detectado - Animación de tutorial desactivada');
    }

    // Generar arrays basados en el perfil de rendimiento
    this.auroraRingsArray = Array.from({ length: this.performanceProfile.auroraRings }, (_, i) => i);

    // Generar confetti con distribución uniforme en 360°
    this.generateConfettiDistribution();

    console.log(`🎨 Aurora Rings: ${this.performanceProfile.auroraRings}`);
    console.log(`🎊 Confetti: ${this.performanceProfile.confettiParticles} partículas`);
  }

  /**
   * Detecta si el navegador es Safari (desktop o iOS)
   * @returns true si es Safari, false en caso contrario
   */
  private detectSafari(): boolean {
    const ua = navigator.userAgent.toLowerCase();

    // Safari desktop y iOS Safari
    const isSafari = ua.includes('safari') && !ua.includes('chrome') && !ua.includes('android');

    // También detectar Safari iOS específicamente
    const isIOS = /iphone|ipad|ipod/.test(ua);

    return isSafari || isIOS;
  }

  /**
   * Genera distribución uniforme de confetti en 360° independiente de la cantidad
   */
  private generateConfettiDistribution(): void {
    const count = this.performanceProfile.confettiParticles;
    const angleStep = 360 / count;

    this.confettiArray = Array.from({ length: count }, (_, i) => {
      // Distribución uniforme en círculo completo
      const angle = i * angleStep;

      // Variar distancias para efecto más natural (250-295px)
      const distance = 250 + (i % 3) * 15 + Math.random() * 15;

      // Delays escalonados para efecto de explosión (0-0.08s)
      const delay = (i % 8) * 0.01;

      // Duraciones variables (2.0-2.4s)
      const duration = 2.0 + (i % 5) * 0.1;

      return {
        index: i + 1,
        angle: angle,
        distance: distance,
        delay: delay,
        duration: duration
      };
    });
  }

  /**
   * Obtiene el color de una partícula de confetti
   * Alterna entre 4 colores para variedad visual
   */
  public getConfettiColor(index: number): string {
    const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#95e1d3'];
    return colors[index % colors.length];
  }

  ngOnInit(): void {
    this.spinning = false;
    this.displayItems = [];
    this.errorMessage = '';
    this.isDragging = false;
    this.lastMouseAngle = 0;
    this.manualRotation = 0;
    this.isDragIntent = false;
    this.potentialTapTarget = null;
    this.restingOuterAngle = 0;
    this.restingInnerAngle = 0;
    this.targetOuterAngle = 0;
    this.targetInnerAngle = 0;

    this.prepareDisplayItems();
    this.setupManualInteraction();
  }

  ngAfterViewInit(): void {
    // Safari fix: Inicializar transform explícitamente en las ruedas
    if (this.outerWheel && this.innerWheel) {
      this.initializeWheelTransforms();
    }
  }

  /**
   * Inicializa los transforms de las ruedas explícitamente para Safari
   * Safari necesita que los transforms se establezcan desde el inicio
   */
  private initializeWheelTransforms(): void {
    const outerElement = this.outerWheel.nativeElement;
    const innerElement = this.innerWheel.nativeElement;

    // Establecer transform inicial sin transición
    outerElement.style.transition = 'none';
    innerElement.style.transition = 'none';

    outerElement.style.transform = `rotate(0deg)`;
    innerElement.style.transform = `rotate(0deg)`;

    // Forzar reflow
    outerElement.getBoundingClientRect();
    innerElement.getBoundingClientRect();

    // Desactivar will-change hasta que sea necesario
    outerElement.style.willChange = 'auto';
    innerElement.style.willChange = 'auto';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['animals']) {
      this.prepareDisplayItems();
    }

    // Nota: La animación de tutorial está desactivada en Safari via HTML binding
  }


  /**
   * Maneja el click directo en un segmento de animal (fallback confiable)
   * Este método proporciona una forma alternativa de selección que no depende
   * del sistema de detección de drag, mejorando la reactividad
   */
  public onSegmentClick(animal: Animal, event: Event): void {
    console.log('[WheelContainer] onSegmentClick called', {
      animal: animal.name,
      spinning: this.spinning,
      gameState: this.gameState,
      isDragIntent: this.isDragIntent,
      isDragging: this.isDragging,
      justProcessedTap: this.justProcessedTap
    });

    // Prevenir que se active durante spinning o drag real (no tap)
    // Solo bloquear si realmente se está arrastrando (isDragIntent), no en taps simples
    if (this.spinning || this.gameState === GameState.PLAYING) {
      console.log('[WheelContainer] onSegmentClick blocked by spinning/gameState');
      return;
    }

    // Si hay un drag intent activo, no procesar el click
    if (this.isDragIntent) {
      console.log('[WheelContainer] onSegmentClick blocked by isDragIntent');
      return;
    }

    // Si acabamos de procesar un tap en endDrag, no procesar el click duplicado
    if (this.justProcessedTap) {
      console.log('[WheelContainer] onSegmentClick blocked by justProcessedTap');
      this.justProcessedTap = false;
      return;
    }

    event.stopPropagation();
    this.onAnimalToggle.emit(animal);
    console.log('[WheelContainer] onSegmentClick emitted');
  }

  private setupManualInteraction(): void {
    const wheelElement = this.outerWheel.nativeElement.closest('.wheel-wrapper') as HTMLElement;
    if (!wheelElement) return;

    wheelElement.addEventListener('mousedown', (event) => this.zone.run(() => this.onMouseDown(event)));
    document.addEventListener('mousemove', (event) => this.zone.run(() => this.onMouseMove(event)));
    document.addEventListener('mouseup', (event) => this.zone.run(() => this.onMouseUp(event)));

    wheelElement.addEventListener('touchstart', (event) => this.zone.run(() => this.onTouchStart(event)), { passive: false });
    document.addEventListener('touchmove', (event) => this.zone.run(() => this.onTouchMove(event)), { passive: false });
    document.addEventListener('touchend', (event) => this.zone.run(() => this.onTouchEnd(event)));
  }

  private onMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const closestYinYang = target.closest('.yin-yang-center');

    console.log('[WheelContainer] onMouseDown', {
      target: target.tagName,
      targetClasses: target.className,
      spinning: this.spinning,
      gameState: this.gameState,
      closestYinYang: closestYinYang ? 'FOUND - IGNORING' : 'not found'
    });

    if (this.spinning || this.gameState === GameState.PLAYING) {
      console.log('[WheelContainer] onMouseDown - blocked by spinning/gameState');
      return;
    }

    // Ignorar clicks en el yin-yang center
    if (closestYinYang) {
      console.log('[WheelContainer] onMouseDown - blocked by yin-yang-center');
      return;
    }

    // SIEMPRE iniciar el drag - el sistema de drag decidirá si es un tap o un drag
    event.preventDefault();
    console.log('[WheelContainer] onMouseDown - calling startDrag');
    this.startDrag(event.clientX, event.clientY);
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    event.preventDefault();
    this.updateDrag(event.clientX, event.clientY);
  }

  private onMouseUp(event: MouseEvent): void {
    console.log('[WheelContainer] onMouseUp', {
      isDragging: this.isDragging,
      isDragIntent: this.isDragIntent,
      potentialTapTarget: this.potentialTapTarget?.name
    });

    if (!this.isDragging) {
      // Resetear isDragIntent incluso si no hay drag activo
      this.isDragIntent = false;
      return;
    }
    event.preventDefault();
    this.endDrag();
  }

  private onTouchStart(event: TouchEvent): void {
    if (this.spinning || this.gameState === GameState.PLAYING) return;

    // Ignorar clicks en el yin-yang center
    const target = event.target as HTMLElement;
    if (target.closest('.yin-yang-center')) {
      return;
    }

    // SIEMPRE iniciar el drag - el sistema de drag decidirá si es un tap o un drag
    event.preventDefault();
    this.startDrag(event.touches[0].clientX, event.touches[0].clientY);
  }

  private onTouchMove(event: TouchEvent): void {
    if (!this.isDragging) return;
    event.preventDefault();
    this.updateDrag(event.touches[0].clientX, event.touches[0].clientY);
  }

  private onTouchEnd(event: TouchEvent): void {
    if (!this.isDragging) return;
    event.preventDefault();
    this.endDrag();
  }

  private startDrag(clientX: number, clientY: number): void {
    this.isDragging = true;
    this.isDragIntent = false;
    this.dragStartCoords = { x: clientX, y: clientY };
    this.potentialTapTarget = null;
    this.manualRotation = 0;

    // Inicializar segmento actual para detección de sonido
    this.lastSegmentIndex = this.getCurrentSegmentIndex(this.restingOuterAngle);

    const wheelRect = this.outerWheel.nativeElement.getBoundingClientRect();
    const centerX = wheelRect.left + wheelRect.width / 2;
    const centerY = wheelRect.top + wheelRect.height / 2;
    this.lastMouseAngle = Math.atan2(clientY - centerY, clientX - centerX);

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
    const outerRadius = wheelRect.width / 2;
    const innerRadius = outerRadius * (120 / 200);

    // Expandir el rango para incluir las imágenes de animales
    // Las imágenes pueden extenderse más allá del borde exterior
    const minRadius = innerRadius * 0.5; // 50% del innerRadius para capturar clicks más cerca del centro
    const maxRadius = outerRadius * 1.3; // 130% del outerRadius para capturar las imágenes extendidas

    // Calcular potentialTapTarget si el click está dentro del rango expandido
    if (distanceFromCenter >= minRadius && distanceFromCenter <= maxRadius) {
      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      angle = (angle + 450) % 360;

      const currentWheelRotation = (this.restingOuterAngle % 360 + 360) % 360;
      const effectiveAngle = (angle - currentWheelRotation + 360) % 360;

      const segmentIndex = Math.floor(effectiveAngle / this.degreesPerSegment);
      console.log('[WheelContainer] startDrag - calculating tap target', {
        clickAngle: angle,
        currentWheelRotation,
        effectiveAngle,
        segmentIndex,
        degreesPerSegment: this.degreesPerSegment,
        targetAnimal: this.displayItems[segmentIndex]?.name,
        distanceFromCenter,
        minRadius,
        maxRadius,
        innerRadius,
        outerRadius
      });

      if (this.displayItems[segmentIndex]) {
        this.potentialTapTarget = this.displayItems[segmentIndex];
        console.log('[WheelContainer] startDrag - potentialTapTarget set to:', this.potentialTapTarget.name);
      } else {
        console.log('[WheelContainer] startDrag - NO valid segment found at index:', segmentIndex);
      }
    } else {
      console.log('[WheelContainer] startDrag - click outside valid radius', {
        distanceFromCenter,
        minRadius,
        maxRadius
      });
    }

    this.isAdjustmentMode = true;
    this.adjustmentStartAngle = 0;
    this.lastUpdateTime = Date.now();
    this.lastAngle = this.lastMouseAngle;
  }

  private updateDrag(clientX: number, clientY: number): void {
    const deltaX = clientX - this.dragStartCoords.x;
    const deltaY = clientY - this.dragStartCoords.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Umbral aumentado de 10px a 25px para mayor tolerancia en taps
    if (distance > 25 && !this.isDragIntent) {
      this.isDragIntent = true;
      this.potentialTapTarget = null;
    }

    if (!this.isDragIntent) return;

    const wheelRect = this.outerWheel.nativeElement.getBoundingClientRect();
    const centerX = wheelRect.left + wheelRect.width / 2;
    const centerY = wheelRect.top + wheelRect.height / 2;
    const currentAngle = Math.atan2(clientY - centerY, clientX - centerX);

    let deltaAngle = currentAngle - this.lastMouseAngle;

    if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
    if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

    this.lastDeltaAngle = deltaAngle;

    const currentTime = Date.now();
    const timeDelta = currentTime - this.lastUpdateTime;
    const angleDeltaDeg = Math.abs(deltaAngle * (180 / Math.PI));

    const velocity = timeDelta > 0 ? angleDeltaDeg / (timeDelta / 1000) : 0;
    this.currentVelocity = velocity;

    if (velocity > this.velocityThreshold && this.isAdjustmentMode) {
      this.isAdjustmentMode = false;
    }

    const rotationIncrement = deltaAngle * (180 / Math.PI);

    if (this.isAdjustmentMode) {
      const minRotation = this.adjustmentStartAngle - this.expansionRange / 2;
      const maxRotation = this.adjustmentStartAngle + this.expansionRange / 2;
      this.manualRotation = Math.max(minRotation, Math.min(maxRotation, this.manualRotation + rotationIncrement));
    } else {
      this.manualRotation += rotationIncrement;
    }

    this.lastMouseAngle = currentAngle;
    this.lastUpdateTime = currentTime;
    this.lastAngle = currentAngle;

    this.outerWheel.nativeElement.style.transition = 'none';
    this.innerWheel.nativeElement.style.transition = 'none';
    this.outerWheel.nativeElement.style.transform = `rotate(${this.restingOuterAngle + this.manualRotation}deg)`;
    this.innerWheel.nativeElement.style.transform = `rotate(${this.restingInnerAngle - this.manualRotation}deg)`;

    // Verificar cruce de segmento y reproducir sonido durante el arrastre
    const currentWheelAngle = this.restingOuterAngle + this.manualRotation;
    this.checkSegmentCrossing(currentWheelAngle);
  }

  private applyInertiaStop(element: SVGGElement, targetAngle: number): void {
    element.style.transition = 'transform 800ms cubic-bezier(0.1, 0.57, 0.1, 1)';
    element.style.transform = `rotate(${targetAngle}deg)`;

    setTimeout(() => {
      if (!this.spinning && !this.isDragging) {
        element.style.transition = 'none';
      }
    }, 800);
  }

  private endDrag(): void {
    console.log('[WheelContainer] endDrag', {
      isDragging: this.isDragging,
      isDragIntent: this.isDragIntent,
      potentialTapTarget: this.potentialTapTarget?.name,
      currentVelocity: this.currentVelocity
    });

    this.isDragging = false;

    if (this.isDragIntent) {

      if (this.currentVelocity > this.playIntentThreshold) {

        this.restingOuterAngle += this.manualRotation;
        this.restingInnerAngle -= this.manualRotation;
        this.manualRotation = 0;

        this.zone.run(() => this.manualSpinRequested.emit());

      } else {
        const direction = this.lastDeltaAngle >= 0 ? 1 : -1;
        const inertia = this.currentVelocity * 0.3 * direction;

        const finalOuter = this.restingOuterAngle + this.manualRotation + inertia;
        const finalInner = this.restingInnerAngle - (this.manualRotation + inertia);

        this.applyInertiaStop(this.outerWheel.nativeElement, finalOuter);
        this.applyInertiaStop(this.innerWheel.nativeElement, finalInner);

        this.restingOuterAngle = finalOuter;
        this.restingInnerAngle = finalInner;
        this.manualRotation = 0;
      }

    } else if (this.potentialTapTarget) {
      console.log('[WheelContainer] endDrag - emitting potentialTapTarget:', this.potentialTapTarget.name);
      this.justProcessedTap = true;
      this.zone.run(() => this.onAnimalToggle.emit(this.potentialTapTarget!));
      // Resetear el flag después de un pequeño delay para evitar bloquear clicks legítimos
      setTimeout(() => this.justProcessedTap = false, 50);
    } else {
      console.log('[WheelContainer] endDrag - NO potentialTapTarget to emit');
    }

    this.potentialTapTarget = null;
    this.isDragIntent = false;
    this.currentVelocity = 0;
  }

  /**
   * Ejecuta el giro de ambas ruedas de forma independiente y retorna los resultados.
   *
   * MECÁNICA DEL JUEGO:
   * - La rueda EXTERNA determina el animal ganador
   * - La rueda INTERNA determina el multiplicador ganador (independiente)
   * - Cada rueda gira aleatoriamente a su propio índice (0-11)
   *
   * @returns Promise con el resultado del giro incluyendo:
   *   - animal: El animal ganador de la rueda externa
   *   - number: El multiplicador ganador de la rueda interna
   *   - outerWheelIndex: Índice donde cayó la rueda externa
   *   - innerWheelIndex: Índice donde cayó la rueda interna
   *   - innerWheelAnimal: Animal en la posición donde cayó el multiplicador
   */
  public spinAndGetResult(): Promise<WheelSpinResult> {
    if (this.spinning) {
      return Promise.reject(new Error("La ruleta ya está girando."));
    }

    this.spinning = true;

    // Validar que la rueda interna siempre dure >= que la externa
    const validatedInnerDuration = Math.max(this.innerWheelSpinDuration, this.spinDuration);
    if (validatedInnerDuration !== this.innerWheelSpinDuration) {
      console.warn(`⚠️ innerWheelSpinDuration (${this.innerWheelSpinDuration}ms) es menor que spinDuration (${this.spinDuration}ms). Se ajustó a ${validatedInnerDuration}ms`);
    }

    return new Promise((resolve) => {
      // Generar DOS índices aleatorios INDEPENDIENTES
      const outerResultIndex = Math.floor(Math.random() * this.segmentsCount);
      const innerResultIndex = Math.floor(Math.random() * this.segmentsCount);

      // Obtener resultados de cada rueda
      const winningAnimalItem = this.displayItems[outerResultIndex];
      const winningNumber = this.numbers[innerResultIndex];
      const innerWheelAnimalItem = this.displayItems[innerResultIndex];

      // Calcular ángulos finales para cada rueda con SUS PROPIOS índices
      this.targetOuterAngle = this.calculateFinalAngle(outerResultIndex, this.restingOuterAngle, true);
      this.targetInnerAngle = this.calculateFinalAngle(innerResultIndex, this.restingInnerAngle, false);

      // Iniciar monitoreo de rotación optimizado (basado en tiempo, sin getComputedStyle)
      this.lastSegmentIndex = this.getCurrentSegmentIndex(this.restingOuterAngle);
      this.spinStartTime = performance.now();
      this.spinStartAngle = this.restingOuterAngle;
      this.spinTargetAngle = this.targetOuterAngle;
      this.spinDurationMs = this.spinDuration;
      this.monitorWheelRotation();

      // Aplicar animación de giro a ambas ruedas CON DURACIONES INDEPENDIENTES
      this.applySpinAnimation(this.outerWheel.nativeElement, this.targetOuterAngle, this.spinDuration);
      this.applySpinAnimation(this.innerWheel.nativeElement, this.targetInnerAngle, validatedInnerDuration);

      // Esperar al tiempo máximo (rueda interna que siempre es >= a la externa)
      setTimeout(() => {
        this.spinning = false;
        this.restingOuterAngle = this.targetOuterAngle;
        this.restingInnerAngle = this.targetInnerAngle;

        // Safari fix: Forzar detención completa de la animación
        this.forceStopAnimation(this.outerWheel.nativeElement, this.targetOuterAngle);
        this.forceStopAnimation(this.innerWheel.nativeElement, this.targetInnerAngle);

        // Verificar si el jugador ganó (si apostó al animal ganador)
        const playerWon = this.selectedAnimals.includes(winningAnimalItem.name);

        // Solo activar animación de victoria si el jugador ganó
        if (playerWon) {
          this.zone.run(() => {
            this.winningNumberIndex = innerResultIndex;
            this.showConfetti = true; // Activar confetti inmediatamente
            this.audioService.playVictory(); // Reproducir sonido de victoria
            console.log('🎰 ¡VICTORIA! Animación activada - Animal ganador:', winningAnimalItem.name, 'Número:', winningNumber);
            this.cdr.markForCheck();
          });
        } else {
          console.log('❌ El jugador perdió - No se activa animación');
        }

        // Usar delay condicional: 2.5s para victorias (mostrar animación), 300ms para derrotas (rápido)
        const resultDelay = playerWon ? 1500 : 300;

        setTimeout(() => {
          // Mapear a objetos Animal completos
          const winningAnimal: Animal = animalMap[winningAnimalItem.name] || { name: winningAnimalItem.name, emoji: '❓' };
          const innerWheelAnimal: Animal = animalMap[innerWheelAnimalItem.name] || { name: innerWheelAnimalItem.name, emoji: '❓' };

          // Limpiar la animación del número ganador y el confetti
          this.zone.run(() => {
            this.winningNumberIndex = null;
            this.showConfetti = false;
            this.cdr.markForCheck();
          });

          // Resultado completo con información de ambas ruedas para logging
          resolve({
            animal: winningAnimal,
            number: winningNumber,
            isPositioningOnly: this.isRandomPositioning,
            outerWheelIndex: outerResultIndex,
            innerWheelIndex: innerResultIndex,
            innerWheelAnimal: innerWheelAnimal
          });
        }, resultDelay);
      }, validatedInnerDuration); // Esperar a que termine la rueda interna (la más lenta)
    });
  }

  /**
   * Gira la ruleta hacia un resultado específico proporcionado por el backend
   * @param result - Resultado del backend (animal ganador y multiplicador)
   * @returns Promise que se resuelve cuando la animación termina
   */
  public spinToResult(result: { animal: Animal; number: number }): Promise<WheelSpinResult> {
    if (this.spinning) {
      return Promise.reject(new Error("La ruleta ya está girando."));
    }

    console.log('[WheelContainer] Girando hacia resultado del backend:', result);

    this.spinning = true;

    // Validar que la rueda interna siempre dure >= que la externa
    const validatedInnerDuration = Math.max(this.innerWheelSpinDuration, this.spinDuration);
    if (validatedInnerDuration !== this.innerWheelSpinDuration) {
      console.warn(`⚠️ innerWheelSpinDuration (${this.innerWheelSpinDuration}ms) es menor que spinDuration (${this.spinDuration}ms). Se ajustó a ${validatedInnerDuration}ms`);
    }

    return new Promise((resolve, reject) => {
      // Encontrar el índice del animal ganador en displayItems
      const outerResultIndex = this.displayItems.findIndex(item => item.name === result.animal.name);
      if (outerResultIndex === -1) {
        console.error('[WheelContainer] Animal ganador no encontrado en displayItems:', result.animal.name);
        this.spinning = false;
        reject(new Error(`Animal ${result.animal.name} no encontrado`));
        return;
      }

      // Encontrar el índice del número ganador en la rueda interna
      const innerResultIndex = this.numbers.findIndex(num => num === result.number);
      if (innerResultIndex === -1) {
        console.error('[WheelContainer] Número ganador no encontrado en numbers:', result.number);
        this.spinning = false;
        reject(new Error(`Número ${result.number} no encontrado`));
        return;
      }

      console.log('[WheelContainer] Índices calculados - Animal:', outerResultIndex, 'Número:', innerResultIndex);

      // Obtener los items de resultado
      const winningAnimalItem = this.displayItems[outerResultIndex];
      const winningNumber = this.numbers[innerResultIndex];
      const innerWheelAnimalItem = this.displayItems[innerResultIndex];

      // Calcular ángulos finales para cada rueda
      this.targetOuterAngle = this.calculateFinalAngle(outerResultIndex, this.restingOuterAngle, true);
      this.targetInnerAngle = this.calculateFinalAngle(innerResultIndex, this.restingInnerAngle, false);

      console.log('[WheelContainer] Ángulos objetivo - Outer:', this.targetOuterAngle, 'Inner:', this.targetInnerAngle);

      // Iniciar monitoreo de rotación optimizado
      this.lastSegmentIndex = this.getCurrentSegmentIndex(this.restingOuterAngle);
      this.spinStartTime = performance.now();
      this.spinStartAngle = this.restingOuterAngle;
      this.spinTargetAngle = this.targetOuterAngle;
      this.spinDurationMs = this.spinDuration;
      this.monitorWheelRotation();

      // Aplicar animación de giro a ambas ruedas CON DURACIONES INDEPENDIENTES
      this.applySpinAnimation(this.outerWheel.nativeElement, this.targetOuterAngle, this.spinDuration);
      this.applySpinAnimation(this.innerWheel.nativeElement, this.targetInnerAngle, validatedInnerDuration);

      console.log('[WheelContainer] Animaciones iniciadas. Duraciones - Outer:', this.spinDuration, 'Inner:', validatedInnerDuration);

      // Esperar al tiempo máximo (rueda interna que siempre es >= a la externa)
      setTimeout(() => {
        this.spinning = false;
        this.restingOuterAngle = this.targetOuterAngle;
        this.restingInnerAngle = this.targetInnerAngle;

        // Safari fix: Forzar detención completa de la animación
        this.forceStopAnimation(this.outerWheel.nativeElement, this.targetOuterAngle);
        this.forceStopAnimation(this.innerWheel.nativeElement, this.targetInnerAngle);

        // Verificar si el jugador ganó (si apostó al animal ganador)
        const playerWon = this.selectedAnimals.includes(winningAnimalItem.name);

        console.log('[WheelContainer] Giro completado. Jugador ganó:', playerWon);

        // Solo activar animación de victoria si el jugador ganó
        if (playerWon) {
          this.zone.run(() => {
            this.winningNumberIndex = innerResultIndex;
            this.showConfetti = true;
            this.audioService.playVictory();
            console.log('🎰 ¡VICTORIA! Animación activada - Animal ganador:', winningAnimalItem.name, 'Número:', winningNumber);
            this.cdr.markForCheck();
          });
        } else {
          console.log('❌ El jugador perdió - No se activa animación');
        }

        // Usar delay condicional: 1.5s para victorias, 300ms para derrotas
        const resultDelay = playerWon ? 1500 : 300;

        setTimeout(() => {
          // Mapear a objetos Animal completos
          const winningAnimal: Animal = animalMap[winningAnimalItem.name] || { name: winningAnimalItem.name, emoji: '❓' };
          const innerWheelAnimal: Animal = animalMap[innerWheelAnimalItem.name] || { name: innerWheelAnimalItem.name, emoji: '❓' };

          // Limpiar la animación del número ganador y el confetti
          this.zone.run(() => {
            this.winningNumberIndex = null;
            this.showConfetti = false;
            this.cdr.markForCheck();
          });

          // Resultado completo
          resolve({
            animal: winningAnimal,
            number: winningNumber,
            isPositioningOnly: this.isRandomPositioning,
            outerWheelIndex: outerResultIndex,
            innerWheelIndex: innerResultIndex,
            innerWheelAnimal: innerWheelAnimal
          });
        }, resultDelay);
      }, validatedInnerDuration); // Esperar a que termine la rueda interna
    });
  }

  private prepareDisplayItems(): void {
    this.displayItems = this.fallbackZodiacs.map(name => animalMap[name]);
  }

  public isAnimalSelected(animalName: string): boolean {
    return this.selectedAnimals.includes(animalName);
  }

  public getAnimalImage(animalName: string): string {
    const animal = animalMap[animalName];
    return (animal && animal.image) ? animal.image : '';
  }

  private applySpinAnimation(element: SVGGElement, targetAngle: number, duration?: number): void {
    const animationDuration = duration ?? this.spinDuration;

    // Safari fix: No leer element.style.transform (puede ser inconsistente)
    // En su lugar, usar el ángulo actual que ya conocemos
    const currentAngle = element === this.outerWheel.nativeElement ?
      this.restingOuterAngle : this.restingInnerAngle;

    // Paso 1: Desactivar transición y establecer posición actual
    element.style.transition = 'none';
    element.style.transform = `rotate(${currentAngle}deg)`;
    element.style.willChange = 'transform'; // Activar will-change antes de animar

    // Paso 2: Forzar reflow (Safari necesita esto)
    element.getBoundingClientRect();

    // Paso 3: Activar transición
    element.style.transition = `transform ${animationDuration}ms cubic-bezier(0.23, 1, 0.32, 1)`;

    // Paso 4: Aplicar transform final (usar requestAnimationFrame para Safari)
    requestAnimationFrame(() => {
      element.style.transform = `rotate(${targetAngle}deg)`;
    });
  }

  /**
   * Fuerza la detención completa de la animación en Safari
   * Safari tiene un bug donde la transición CSS puede seguir aplicando micro-movimientos
   * después de completarse. Este método fuerza la posición final.
   */
  private forceStopAnimation(element: SVGGElement, finalAngle: number): void {
    // Paso 1: Cancelar cualquier animación activa
    element.style.transition = 'none';
    element.style.animation = 'none';

    // Paso 2: Forzar reflow
    element.getBoundingClientRect();

    // Paso 3: Usar requestAnimationFrame para que Safari procese el cambio correctamente
    requestAnimationFrame(() => {
      // Aplicar transform final
      element.style.transform = `rotate(${finalAngle}deg)`;

      // Segundo requestAnimationFrame para asegurar aplicación
      requestAnimationFrame(() => {
        // Forzar otro reflow
        element.getBoundingClientRect();

        // Desactivar will-change (liberar GPU layer)
        element.style.willChange = 'auto';
      });
    });
  }

  /**
   * Calcula el ángulo final de rotación para una rueda.
   *
   * @param index - Índice del segmento objetivo (0-11)
   * @param currentAngle - Ángulo actual de la rueda
   * @param isOuter - true para rueda externa, false para rueda interna
   * @returns Ángulo final en grados
   */
  private calculateFinalAngle(index: number, currentAngle: number, isOuter: boolean): number {
    const rotations = 10;
    const segmentCenterAngle = index * this.degreesPerSegment + (this.degreesPerSegment / 2);
    const offsetAngle = -segmentCenterAngle;

    const currentRevolutions = Math.floor(currentAngle / 360);
    const baseRotation = (currentRevolutions + rotations) * 360;

    return isOuter ? (baseRotation + offsetAngle) : -(baseRotation + Math.abs(offsetAngle));
  }

  public getSegmentPath(radius: number, index: number): string {
    const cacheKey = `${radius}-${index}`;
    if (this.segmentPathCache.has(cacheKey)) {
      return this.segmentPathCache.get(cacheKey)!;
    }

    const angleStep = (2 * Math.PI) / this.segmentsCount;
    const startAngle = index * angleStep - Math.PI / 2;
    const endAngle = startAngle + angleStep;
    const x1 = radius * Math.cos(startAngle);
    const y1 = radius * Math.sin(startAngle);
    const x2 = radius * Math.cos(endAngle);
    const y2 = radius * Math.sin(endAngle);
    const path = `M0,0 L${x1},${y1} A${radius},${radius} 0 0,1 ${x2},${y2} Z`;

    this.segmentPathCache.set(cacheKey, path);
    return path;
  }

  /**
   * Genera un arco SVG para el texto curvado del nombre del animal.
   * El arco sigue la curvatura del segmento en la ruleta.
   *
   * @param index - Índice del segmento (0-11)
   * @returns String de path SVG que define el arco para el texto
   */
  public getTextPathArc(index: number): string {
    if (this.textPathCache.has(index)) {
      return this.textPathCache.get(index)!;
    }

    const textRadius = this.outerRingRadius * this.ANIMAL_TEXT_POSITION_RATIO;
    const angleStep = (2 * Math.PI) / this.segmentsCount;
    const startAngle = index * angleStep - Math.PI / 2;
    const endAngle = startAngle + angleStep;

    const x1 = textRadius * Math.cos(startAngle);
    const y1 = textRadius * Math.sin(startAngle);
    const x2 = textRadius * Math.cos(endAngle);
    const y2 = textRadius * Math.sin(endAngle);

    const path = `M ${x1},${y1} A ${textRadius},${textRadius} 0 0,1 ${x2},${y2}`;
    this.textPathCache.set(index, path);
    return path;
  }

  /**
   * Calcula la transformación SVG para posicionar una imagen de animal en la rueda.
   *
   * Utiliza posicionamiento circular con trigonometría:
   * - x = radio × cos(ángulo)
   * - y = radio × sin(ángulo)
   *
   * @param index - Índice de posición (0-11 para 12 animales)
   * @returns String de transformación SVG: "translate(x, y) rotate(ángulo)"
   *
   * Ejemplo: Para index=0 (primera posición arriba):
   * - angleDeg = 0° + 15° (mitad del segmento) = 15°
   * - Posición calculada en círculo a distancia animalRadius del centro
   * - Imagen rotada para mirar hacia afuera
   */
  public getAnimalTransform(index: number): string {
    if (this.animalTransformCache.has(index)) {
      return this.animalTransformCache.get(index)!;
    }

    // Calcula el ángulo para este segmento (en grados)
    // Centro de cada segmento = (índice_segmento × grados_por_segmento) + (mitad_segmento)
    const angleDeg = (index * this.degreesPerSegment) + (this.degreesPerSegment / 2);

    // Convierte a radianes para funciones trigonométricas
    const angleRad = angleDeg * (Math.PI / 180);

    // Calcula coordenadas X,Y en el círculo usando trigonometría
    // ANGLE_OFFSET_FOR_TOP ajusta para que 0° apunte arriba en lugar de derecha
    const x = this.animalRadius * Math.cos(angleRad - this.ANGLE_OFFSET_FOR_TOP);
    const y = this.animalRadius * Math.sin(angleRad - this.ANGLE_OFFSET_FOR_TOP);

    // Rota la imagen para mirar hacia afuera desde el centro de la rueda
    const rotation = angleDeg;

    const transform = `translate(${x}, ${y}) rotate(${rotation})`;
    this.animalTransformCache.set(index, transform);
    return transform;
  }

  /**
   * Calcula la transformación SVG para posicionar una etiqueta numérica en la rueda.
   *
   * Similar a getAnimalTransform, pero posiciona números en el anillo interior
   * usando un radio menor (NUMBER_POSITION_RATIO).
   *
   * @param index - Índice de posición (0-11 para 12 números)
   * @returns String de transformación SVG: "translate(x, y) rotate(ángulo)"
   *
   * Nota: Los números reciben una rotación adicional de +90° para mantener el texto vertical
   * sin importar su posición en la rueda.
   */
  public getNumberTransform(index: number): string {
    if (this.numberTransformCache.has(index)) {
      return this.numberTransformCache.get(index)!;
    }

    // Calcula el ángulo para este segmento (en grados)
    const angleDeg = (index * this.degreesPerSegment) + (this.degreesPerSegment / 2);

    // Convierte a radianes para funciones trigonométricas
    const angleRad = angleDeg * (Math.PI / 180);

    // Calcula coordenadas X,Y en el círculo interior usando radio menor
    const x = this.numberRadius * Math.cos(angleRad - this.ANGLE_OFFSET_FOR_TOP);
    const y = this.numberRadius * Math.sin(angleRad - this.ANGLE_OFFSET_FOR_TOP);

    // Rota el texto +90° para mantener orientación vertical
    const rotation = angleDeg;

    const transform = `translate(${x}, ${y}) rotate(${rotation})`;
    this.numberTransformCache.set(index, transform);
    return transform;
  }

  /**
   * Calcula el índice del segmento actual basado en el ángulo de rotación.
   * El selector/puntero está en la parte superior (0°), por lo que necesitamos
   * determinar qué segmento de la rueda está actualmente alineado con él.
   *
   * @param angle - Ángulo de rotación actual de la rueda en grados
   * @returns Índice del segmento (0-11) que está bajo el selector
   */
  private getCurrentSegmentIndex(angle: number): number {
    // Normalizar el ángulo a rango 0-360
    const normalizedAngle = ((angle % 360) + 360) % 360;

    // El selector está en la parte superior (0°/360°)
    // Necesitamos calcular qué segmento está en esa posición
    // Los segmentos están en el orden: 0, 1, 2, ..., 11
    // Invertir porque la rueda gira en sentido horario
    const segmentIndex = Math.floor((360 - normalizedAngle) / this.degreesPerSegment) % this.segmentsCount;

    return segmentIndex;
  }

  /**
   * Verifica si hubo un cruce de segmento y reproduce el sonido de click.
   * Se llama cada vez que la rueda se mueve (manual o automático).
   *
   * @param currentAngle - Ángulo actual de la rueda
   */
  private checkSegmentCrossing(currentAngle: number): void {
    const currentSegment = this.getCurrentSegmentIndex(currentAngle);

    // Si cambiamos de segmento, reproducir sonido y animar puntero
    if (this.lastSegmentIndex !== -1 && currentSegment !== this.lastSegmentIndex) {
      this.audioService.playClick();

      // Activar animación del puntero
      this.zone.run(() => {
        this.pointerBounce = true;
        this.cdr.markForCheck();
        // Desactivar después de la duración de la animación (150ms)
        setTimeout(() => {
          this.pointerBounce = false;
          this.cdr.markForCheck();
        }, 150);
      });
    }

    this.lastSegmentIndex = currentSegment;
  }

  /**
   * Función de easing cubic-bezier(0.23, 1, 0.32, 1)
   * Implementación precisa usando método de Newton-Raphson
   * Replica exactamente la misma curva usada en la animación CSS
   */
  private cubicBezierEasing(t: number): number {
    // Puntos de control para cubic-bezier(0.23, 1, 0.32, 1)
    const x1 = 0.23, y1 = 1.0;
    const x2 = 0.32, y2 = 1.0;

    // Tolerancia para la búsqueda
    const epsilon = 0.001;
    const maxIterations = 10;

    // Función de la curva de Bézier para x
    const bezierX = (t: number) => {
      return 3 * (1 - t) * (1 - t) * t * x1 +
             3 * (1 - t) * t * t * x2 +
             t * t * t;
    };

    // Derivada de la curva para x (para Newton-Raphson)
    const bezierXDerivative = (t: number) => {
      return 3 * (1 - t) * (1 - t) * x1 +
             6 * (1 - t) * t * (x2 - x1) +
             3 * t * t * (1 - x2);
    };

    // Buscar t que corresponde al progreso lineal usando Newton-Raphson
    let currentT = t; // Empezar con una estimación inicial
    for (let i = 0; i < maxIterations; i++) {
      const currentX = bezierX(currentT);
      const difference = currentX - t;

      if (Math.abs(difference) < epsilon) {
        break; // Convergió
      }

      const derivative = bezierXDerivative(currentT);
      if (Math.abs(derivative) < epsilon) {
        break; // Evitar división por cero
      }

      currentT = currentT - difference / derivative;
    }

    // Calcular y usando el t encontrado
    const y = 3 * (1 - currentT) * (1 - currentT) * currentT * y1 +
              3 * (1 - currentT) * currentT * currentT * y2 +
              currentT * currentT * currentT;

    return y;
  }

  /**
   * Monitorea continuamente la rotación de la rueda durante la animación
   * y reproduce sonidos cuando cruza segmentos.
   *
   * OPTIMIZADO: Usa interpolación matemática en lugar de getComputedStyle()
   * para evitar layout thrashing y mejorar rendimiento en 15-25%
   */
  private monitorWheelRotation(): void {
    if (!this.spinning && !this.isDragging) {
      // Detener monitoreo si no hay movimiento
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      return;
    }

    // Calcular progreso del tiempo (0 a 1)
    const currentTime = performance.now();
    const elapsed = currentTime - this.spinStartTime;
    const progress = Math.min(elapsed / this.spinDurationMs, 1);

    // Aplicar función de easing
    const easedProgress = this.cubicBezierEasing(progress);

    // Calcular ángulo actual mediante interpolación
    const angleDifference = this.spinTargetAngle - this.spinStartAngle;
    const currentAngle = this.spinStartAngle + (angleDifference * easedProgress);

    // Verificar cruce de segmentos
    this.checkSegmentCrossing(currentAngle);

    // Continuar monitoreando si aún está girando
    if (progress < 1) {
      this.animationFrameId = requestAnimationFrame(() => this.monitorWheelRotation());
    }
  }
}