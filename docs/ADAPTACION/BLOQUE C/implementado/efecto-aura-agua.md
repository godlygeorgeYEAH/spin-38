# 💧 Aura de Agua

Componente animado que dibuja un anillo de agua girando en sentido horario alrededor de cualquier elemento circular. Olas irregulares en el borde, burbujas que aparecen y desaparecen, todo configurable.

---

## 📦 Archivos del paquete

| Archivo | Para qué |
|---|---|
| `integration/water-ring.component.ts` | Componente **Angular standalone** — para Ionic + Angular |
---

## 🚀 Cómo importar

### Ionic + Angular

1. **Copia** `integration/water-ring.component.ts` a tu proyecto, por ejemplo a `src/app/components/water-ring/water-ring.component.ts`.

2. **Impórtalo** en la página o componente donde lo vas a usar (es un *standalone component*):

   ```ts
   import { Component } from '@angular/core';
   import { IonicModule } from '@ionic/angular';
   import { WaterRingComponent } from '../components/water-ring/water-ring.component';

   @Component({
     selector: 'app-home',
     standalone: true,
     imports: [IonicModule, WaterRingComponent],
     templateUrl: './home.page.html',
   })
   export class HomePage {}
   ```

3. **Úsalo** en el template HTML:

   ```html
   <div class="avatar-wrapper">
     <ion-avatar class="avatar">
       <img src="assets/profile.png" />
     </ion-avatar>
     <app-water-ring
       class="ring-overlay"
       [size]="120"
       [color]="'#3FB8E8'"
       [speed]="12"
     ></app-water-ring>
   </div>
   ```

4. **CSS** para que el aro envuelva al avatar:

   ```scss
   .avatar-wrapper {
     position: relative;
     width: 120px;
     height: 120px;
     display: inline-block;
   }
   .avatar {
     position: absolute;
     inset: 16px;          /* deja espacio para el aro */
     width: calc(100% - 32px);
     height: calc(100% - 32px);
   }
   .ring-overlay {
     position: absolute;
     inset: 0;
     pointer-events: none; /* clicks pasan al avatar */
   }
   ```

> **Importante**: el `width` y `height` del `avatar-wrapper` deben ser iguales al `size` del aro (en este ejemplo, 120px).



## 🎛️ Referencia de props (inputs)

Todas las props son opcionales. Estos son los defaults.

### Geometría general

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `size` | number (px) | `320` | Diámetro nominal del aro. El SVG real es más grande para acomodar olas que sobresalgan. |
| `ringRatio` | 0–1 | `0.78` | Dónde está el centro del aro respecto al radio total. Más bajo → aro más interior. |
| `ringWidth` | 0–1 | `0.32` | Grosor del aro como fracción de `size`. |
| `speed` | seconds | `12` | Segundos por vuelta completa del agua. Más bajo = giro más rápido. |

### Hilos de agua (el efecto principal)

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `strands` | int | `3` | Número de hilos sinusoidales entrelazados. |
| `waves` | int | `5` | Crestas por hilo alrededor del aro. |
| `amp` | 0–1 | `0.07` | Amplitud de los hilos (fracción de `size`). |

### Borde exterior con olas

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `outerWaveAmp` | 0–1 | `0.06` | Amplitud del oleaje del borde. |
| `outerWaveFreq` | int | `6` | Número de crestas principales en el borde. |
| `outerWaveSpeed` | seconds | `9` | Ciclo del morph del borde. Más bajo = oleaje más agitado. |
| `outerKeyframes` | int | `8` | Cuántos keyframes precomputar para el morph. Más = más fluido pero más pesado. |

### Burbujas

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `bubbleCount` | int | `60` | Cuántas burbujas dibujar. |
| `bubbleSpread` | 0–2 | `1` | Extensión radial. `0` = pegadas al aro interior. `1` = llenan el agua. `>1` = sobresalen fuera del aro. |
| `bubbleFade` | boolean | `true` | Si las burbujas aparecen / desaparecen suavemente. |
| `bubbleFadeSpeed` | seconds | `4` | Duración promedio del ciclo de fade de cada burbuja. |

### Color

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `color` | hex | `'#3FB8E8'` | Color medio del agua. |
| `lightColor` | hex | `'#B7ECFA'` | Brillo del borde externo del agua. |
| `darkColor` | hex | `'#1A8FBE'` | Sombra del borde interno del agua. |
| `showHighlight` | boolean | `true` | Especular estático en esquina superior izquierda. |

---

## 🧠 Cómo funciona — la construcción

### 1. Composición en capas

El componente es un SVG con cuatro capas, de adentro hacia afuera:

```
┌─────────────────────────────────┐
│ Especular estático (luz)        │  ← opcional
├─────────────────────────────────┤
│ Burbujas (sin máscara)          │  ← pueden sobresalir
├─────────────────────────────────┤
│ Hilos de agua (con máscara)     │  ← gradiente radial
├─────────────────────────────────┤
│ Base translúcida (con máscara)  │  ← tinta el agua
└─────────────────────────────────┘
```

La **máscara** es lo que recorta al agua para que tenga forma de aro con borde ondulado.

### 2. Los hilos

