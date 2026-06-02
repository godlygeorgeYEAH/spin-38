# C4 — Ojo de Buey (centro de rueda)

Componente que dibuja una superficie de agua animada **detrás del marco del ojo de buey**. El agua llena la mitad inferior, su superficie ondula y fluye, con burbujas que ascienden. El marco PNG (`centrorueda.png`) va encima como capa decorativa.

---

## Concepto visual

- Estilo: **cómico y ghibli** (referencia del concepto general de la ruleta).
- Forma: ventanilla circular de barco con marco decorativo.
- **El centro del PNG debe ser transparente** — el canal alpha permite ver el agua animada a través del marco.
- Sin detalles finos que se pierdan en TV a distancia: trazos gruesos, formas reconocibles, sin gradientes sutiles.

---

## Assets

| Archivo | Descripción |
|---|---|
| `src/assets/images/rueda/centrorueda.png` | Marco de latón — centro transparente (alpha = 0) |
| `src/assets/images/rueda/centroruedafondo.png` | Fondo estático (reemplazado por la animación) |

**Especificaciones del PNG del marco:**
- Formato: PNG con transparencia (canal alpha).
- El arte debe ser circular; el interior completamente vacío (alpha = 0).
- Tamaño de referencia: 1024×1024 px. Centro ≈ (513, 507), radio interno ≈ 277 px.

---

## Integración en la app

El componente vive en `src/app/components/porthole-water/porthole-water.component.ts` y ya está integrado en `wheel-container.component.html`:

```html
<div class="wheel-center-asset">
  <app-porthole-water></app-porthole-water>
</div>
```

El tamaño lo controla la variable CSS `--wheel-center-size` definida en `responsive-variables.scss`.

> Si cambias el arte del marco, recalibra `glassCx`, `glassCy` y `glassR`
> (ver sección **Calibrar otro marco** más abajo).

---

## Referencia de inputs

Todos opcionales — los defaults funcionan con `centrorueda.png` (1024×1024).

### Geometría del cristal

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `size` | `number` (px) | `520` | Espacio de coordenadas del viewBox SVG. El render escala por CSS. |
| `frameSrc` | `string` | `'assets/images/rueda/centrorueda.png'` | Ruta al PNG del marco. |
| `glassCx` | `0–1` | `0.501` | Centro X del círculo de cristal (fracción de `size`). |
| `glassCy` | `0–1` | `0.495` | Centro Y del círculo de cristal. |
| `glassR` | `0–1` | `0.283` | Radio del cristal. Ligeramente mayor que el agujero visible para que el agua quede **bajo** el latón. |

### Agua y oleaje

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `waterLevel` | `0–1` | `0.5` | Nivel del agua. `0` = vacío, `1` = lleno. |
| `waveAmp` | `0–1` | `0.07` | Amplitud del oleaje (fracción del radio). |
| `waveCount` | `number` | `2.4` | Número de crestas a lo ancho del cristal. |
| `waveSpeed` | segundos | `7` | Segundos por longitud de onda. Menor = más rápido. |
| `flowRight` | `boolean` | `true` | Dirección del flujo. `false` = izquierda. |
| `sway` | grados | `1.2` | Balanceo tipo barco. `0` lo desactiva. |

### Burbujas

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `bubbleCount` | `int` | `22` | Número de burbujas ascendentes. |
| `bubbleSpeed` | segundos | `6` | Ciclo de ascenso promedio. |
| `bubbleFade` | `boolean` | `true` | Fade in/out al ascender. |

### Color

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `color` | hex | `'#2f9fd6'` | Color medio del agua. |
| `lightColor` | hex | `'#9be7fb'` | Brillo cerca de la superficie + cresta. |
| `darkColor` | hex | `'#0c4d74'` | Profundidad (fondo del agua). |
| `airColor` | hex | `'#0a2230'` | Atmósfera oscura sobre la línea de agua. |

---

## Presets

### Calmo (default recomendado)
```html
<app-porthole-water
  [waterLevel]="0.5" [waveAmp]="0.05" [waveSpeed]="10"
  [bubbleCount]="12" [sway]="0.8"
></app-porthole-water>
```

### Tormenta
```html
<app-porthole-water
  [waterLevel]="0.62" [waveAmp]="0.16" [waveCount]="3.2"
  [waveSpeed]="3.5" [bubbleCount]="60" [sway]="3"
></app-porthole-water>
```

