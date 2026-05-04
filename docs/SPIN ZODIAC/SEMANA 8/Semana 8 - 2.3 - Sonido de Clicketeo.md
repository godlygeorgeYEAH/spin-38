# Mejora 2.3 - Sonido de Clicketeo

**Fecha:** 11 de Diciembre, 2025
**Prioridad:** Media
**Estado:** ✅ Completado
**Categoría:** Audio / UX

---

## Descripción

Se implementó un sistema de sonido de clicketeo que reproduce un "click" cada vez que el selector pasa por un segmento animal durante:
1. Giro automático
2. Ajuste manual (arrastre)

El sonido incluye throttling para evitar reproducción excesiva en giros muy rápidos.

---

## Arquitectura

### 1. Servicio de Audio

**Archivo:** `src/app/services/audio.service.ts` (Nuevo)

**Características:**
- Pre-carga del archivo MP3
- Control de volumen (30% por defecto)
- Habilitar/Deshabilitar globalmente
- **Throttling configurable** (50ms por defecto)

**Métodos:**
```typescript
playClick()                    // Reproduce con throttling
setEnabled(enabled)            // Habilita/deshabilita
toggleEnabled()                // Alterna on/off
setVolumen(volume)             // 0.0 - 1.0
setMinTimeBetweenClicks(ms)    // Configura throttling
```

---

### 2. Detección de Segmentos

**Archivo:** `wheel-container.component.ts`

#### A. `getCurrentSegmentIndex(angle: number): number`

Calcula el índice del segmento (0-11) bajo el selector.

```typescript
private getCurrentSegmentIndex(angle: number): number {
  const normalizedAngle = ((angle % 360) + 360) % 360;
  const segmentIndex = Math.floor((360 - normalizedAngle) / this.degreesPerSegment) % this.segmentsCount;
  return segmentIndex;
}
```

**Líneas:** 699-710

---

#### B. `checkSegmentCrossing(currentAngle: number): void`

Verifica cruce de segmento y reproduce sonido.

```typescript
private checkSegmentCrossing(currentAngle: number): void {
  const currentSegment = this.getCurrentSegmentIndex(currentAngle);

  if (this.lastSegmentIndex !== -1 && currentSegment !== this.lastSegmentIndex) {
    this.audioService.playClick();
  }

  this.lastSegmentIndex = currentSegment;
}
```

**Líneas:** 718-727

---

#### C. `monitorWheelRotation(): void`

Monitorea rotación usando `requestAnimationFrame` y `getComputedStyle`.

**IMPORTANTE:** Se usa `window.getComputedStyle()` porque `style.transform` no refleja valores animados durante transiciones CSS.

```typescript
private monitorWheelRotation(): void {
  if (!this.spinning && !this.isDragging) {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    return;
  }

  const computedStyle = window.getComputedStyle(this.outerWheel.nativeElement);
  const transform = computedStyle.transform;

  if (transform && transform !== 'none') {
    const rawAngle = this.getRotationAngleFromMatrix(transform);
    const angleDiff = rawAngle - this.lastRawAngle;

    // Manejar cruce de -180/180
    if (angleDiff > 180) {
      this.accumulatedRotation -= 360;
    } else if (angleDiff < -180) {
      this.accumulatedRotation += 360;
    }

    this.lastRawAngle = rawAngle;
    const totalAngle = this.accumulatedRotation + rawAngle;
    this.checkSegmentCrossing(totalAngle);
  }

  this.animationFrameId = requestAnimationFrame(() => this.monitorWheelRotation());
}
```

**Líneas:** 746-787

---

#### D. `getRotationAngleFromMatrix(matrixString: string): number`

Extrae ángulo de transformación CSS en formato matriz.

CSS devuelve `matrix(a, b, c, d, tx, ty)` donde:
- `a = cos(θ)`
- `b = sin(θ)`
- Ángulo = `Math.atan2(b, a)`

```typescript
private getRotationAngleFromMatrix(matrixString: string): number {
  const values = matrixString.match(/matrix\(([^)]+)\)/);
  if (!values) return 0;

  const matrixValues = values[1].split(',').map(v => parseFloat(v.trim()));
  if (matrixValues.length < 2) return 0;

  const a = matrixValues[0]; // cos(θ)
  const b = matrixValues[1]; // sin(θ)
  let angle = Math.atan2(b, a) * (180 / Math.PI);

  return angle;
}
```

