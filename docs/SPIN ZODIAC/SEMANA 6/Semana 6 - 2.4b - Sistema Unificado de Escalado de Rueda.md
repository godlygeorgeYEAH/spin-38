# Semana 6 - 2.4b - Sistema Unificado de Escalado de Rueda

**Fecha:** 3 de Diciembre de 2025
**Tipo:** Refactorización Mayor (Arquitectura de Escalado Completa)
**Referencia:** REQUERIMIENTOS.md - Hallazgo 2.4 (Completado al 100%)

---

## 📋 Índice

1. [Conceptos Fundamentales](#conceptos-fundamentales)
2. [Arquitectura de la Solución](#arquitectura-de-la-solución)
3. [Ejemplos de Configuraciones](#ejemplos-de-configuraciones)
4. [Guía de Uso](#guía-de-uso)
5. [Troubleshooting](#troubleshooting)
6. [Fórmulas de Referencia Rápida](#fórmulas-de-referencia-rápida)

---

## 1. Conceptos Fundamentales

### 1.1 Tamaño Externo vs Interno

La rueda tiene **dos sistemas de tamaño independientes** que trabajan juntos:

#### 🖼️ Tamaño Externo (CSS)
**¿Qué controla?** Cuán grande se ve la rueda en la pantalla del navegador.

**Definido en:** `src/theme/variables.scss`

```scss
--wheel-diameter: clamp(400px, 90vw, 1000px);
                      ↑           ↑
                   mínimo      máximo
```

**Visualización:**
```
┌─────────────────────────────────┐
│    Ventana del Navegador        │
│                                 │
│      ┌───────────────┐          │
│      │               │          │
│      │    Rueda      │  ← 1000px máximo
│      │   Visible     │     (CSS)
│      │               │          │
│      └───────────────┘          │
│                                 │
└─────────────────────────────────┘
```

**Características:**
- ✅ Afecta el tamaño visual en pantalla
- ✅ Responsivo con `clamp(min, ideal, max)`
- ✅ NO afecta las proporciones internas
- ✅ Controlado por CSS

---

#### ⚙️ Tamaño Interno (SVG ViewBox)
**¿Qué controla?** El sistema de coordenadas donde se dibujan los elementos.

**Definido en:** `wheel-container.component.ts`

```typescript
private readonly SVG_VIEWBOX_RADIUS = 210;
```

**Visualización:**
```
ViewBox = Sistema de Coordenadas SVG
┌─────────────────────────┐
│  (-210, -210)           │  ← Esquina superior izquierda
│                         │
│         (0, 0)          │  ← Centro
│           ●             │
│                         │
│           (210, 210)    │  ← Esquina inferior derecha
└─────────────────────────┘
Espacio total: 420×420 unidades
```

**Características:**
- ✅ Define el "canvas" interno del SVG
- ✅ Controla las proporciones entre elementos
- ✅ NO afecta el tamaño visual directo
- ✅ Controlado por TypeScript

---

### 1.2 Relación entre Tamaño Externo e Interno

```
┌──────────────────────────────────────────────┐
│  Tamaño Externo (CSS)                        │
│  --wheel-diameter: 1000px                    │
│  ┌────────────────────────────────────────┐  │
│  │  Tamaño Interno (SVG ViewBox)          │  │
│  │  SVG_VIEWBOX_RADIUS = 210              │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │  Outer Ring (95.2% del viewBox)  │  │  │
│  │  │  ┌────────────────────────────┐  │  │  │
│  │  │  │ Inner Ring (57.1%)         │  │  │  │
│  │  │  │  ┌──────────────────────┐  │  │  │  │
│  │  │  │  │  Yin-Yang (40%)      │  │  │  │  │
│  │  │  │  └──────────────────────┘  │  │  │  │
│  │  │  └────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────┘  │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘

Externo: Tamaño visual en pantalla
Interno: Proporciones y posicionamiento
```

---

## 2. Arquitectura de la Solución

### 2.1 Sistema en Capas

```
═══════════════════════════════════════════════════════════
CAPA 1: CONFIGURACIÓN BASE (2 valores principales)
═══════════════════════════════════════════════════════════

📁 src/theme/variables.scss:7
--wheel-diameter: clamp(400px, 90vw, 1000px)
└─> Controla: Tamaño visual en pantalla

📁 wheel-container.component.ts:97
SVG_VIEWBOX_RADIUS = 210
└─> Controla: Sistema de coordenadas interno

═══════════════════════════════════════════════════════════
CAPA 2: RATIOS CONFIGURABLES (6 ratios)
═══════════════════════════════════════════════════════════

OUTER_RING_RATIO = 0.952        (95.2% del viewBox)
INNER_RING_RATIO = 0.571        (57.1% del viewBox)
ANIMAL_POSITION_RATIO = 0.762   (76.2% del viewBox)
NUMBER_POSITION_RATIO = 0.476   (47.6% del viewBox)
ANIMAL_IMAGE_SIZE_RATIO = 0.238 (23.8% del viewBox)
CENTER_SIZE_RATIO = 0.40        (40% del diámetro)

═══════════════════════════════════════════════════════════
CAPA 3: VALORES CALCULADOS (7 getters)
═══════════════════════════════════════════════════════════

viewBoxSize → string        "-210 -210 420 420"
outerRingRadius → number    200
innerRingRadius → number    120
animalRadius → number       160
numberRadius → number       100
animalImageSize → number    50
animalImageOffset → number  -25

═══════════════════════════════════════════════════════════
CAPA 4: TEMPLATE HTML (Bindings dinámicos)
═══════════════════════════════════════════════════════════

<svg [attr.viewBox]="viewBoxSize">
  <path [attr.d]="getSegmentPath(outerRingRadius, i)" />
  <path [attr.d]="getSegmentPath(innerRingRadius, i)" />
  <image [attr.width]="animalImageSize" ... />
</svg>
```

### 2.2 Flujo de Cálculo

```
1. Usuario define tamaños base:
   ├─> CSS: --wheel-diameter = 1000px (externo)
   └─> TS:  SVG_VIEWBOX_RADIUS = 210 (interno)

2. Sistema calcula valores derivados:
   ├─> outerRingRadius = 210 × 0.952 = 200
   ├─> innerRingRadius = 210 × 0.571 = 120
   ├─> animalRadius = 210 × 0.762 = 160
   ├─> numberRadius = 210 × 0.476 = 100
   ├─> animalImageSize = 210 × 0.238 = 50
   └─> viewBoxSize = "-210 -210 420 420"

3. HTML renderiza con valores calculados:
   └─> Todo escala automáticamente ✅
```

---

## 3. Ejemplos de Configuraciones

### 3.1 Rueda Pequeña (Móvil)

**Objetivo:** Rueda compacta para dispositivos móviles

```scss
/* CSS - Tamaño visual pequeño */
--wheel-diameter: clamp(250px, 90vw, 400px);
```

```typescript
/* TypeScript - Proporciones estándar */
SVG_VIEWBOX_RADIUS = 210;
OUTER_RING_RATIO = 0.952;
INNER_RING_RATIO = 0.571;
```

**Resultado:**
- 📱 Tamaño visual: 250px - 400px
- 📐 ViewBox: 420×420
- 🔴 Outer ring: 200 unidades SVG
- 🌈 Inner ring: 120 unidades SVG
- ✅ **Uso:** Dispositivos móviles pequeños

---

### 3.2 Rueda Mediana (Tablet)

**Objetivo:** Rueda versátil para tablets y pantallas medianas

```scss
/* CSS - Tamaño visual medio */
--wheel-diameter: clamp(350px, 90vw, 700px);
```

```typescript
/* TypeScript - ViewBox más grande */
SVG_VIEWBOX_RADIUS = 300;
OUTER_RING_RATIO = 0.95;
INNER_RING_RATIO = 0.57;
```

**Resultado:**
- 📱 Tamaño visual: 350px - 700px
- 📐 ViewBox: 600×600
- 🔴 Outer ring: 285 unidades SVG
- 🌈 Inner ring: 171 unidades SVG
- ✅ **Uso:** Tablets, laptops pequeñas

---

### 3.3 Rueda Grande (Desktop) ⭐ **CONFIGURACIÓN ACTUAL**

**Objetivo:** Rueda grande para monitores de escritorio

```scss
/* CSS - Tamaño visual grande */
--wheel-diameter: clamp(400px, 90vw, 1000px);
```

```typescript
/* TypeScript - Proporciones balanceadas */
SVG_VIEWBOX_RADIUS = 210;
OUTER_RING_RATIO = 0.952;
INNER_RING_RATIO = 0.571;
```

**Resultado:**
- 🖥️ Tamaño visual: 400px - 1000px
- 📐 ViewBox: 420×420
- 🔴 Outer ring: 200 unidades SVG
- 🌈 Inner ring: 120 unidades SVG
- ✅ **Uso:** Monitores 1080p, 1440p

---

### 3.4 Rueda Extra Grande (Pantallas 4K)

**Objetivo:** Rueda gigante para monitores 4K y ultra wide

```scss
/* CSS - Tamaño visual máximo */
--wheel-diameter: clamp(600px, 90vw, 1400px);
```

```typescript
/* TypeScript - ViewBox expandido */
SVG_VIEWBOX_RADIUS = 400;
OUTER_RING_RATIO = 0.95;
INNER_RING_RATIO = 0.57;
```

**Resultado:**
- 🖥️ Tamaño visual: 600px - 1400px
- 📐 ViewBox: 800×800
- 🔴 Outer ring: 380 unidades SVG
- 🌈 Inner ring: 228 unidades SVG
- ✅ **Uso:** Monitores 4K, presentaciones

---

### 3.5 Rueda con Anillo Exterior Dominante

**Objetivo:** Énfasis en el anillo exterior (animales)

```scss
/* CSS - Tamaño visual estándar */
--wheel-diameter: clamp(400px, 90vw, 800px);
```

```typescript
/* TypeScript - Outer ring prominente */
SVG_VIEWBOX_RADIUS = 250;
OUTER_RING_RATIO = 0.98;   // ⬆️ Muy cerca del borde
INNER_RING_RATIO = 0.45;   // ⬇️ Más pequeño
ANIMAL_IMAGE_SIZE_RATIO = 0.30; // ⬆️ Imágenes grandes
```

**Resultado:**
- 🖥️ Tamaño visual: 400px - 800px
- 📐 ViewBox: 500×500
- 🔴 Outer ring: 245 unidades (98% del viewBox)
- 🌈 Inner ring: 112 unidades (45% del viewBox)
- 🐉 Imágenes: 75 unidades (30% del radio)
- ✅ **Uso:** Cuando los animales son el foco principal

---

### 3.6 Rueda Compacta con Centro Grande

**Objetivo:** Yin-yang prominente, anillos más delgados

```scss
/* CSS - Tamaño visual compacto */
--wheel-diameter: clamp(300px, 90vw, 600px);
```

```typescript
/* TypeScript - Centro dominante */
SVG_VIEWBOX_RADIUS = 180;
OUTER_RING_RATIO = 0.90;   // ⬇️ Más hacia adentro
INNER_RING_RATIO = 0.60;   // ⬆️ Más grande
CENTER_SIZE_RATIO = 0.50;  // ⬆️ Centro grande
```

**Resultado:**
- 🖥️ Tamaño visual: 300px - 600px
- 📐 ViewBox: 360×360
- 🔴 Outer ring: 162 unidades (90%)
- 🌈 Inner ring: 108 unidades (60%)
- ☯️ Yin-yang: 50% del diámetro
- ✅ **Uso:** Diseño minimalista, enfoque en centro

---

## 4. Guía de Uso

### 4.1 Cambiar Solo el Tamaño Visual

**Cuándo:** Quieres que la rueda se vea más grande/pequeña en pantalla, pero manteniendo las mismas proporciones internas.

**Paso 1:** Edita solo el CSS

```scss
📁 src/theme/variables.scss:7

/* De pequeña a grande */
--wheel-diameter: clamp(280px, 90vw, 480px);  /* Antes */
--wheel-diameter: clamp(400px, 90vw, 1000px); /* Después */
```

**Resultado:**
- ✅ Rueda se ve más grande en pantalla
- ✅ Proporciones se mantienen idénticas
- ✅ Animales, números, todo igual de proporcionado

---

### 4.2 Cambiar Proporciones Internas

**Cuándo:** Quieres modificar el tamaño relativo de elementos (animales más grandes, números más pequeños, etc.)

**Paso 1:** Edita los ratios en TypeScript

```typescript
📁 wheel-container.component.ts

/* Animales más grandes */
ANIMAL_IMAGE_SIZE_RATIO = 0.30;  // Era 0.238

/* Números más cercanos al centro */
NUMBER_POSITION_RATIO = 0.40;    // Era 0.476

/* Anillo exterior más ancho */
OUTER_RING_RATIO = 0.98;         // Era 0.952
```

**Resultado:**
- ✅ Animales visualmente más grandes
- ✅ Números más agrupados al centro
- ✅ Anillo rojo más ancho
- ✅ Tamaño visual de rueda se mantiene

---

### 4.3 Escalar Todo Proporcionalmente

**Cuándo:** Quieres una rueda más grande manteniendo EXACTAMENTE las mismas proporciones.

**Paso 1:** Aumenta AMBOS valores proporcionalmente

```scss
📁 src/theme/variables.scss:7
--wheel-diameter: clamp(600px, 90vw, 1400px); /* 2x más grande */
```

```typescript
📁 wheel-container.component.ts:97
SVG_VIEWBOX_RADIUS = 420; /* 2x más grande (era 210) */
```

**Resultado:**
- ✅ Rueda 2x más grande visualmente
- ✅ ViewBox 2x más grande
- ✅ Proporciones IDÉNTICAS
- ✅ Todo escala uniformemente

---

### 4.4 Configuración Personalizada Paso a Paso

**Ejemplo:** Quiero una rueda de 800px con animales grandes

```typescript
// PASO 1: Define el tamaño visual objetivo
--wheel-diameter: clamp(400px, 90vw, 800px);

// PASO 2: Calcula el viewBox necesario
// Regla: viewBoxRadius debe ser > outerRingRadius
// Si quieres outer ring de 300, necesitas viewBox de ~320

SVG_VIEWBOX_RADIUS = 320;

// PASO 3: Define el outer ring
// 300 / 320 = 0.9375
OUTER_RING_RATIO = 0.9375;

// PASO 4: Ajusta imágenes de animales
// Quieres que sean grandes: 30% del radio
ANIMAL_IMAGE_SIZE_RATIO = 0.30;

// PASO 5: Verifica que no haya clipping
// outerRingRadius = 320 × 0.9375 = 300 ✅
// animalImageSize = 320 × 0.30 = 96 ✅
// Total usado: 300 + 96/2 = 348 ⚠️ Puede exceder

// PASO 6: Ajusta si es necesario
SVG_VIEWBOX_RADIUS = 400; // Más espacio
```

---

## 5. Troubleshooting

### 5.1 La rueda se ve cuadrada / cortada

**Problema:** `OUTER_RING_RATIO` excede los límites del viewBox

**Visualización del Problema:**
```
┌────────────────────────┐
│   ViewBox (420×420)    │  ← Canvas SVG (límite)
│                        │
│    ╔════════════╗      │
│    ║  Anillo   ║      │  ← Se corta aquí
│ ═══╝  Exterior  ╚═══  │  ← Intenta salirse
│                        │
└────────────────────────┘
```

```
❌ INCORRECTO:
SVG_VIEWBOX_RADIUS = 210
OUTER_RING_RATIO = 1.2
Resultado: 210 × 1.2 = 252 > 210 ⚠️ Se sale del viewBox
```

**Solución:**
```typescript
✅ Opción 1: Aumentar viewBox
SVG_VIEWBOX_RADIUS = 300;
OUTER_RING_RATIO = 0.95;
// 300 × 0.95 = 285 < 300 ✅

✅ Opción 2: Reducir ratio
SVG_VIEWBOX_RADIUS = 210;
OUTER_RING_RATIO = 0.95;
// 210 × 0.95 = 199.5 < 210 ✅
```

**Regla de Oro:**
```
outerRingRadius = SVG_VIEWBOX_RADIUS × OUTER_RING_RATIO
outerRingRadius DEBE SER < SVG_VIEWBOX_RADIUS
Por lo tanto: OUTER_RING_RATIO < 1.0
```

**Tabla de Ejemplos Prácticos:**

| Configuración | SVG_VIEWBOX_RADIUS | OUTER_RING_RATIO | outerRingRadius | Padding | Estado |
|---------------|-------------------|------------------|-----------------|---------|------------|
| Original | 210 | 0.952 | 200 | 10px | ✅ OK |
| Límite seguro | 210 | 0.98 | 205.8 | 4.2px | ✅ OK |
| **Muy justo** | 210 | 0.99 | 207.9 | 2.1px | ⚠️ Ajustado |
| **Se corta** | 210 | 1.05 | 220.5 | -10.5px | ❌ ERROR |
| Solución | 250 | 0.952 | 238 | 12px | ✅ OK |

**⚠️ Recomendación de Padding Mínimo:**

```typescript
// Calcular padding:
const padding = SVG_VIEWBOX_RADIUS - outerRingRadius;

// Ejemplos:
// padding = 210 - 200 = 10px  ✅ Bueno
// padding = 210 - 205 = 5px   ✅ Aceptable
// padding = 210 - 207 = 3px   ⚠️ Muy justo
// padding = 210 - 215 = -5px  ❌ Se corta
```

---

### 5.2 Cambio en CSS no se refleja

**Problema:** Variable CSS duplicada o sobrescrita

**Verificar:**
```bash
# Buscar todas las definiciones de wheel-diameter
grep -rn "wheel-diameter" src --include="*.scss" --include="*.css"
```

**Debe haber SOLO UNA definición:**
```scss
✅ src/theme/variables.scss:7
   --wheel-diameter: clamp(400px, 90vw, 1000px);

❌ NO debe haber en:
   src/app/home/home.page.css
   src/app/components/**/**.css
```

---

### 5.3 Animales/números muy grandes o pequeños

**Problema:** Ratios de tamaño incorrectos

**Verificar proporciones:**
```typescript
// Valores recomendados:
ANIMAL_IMAGE_SIZE_RATIO = 0.238;  // 23.8% del radio
NUMBER_POSITION_RATIO = 0.476;    // 47.6% del radio

// Rangos válidos:
ANIMAL_IMAGE_SIZE_RATIO: 0.1 - 0.4
NUMBER_POSITION_RATIO: 0.3 - 0.6
```

**Ajustar:**
```typescript
// Animales más pequeños
ANIMAL_IMAGE_SIZE_RATIO = 0.15;

// Animales más grandes
ANIMAL_IMAGE_SIZE_RATIO = 0.35;
```

---

### 5.4 ViewBox muy pequeño

**Síntomas:**
- Elementos se solapan
- Imágenes pixeladas
- Rueda se ve "apretada"

**Solución:**
```typescript
// Aumentar el viewBox
SVG_VIEWBOX_RADIUS = 300;  // Era 210

// Mantener ratios < 1.0
OUTER_RING_RATIO = 0.95;
INNER_RING_RATIO = 0.57;
```

---

## 6. Fórmulas de Referencia Rápida

### Cálculo de Valores

```typescript
// ViewBox
viewBoxSize = `${-r} ${-r} ${r * 2} ${r * 2}`
donde r = SVG_VIEWBOX_RADIUS

// Radios de anillos
outerRingRadius = SVG_VIEWBOX_RADIUS × OUTER_RING_RATIO
innerRingRadius = SVG_VIEWBOX_RADIUS × INNER_RING_RATIO

// Posiciones
animalRadius = SVG_VIEWBOX_RADIUS × ANIMAL_POSITION_RATIO
numberRadius = SVG_VIEWBOX_RADIUS × NUMBER_POSITION_RATIO

// Tamaños de imagen
animalImageSize = SVG_VIEWBOX_RADIUS × ANIMAL_IMAGE_SIZE_RATIO
animalImageOffset = -animalImageSize / 2
```

### Validación de Límites

```typescript
// Verificar que no haya clipping:
outerRingRadius < SVG_VIEWBOX_RADIUS ✅
OUTER_RING_RATIO < 1.0 ✅

// Verificar padding mínimo (recomendado 5-10px):
padding = SVG_VIEWBOX_RADIUS - outerRingRadius
padding >= 5 ✅
```

### Tabla de Referencia Rápida por Tamaño

| Objetivo | SVG_VIEWBOX_RADIUS | OUTER_RING_RATIO | Resultado |
|----------|-------------------|------------------|-----------|
| **Rueda pequeña** | 150 | 0.95 | Compacta |
| **Rueda estándar** | 210 | 0.952 | Original ⭐ |
| **Rueda media** | 250 | 0.952 | Más grande |
| **Rueda grande** | 300 | 0.952 | Muy grande |
| **Rueda gigante** | 400 | 0.952 | Máxima |
| **Anillo al límite** | 210 | 0.98 | Borde cercano |