### Acuario verde
```html
<app-porthole-water
  [color]="'#1f8a7a'" [lightColor]="'#bdf3e6'" [darkColor]="'#0a4f47'"
  [waterLevel]="0.8" [bubbleCount]="40"
></app-porthole-water>
```

### Gama baja (rendimiento)
```html
<app-porthole-water
  [bubbleCount]="12" [sway]="0"
></app-porthole-water>
```

---

## Cómo funciona

### Composición en capas

```
┌────────────────────────────────────┐
│  Marco PNG (centrorueda.png)        │  ← img superpuesta fuera del SVG
├────────────────────────────────────┤
│  Reflejo de cristal (screen blend) │  ← elipse tenue arriba-izq
│  Viñeta interior (oscurece bordes) │
│  Burbujas ascendentes              │
│  Línea de superficie (highlight)   │
│  Cáusticos bajo la superficie      │  ┐
│  Agua — capa frontal (gradiente)   │  ├ grupo con balanceo (sway)
│  Agua — capa trasera (más lenta)   │  ┘
│  Atmósfera sobre la línea de agua  │
└────────────────────────────────────┘
   todo recortado a circle(cx, cy, R)
```

### Superficie de agua

Suma de armónicas con longitud de onda fundamental `λ`:

```
y(x) = surfaceY − A · [ 1.00·sin(kx)
                       + 0.50·sin(2kx + φ₂)
                       + 0.28·sin(3kx + φ₃) ]
   con k = 2π / λ
```

Los multiplicadores enteros (1, 2, 3) hacen el patrón **periódico con período λ**, lo que permite el loop continuo sin saltos.

### Flujo sin saltos

El path se traslada horizontalmente de `0` a `λ` via `<animateTransform type="translate">`. Al terminar, el path es idéntico al inicio → **loop perfecto**. El path se construye una `λ` extra a cada lado del cristal; el clipPath circular oculta el sobrante.

Hay dos capas (frontal y trasera) a velocidades distintas (`waveSpeed` vs `waveSpeed × 1.7`) → sensación de profundidad y parallax.

### Suavizado vectorial

Los puntos muestreados de `y(x)` pasan por **Catmull-Rom → Bézier cúbica** (`smoothOpenPath`). 100% vectorial, nítido a cualquier tamaño.

### Burbujas

PRNG sembrado (`pwRand(7)`) para resultados deterministas entre renders. Cada burbuja nace cerca del fondo, sube con leve drift lateral y hace fade in/out. El `begin` negativo aleatorio arranca cada una en un punto distinto del ciclo.

### Balanceo (sway)

Un `<g>` envuelve toda el agua y rota con `@keyframes pw-sway` (de `−sway°` a `+sway°`), pivotando en el centro del cristal. El keyframe está incluido en los estilos del componente (no requiere CSS global).

---

## Calibrar otro marco

Si reemplazas `centrorueda.png` por otro arte:

1. Abre el PNG y localiza el centro del agujero transparente y su radio en px.
2. Convierte a fracciones del ancho del PNG:
   ```
   glassCx = centroX / anchoPNG
   glassCy = centroY / altoPNG
   glassR  = radio   / anchoPNG  (+0.01–0.02 para cubrir bajo el marco)
   ```
3. Pasa los valores como inputs al componente.

**Valores para `centrorueda.png` (1024×1024):**
centro ≈ (513, 507), radio interno ≈ 277 px → `glassCx=0.501`, `glassCy=0.495`, `glassR=0.283`.

---

## Rendimiento

- Los paths se calculan una vez por cambio de input (`ngOnChanges`).
- El flujo usa SMIL `animateTransform` — barato en GPU.
- El balanceo es una animación CSS compositada.
- ~22 burbujas van sobradas en móvil. Para exprimir: bajar `bubbleCount` o poner `sway=0`.

---

## Troubleshooting

| Síntoma | Solución |
|---|---|
| El agua no se ve / se ve la página detrás | `centrorueda.png` debe tener el centro con alpha=0. Verificar ruta en `frameSrc`. |
| El agua no alinea con el círculo del marco | Recalibrar `glassCx / glassCy / glassR` para el PNG actual. |
| El agua asoma por fuera del marco | Subir `glassR` un poco (0.01–0.02). |
| No hay balanceo | Verificar que `sway > 0`. El keyframe `pw-sway` está incluido en el componente. |
| El agua "salta" al reiniciar | Si editaste los armónicos, asegúrate de que los multiplicadores (`mult`) sigan siendo **enteros**. |

---

## Estado

Implementado. Pendiente asset definitivo del diseñador para `centrorueda.png`.
