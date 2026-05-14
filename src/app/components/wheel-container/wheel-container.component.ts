import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnChanges, SimpleChanges, OnInit, AfterViewInit, OnDestroy, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WheelSpinResult, WheelItem } from '../../interfaces/wheel-general.interface';
import { GameState } from '../../interfaces/game.enums';
import { AudioService } from '../../services/audio.service';
import { PerformanceDetectorService, PerformanceProfile } from '../../services/performance-detector.service';
import { WHEEL_SVG, getWheelDiameter, getWheelBorderSize } from './wheel.config';


@Component({
  selector: 'app-wheel-container',
  templateUrl: './wheel-container.component.html',
  styleUrls: ['./wheel-container.component.css'],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WheelContainerComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  private static nextId = 0;
  public readonly componentId: number;

  @Input() animals: WheelItem[] = [];
  @Input() gameState: GameState = GameState.IDLE;
  @Input() isRandomPositioning: boolean = false;
  @Input() spinDuration: number = 8000; // Duración giro rueda externa
  @Input() innerWheelSpinDuration: number = 10000; // Duración giro rueda interna (debe ser >= spinDuration)
  @Input() innerAnimals: WheelItem[] = [];

  @ViewChild('outerWheel', { static: true }) outerWheel!: ElementRef<SVGGElement>;
  @ViewChild('innerWheel', { static: true }) innerWheel!: ElementRef<SVGGElement>;

  public spinning = false;
  public displayItems: number[] = [];
  public innerDisplayItems: number[] = [];
  public errorMessage: string = '';
  public winningInnerAnimalIndex: number | null = null;
  public showConfetti = false;
  public pointerBounce = false;

  private restingOuterAngle = 0;
  private restingInnerAngle = 0;

  private targetOuterAngle = 0;
  private targetInnerAngle = 0;

  private readonly ROULETTE_NUMBERS: (number | string)[] = [
    0, '00', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
    26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36
  ];
  @Input() segmentsCount: number = 38;
  get degreesPerSegment(): number { return 360 / this.segmentsCount; }

  // Cache para cálculos trigonométricos
  private segmentPathCache = new Map<string, string>();
  private textPathCache = new Map<number, string>();
  private animalTransformCache = new Map<number, string>();
  private numberTransformCache = new Map<number, string>();

  // ── Posición de reset ──────────────────────────────────────────────────────
  // Cambia estos valores para ajustar a dónde vuelve la rueda después de cada giro
  private readonly RESET_OUTER_POSITION: number | string = '00';
  private readonly RESET_INNER_POSITION: number | string = '00';
  private readonly RESET_DURATION_MS = 1200;
  private readonly RESET_ROTATIONS = 1;

  // ==========================================
  // CONFIGURACIÓN DE POSICIONAMIENTO SVG
  // ==========================================
  // Todos los valores se leen desde wheel.config.ts.
  // Para modificar radios y proporciones, editar WHEEL_SVG en ese archivo.

  private readonly SVG_VIEWBOX_RADIUS        = WHEEL_SVG.viewboxRadius;
  private readonly OUTER_RING_RATIO          = WHEEL_SVG.outerRingRatio;
  private readonly INNER_RING_RATIO          = WHEEL_SVG.innerRingRatio;
  private readonly ANIMAL_POSITION_RATIO     = WHEEL_SVG.animalPositionRatio;
  private readonly NUMBER_POSITION_RATIO     = WHEEL_SVG.numberPositionRatio;
  private readonly ANIMAL_IMAGE_SIZE_RATIO   = WHEEL_SVG.animalImageSizeRatio;
  private readonly ANIMAL_TEXT_POSITION_RATIO = WHEEL_SVG.animalTextPositionRatio;
  public readonly outerNumberFontSize        = WHEEL_SVG.outerNumberFontSize;
  public readonly innerNumberFontSize        = WHEEL_SVG.innerNumberFontSize;

  private get animalRadius(): number {
    return this.SVG_VIEWBOX_RADIUS * this.ANIMAL_POSITION_RATIO;
  }

  private get numberRadius(): number {
    return this.SVG_VIEWBOX_RADIUS * this.NUMBER_POSITION_RATIO;
  }

  private readonly ANGLE_OFFSET_FOR_TOP = Math.PI / 2;

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

  private readonly resizeListener = () => {
    this.applyWheelDiameter();
    this.applyWheelBorderSize();
  };

  private applyWheelDiameter(): void {
    document.documentElement.style.setProperty('--wheel-diameter', getWheelDiameter());
  }

  private applyWheelBorderSize(): void {
    document.documentElement.style.setProperty('--wheel-border-size', getWheelBorderSize());
  }

  ngOnInit(): void {
    this.applyWheelDiameter();
    this.applyWheelBorderSize();
    this.spinning = false;
    this.displayItems = [];
    this.errorMessage = '';
    this.restingOuterAngle = 0;
    this.restingInnerAngle = 0;
    this.targetOuterAngle = 0;
    this.targetInnerAngle = 0;

    this.prepareDisplayItems();
  }

  ngAfterViewInit(): void {
    window.addEventListener('resize', this.resizeListener);

    // Safari fix: Inicializar transform explícitamente en las ruedas
    if (this.outerWheel && this.innerWheel) {
      this.initializeWheelTransforms();
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeListener);
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
    if (changes['animals'] || changes['innerAnimals']) {
      this.prepareDisplayItems();
    }

    if (changes['segmentsCount']) {
      this.segmentPathCache.clear();
      this.textPathCache.clear();
      this.animalTransformCache.clear();
      this.numberTransformCache.clear();
    }
  }

  /**
   * Gira la ruleta hacia un resultado específico proporcionado por el backend
   * @param result - Resultado del backend (animal ganador y multiplicador)
   * @returns Promise que se resuelve cuando la animación termina
   */
  public spinToResult(result: { outerPosition: number | string; innerPosition: number | string }): Promise<WheelSpinResult> {
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
      const outerResultIndex = this.ROULETTE_NUMBERS.indexOf(result.outerPosition);
      if (outerResultIndex === -1) {
        this.spinning = false;
        reject(new Error(`Posición exterior ${result.outerPosition} no encontrada en el pool de ruleta`));
        return;
      }

      const innerResultIndex = this.ROULETTE_NUMBERS.indexOf(result.innerPosition);
      if (innerResultIndex === -1) {
        this.spinning = false;
        reject(new Error(`Posición interior ${result.innerPosition} no encontrada en el pool de ruleta`));
        return;
      }

      this.targetOuterAngle = this.calculateFinalAngle(outerResultIndex, this.restingOuterAngle, true);
      this.targetInnerAngle = this.calculateFinalAngle(innerResultIndex, this.restingInnerAngle, false);

      this.lastSegmentIndex = this.getCurrentSegmentIndex(this.restingOuterAngle);
      this.spinStartTime = performance.now();
      this.spinStartAngle = this.restingOuterAngle;
      this.spinTargetAngle = this.targetOuterAngle;
      this.spinDurationMs = this.spinDuration;
      this.monitorWheelRotation();

      this.applySpinAnimation(this.outerWheel.nativeElement, this.targetOuterAngle, this.spinDuration);
      this.applySpinAnimation(this.innerWheel.nativeElement, this.targetInnerAngle, validatedInnerDuration);

      setTimeout(() => {
        this.spinning = false;
        this.restingOuterAngle = this.targetOuterAngle;
        this.restingInnerAngle = this.targetInnerAngle;

        this.forceStopAnimation(this.outerWheel.nativeElement, this.targetOuterAngle);
        this.forceStopAnimation(this.innerWheel.nativeElement, this.targetInnerAngle);

        // Detección de victoria desactivada: la responsabilidad pasa al servidor (f1-elim-click-segmentos).
        // La animación de confetti y sonido de victoria nunca se activan desde este componente.
        const playerWon = false;

        if (playerWon) {
          this.zone.run(() => {
            this.winningInnerAnimalIndex = innerResultIndex;
            this.showConfetti = true;
            this.audioService.playVictory();
            this.cdr.markForCheck();
          });
        }

        const resultDelay = playerWon ? 1500 : 300;

        setTimeout(() => {
          this.zone.run(() => {
            this.winningInnerAnimalIndex = null;
            this.showConfetti = false;
            this.cdr.markForCheck();
          });

          resolve({
            outerPosition: result.outerPosition,
            innerPosition: result.innerPosition,
            isPositioningOnly: this.isRandomPositioning,
            outerWheelIndex: outerResultIndex,
            innerWheelIndex: innerResultIndex,
          });
        }, resultDelay);
      }, validatedInnerDuration);
    });
  }

  private prepareDisplayItems(): void {
    this.displayItems = Array.from({ length: this.segmentsCount }, (_, i) => i);
    this.innerDisplayItems = [...this.displayItems];
  }

  public resetToPosition(): Promise<void> {
    const outerIndex = this.ROULETTE_NUMBERS.indexOf(this.RESET_OUTER_POSITION);
    const innerIndex = this.ROULETTE_NUMBERS.indexOf(this.RESET_INNER_POSITION);
    if (outerIndex === -1 || innerIndex === -1) return Promise.resolve();

    const targetOuter = this.calculateFinalAngle(outerIndex, this.restingOuterAngle, true, this.RESET_ROTATIONS);
    const targetInner = this.calculateFinalAngle(innerIndex, this.restingInnerAngle, false, this.RESET_ROTATIONS);

    this.applySpinAnimation(this.outerWheel.nativeElement, targetOuter, this.RESET_DURATION_MS, 'ease-out');
    this.applySpinAnimation(this.innerWheel.nativeElement, targetInner, this.RESET_DURATION_MS, 'ease-out');

    return new Promise(resolve => {
      setTimeout(() => {
        this.restingOuterAngle = targetOuter;
        this.restingInnerAngle = targetInner;
        this.forceStopAnimation(this.outerWheel.nativeElement, targetOuter);
        this.forceStopAnimation(this.innerWheel.nativeElement, targetInner);
        resolve();
      }, this.RESET_DURATION_MS);
    });
  }

  public getRouletteNumber(index: number): number | string {
    return this.ROULETTE_NUMBERS[index] ?? index;
  }

  private applySpinAnimation(element: SVGGElement, targetAngle: number, duration?: number, easing = 'cubic-bezier(0.23, 1, 0.32, 1)'): void {
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
    element.style.transition = `transform ${animationDuration}ms ${easing}`;

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
  private calculateFinalAngle(index: number, currentAngle: number, isOuter: boolean, rotations = 10): number {
    const segmentCenterAngle = index * this.degreesPerSegment + (this.degreesPerSegment / 2);
    // En cualquier rueda con CSS rotate(φ), el segmento en la parte superior es el que
    // estaba en -φ (mod 360). Para mostrar segmentCenterAngle arriba: φ ≡ -segmentCenterAngle (mod 360)
    const remainder = ((-segmentCenterAngle % 360) + 360) % 360;
    const currentNorm = ((currentAngle % 360) + 360) % 360;

    if (isOuter) {
      // Siempre horario: target > currentAngle + rotations*360
      const extra = (remainder - currentNorm + 360) % 360 || 360;
      return currentAngle + rotations * 360 + extra;
    } else {
      // Siempre antihorario: target < currentAngle - rotations*360
      const extra = (currentNorm - remainder + 360) % 360 || 360;
      return currentAngle - rotations * 360 - extra;
    }
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
  public getInnerAnimalTransform(index: number): string {
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
    if (!this.spinning) {
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