**Líneas:** 789-802

---

### 3. Integración en Giro Automático

```typescript
public spinAndGetResult(): Promise<WheelSpinResult> {
  this.spinning = true;

  // Iniciar monitoreo
  this.lastSegmentIndex = this.getCurrentSegmentIndex(this.restingOuterAngle);
  this.accumulatedRotation = 0;
  this.lastRawAngle = 0;
  this.monitorWheelRotation();

  // ... resto del código
}
```

**Líneas:** 524-528

---

### 4. Integración en Ajuste Manual

**startDrag():**
```typescript
private startDrag(clientX: number, clientY: number): void {
  this.isDragging = true;

  // Inicializar segmento para sonido
  this.lastSegmentIndex = this.getCurrentSegmentIndex(this.restingOuterAngle);

  // ... resto del código
}
```

**Líneas:** 358-359

**updateDrag():**
```typescript
private updateDrag(clientX: number, clientY: number): void {
  // ... actualizar rotación ...

  // Verificar cruce y reproducir sonido
  const currentWheelAngle = this.restingOuterAngle + this.manualRotation;
  this.checkSegmentCrossing(currentWheelAngle);
}
```

**Líneas:** 444-446

---

### 5. Control UI

**Archivo:** `src/app/home/home.page.html`

```html
<button (click)="toggleSound()" class="help-button sound-btn"
        [title]="isSoundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'">
  <ion-icon [name]="isSoundEnabled ? 'volume-high-outline' : 'volume-mute-outline'"
            style="font-size: 24px; color: var(--gold-primary);"></ion-icon>
</button>
```

**Líneas:** 16-18

**Archivo:** `src/app/home/home.page.ts`

```typescript
public isSoundEnabled: boolean = true;

constructor(..., private audioService: AudioService) {
  addIcons({ volumeHighOutline, volumeMuteOutline });
  this.isSoundEnabled = this.audioService.getEnabled();
}

public toggleSound(): void {
  this.isSoundEnabled = this.audioService.toggleEnabled();
  this.cdr.detectChanges();
}
```

**Líneas:** 90, 96-99, 672-675

---

### 6. Sistema de Throttling

**Problema:** En giros muy rápidos, el sonido se reproducía excesivamente creando un "bug auditivo".

**Solución:** Throttling basado en timestamps.

**Variables:**
```typescript
private minTimeBetweenClicks: number = 50; // 50ms mínimo
private lastClickTime: number = 0;
```

**Lógica en `playClick()`:**
```typescript
const currentTime = Date.now();
const timeSinceLastClick = currentTime - this.lastClickTime;

if (timeSinceLastClick < this.minTimeBetweenClicks) {
  return; // Ignorar click
}

this.lastClickTime = currentTime;
// ... reproducir sonido
```

**Configuración:**

| Valor | Clicks/seg | Uso |
|-------|------------|-----|
| 30ms  | 33/seg     | Muy rápido |
| **50ms** | **20/seg** | **DEFAULT - Rápido** |
| 75ms  | 13/seg     | Moderado |
| 100ms | 10/seg     | Espaciado |

**Líneas:** 17-18, 60-69 en `audio.service.ts`

---

## Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `src/app/services/audio.service.ts` | Servicio de audio con throttling |
| `src/assets/audio/click.mp3` | Archivo de sonido |

---

## Archivos Modificados

| Archivo | Líneas | Cambios |
|---------|--------|---------|
| `audio.service.ts` | 17-18, 55-89, 137-159 | Variables throttling, playClick(), métodos config |
| `wheel-container.component.ts` | 5, 270-274, 276, 358-359, 444-446, 524-528, 699-710, 718-727, 746-802 | AudioService, variables, detección segmentos, matriz CSS |
| `home.page.ts` | 17, 20, 90, 96-99, 672-675 | AudioService, control de sonido |
| `home.page.html` | 16-18 | Botón de control |

**Total líneas:** ~170

---

## Criterios de Aceptación

- [x] Sonido en giro automático
- [x] Sonido en ajuste manual
- [x] Sincronización con velocidad
- [x] Botón UI para silenciar/activar
- [x] Formato MP3 optimizado
- [x] Volumen 30%
- [x] **Throttling para evitar reproducción excesiva**
- [x] **Frecuencia configurable (50ms default)**
- [x] **Sin "bug auditivo" en velocidades altas**
- [x] Sin impacto en rendimiento
- [x] Sin errores de compilación