Cada hilo es un path de SVG que sigue la ecuación polar:

```
r(θ) = baseR + amp · sin(waves · θ + φᵢ)
```

donde `φᵢ` es la fase de cada hilo (cada uno arranca en un ángulo diferente). El grupo entero rota con una animación CSS `@keyframes`, y como `r(θ)` es una función continua, el path se ve como agua fluyendo.

El **gradiente radial** que pinta el stroke va de oscuro (interior) a claro (exterior), dando sensación de volumen.

### 3. El borde con olas irregulares — la parte buena

Aquí está el truco. La forma del borde NO es un círculo. Es una **suma de tres senoides con frecuencias no múltiplas**:

```
r(θ) = baseR + a₁·sin(f₁·θ + p₁)
              + a₂·sin(f₂·θ + p₂)
              + a₃·sin(f₃·θ + p₃)
```

Como `f₂ = 1.7·f₁ + 1` y `f₃ = 0.6·f₁ + 0.5` no son múltiplos enteros, las tres ondas nunca se alinean igual: el resultado es una curva con crestas de alturas variables que no se repiten obviamente.

Los puntos muestreados de `r(θ)` se pasan por una **conversión Catmull-Rom → Cubic Bezier** (`smoothClosedPath`) para que el path final sea totalmente liso, sin esquinas de polilínea.

### 4. Animación fluida sin saltos

Para que las olas *muten* (no solo roten), precomputamos **N keyframes** de la curva irregular, cada uno con fases ligeramente desplazadas. Luego SMIL (`<animate>`) interpola entre ellos con easing cúbico.

**Clave para que el loop no salte**: las fases de cada armónica se desplazan en *múltiplos enteros* de 2π durante el ciclo (1, 2, -1 vueltas). Así, después de un ciclo completo, cada senoide volvió exactamente a su estado inicial. El último keyframe coincide perfectamente con el primero.

```
p₁(u) = u · 2π · 1
p₂(u) = u · 2π · 2 + 0.5
p₃(u) = u · 2π · (-1) + 1.8
```

donde `u` va de 0 a 1 a lo largo del ciclo.

Encima de todo esto, el grupo entero rota lentamente (`speed × 2.2` segundos), así las crestas también *viajan* alrededor del aro.

### 5. Las burbujas

Posiciones en coordenadas polares con un PRNG **sembrado** (`mulberry32` con seed 42) — esto garantiza que las burbujas no salten entre renders.

- Radialmente confinadas entre `innerR` y `outerR - máxima_depresión_de_olas`, así nunca quedan fuera del agua cuando la ola se hunde.
- Cuando `bubbleSpread > 1`, ese límite se ignora y las burbujas se desbordan.
- Cuando `bubbleSpread > 0.7`, se sesga la distribución con `Math.pow(rand, 0.7)` para que aparezcan **más burbujas cerca del borde**.

**Fade in/out**: cada burbuja tiene su propio `<animate>` SMIL con `dur` y `begin` aleatorizados. El `begin` es negativo, lo que arranca cada animación en un punto medio diferente del ciclo — el campo entero shimmer-ea de forma incoherente en vez de pulsar al unísono.

### 6. El canvas overflow

El SVG **no tiene el tamaño visual**. Tiene un padding extra:

```
pad = ceil(size × (outerWaveAmp × 2.2 + 0.15))
canvas = size + pad × 2
```

El SVG se posiciona con `left: -pad; top: -pad`, así visualmente parece del tamaño correcto, pero internamente tiene espacio para que las olas o burbujas sobresalgan sin recortarse. La `mask` también es 3× el canvas para no cortar nada.

---

## ⚡ Rendimiento

- **CPU**: bajo. Los paths se computan una sola vez por cambio de prop (gracias a `useMemo` en React y `OnChanges` en Angular).
- **GPU**: la única animación CSS es la rotación, que es compositada en GPU. SMIL anima el path en `d` que es CPU pero ligero.
- **Burbujas**: cada burbuja con `bubbleFade` activo tiene su propio `<animate>`. Con 400 burbujas funciona suave en móvil moderno, pero si necesitas exprimir más, baja `bubbleCount` o desactiva `bubbleFade`.
- **Móvil de gama baja**: considera bajar `outerKeyframes` a 4 y `bubbleCount` a 30.

---

## 🐛 Troubleshooting

**El aro no aparece o aparece recortado**
→ El contenedor padre necesita `position: relative` y tamaño fijo (`width` y `height` iguales a `size`).

**El aro no rota** (React)
→ Falta el keyframe global `@keyframes water-ring-spin`. Añádelo en tu CSS principal.

**Las olas se ven en bloques / pixeladas**
→ Asegúrate de que no estés aplicando `transform: scale()` a un SVG con un `<filter>` bitmap. Este componente usa solo paths vectoriales puros, así que esto no debería pasar; si pasa, revisa que no haya un `filter: blur()` heredado del CSS.

**Las burbujas aparecen / desaparecen en bloque**
→ Asegúrate de que `bubbleFadeSpeed` no esté en 0 o un valor muy pequeño. Cada burbuja necesita un rango temporal en el que distribuir su `begin` aleatorio.

---

