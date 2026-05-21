# Tamaño responsive de la rueda — CSS puro

## Contexto

Este documento describe el sistema actual de control de tamaño de la rueda y otros elementos en el proyyecto. (2026-05-20).
Reemplaza el enfoque anterior documentado en `wheel-config.md`, donde JavaScript gestionaba
`--wheel-diameter` y `--wheel-border-size` mediante `window.matchMedia` en runtime.


## Solución actual

`--wheel-diameter` y `--wheel-border-size` se definen íntegramente en CSS.
El componente ya no toca estas variables en ningún momento.

### Dónde vive cada variable

| Variable | Valor base (`:root`) | Archivo |
|---|---|---|
| `--wheel-diameter` | `800px` | `src/theme/variables.scss` |
| `--wheel-border-size` | `50vh` | `src/theme/variables.scss` |

Ambas se sobreescriben en cada breakpoint de `src/theme/responsive-variables.scss`.

### Tabla completa de breakpoints — `--wheel-diameter`

| Breakpoint | Media query | Diámetro |
|---|---|---|
| Default | — | `800px` |
| Mobile Standard | 360–415px, h 617–780px | `49vh` |
| iPhone 12/13/14 | 388–393px, h ≥ 840px | `43vh` |
| Samsung S21 | 360–363px, h 798–803px | `49vh` |
| Mobile Large | 414–599px | `52vh` |
| iPhone Pro Max | 426–432px, h ≥ 920px | `53vh` |
| Tablet | 600–1023px | `57vh` |
| Desktop | 1024–1799px | `85vh` |
| HD+ Laptops | 1580–1680px, h 880–920px | `520px` |
| Large Desktop | ≥ 1800px | `960px` |
| 2K/QHD | 2540–2600px, h 1400–1480px | `600px` |
| 4K/UHD | ≥ 3800px, h ≥ 2100px | `700px` |
| Redmi Note 14 | 1216–1224px, h 2708–2716px | `1080px` |

Los breakpoints específicos (HD+, 2K, 4K) solo sobreescriben `--wheel-diameter`; heredan
todos los demás valores del breakpoint más general que los engloba.

### `--wheel-border-size` por breakpoint

Valores sin cambio respecto al SCSS previo, excepto BP6 (Large Desktop) que se corrigió
de `660px` a `81vh` para coincidir con lo que el JS aplicaba efectivamente.

| Breakpoint | Valor |
|---|---|
| Default | `50vh` |
| Mobile Standard | `50.3vh` |
| iPhone 12/13/14 | `44vh` |
| Samsung S21 | `50.5vh` |
| Mobile Large | `53vh` |
| iPhone Pro Max | `54vh` |
| Tablet | `58.5vh` |
| Desktop | `87vh` |
| Large Desktop | `81vh` |
| Redmi Note 14 | `1155px` |

## Cómo ajustar el tamaño de la rueda

Editar el valor de `--wheel-diameter` en el breakpoint correspondiente dentro de
`src/theme/responsive-variables.scss`. El navegador aplica el cambio en el siguiente repintado,
sin tocar TypeScript.

Para añadir un dispositivo nuevo: agregar un bloque `@media` nuevo con solo las variables
que difieren del breakpoint más general que lo cubre.

## Proporciones internas del SVG

Los ratios que controlan la geometría interna (radio de los anillos, posición de animales,
tamaños de fuente SVG) no son variables CSS porque son necesarios en los cálculos
trigonométricos de TypeScript que generan los paths y transforms del SVG.

Viven como constantes `private readonly` directamente en `WheelContainerComponent`:

| Constante | Valor | Descripción |
|---|---|---|
| `SVG_VIEWBOX_RADIUS` | `900` | Sistema de coordenadas SVG (-900 a +900) |
| `OUTER_RING_RATIO` | `0.999` | Radio anillo exterior (⚠️ debe ser < 1.0) |
| `INNER_RING_RATIO` | `0.700` | Radio anillo interior |
| `INNER_RING_GAP_RATIO` | `0.190` | Margen mínimo entre anillos |
| `ANIMAL_POSITION_RATIO` | `0.840` | Posición radial de imágenes de animales |
| `ANIMAL_IMAGE_SIZE_RATIO` | `0.125` | Tamaño de imágenes de animales |
| `ANIMAL_TEXT_POSITION_RATIO` | `0.88` | Posición del texto curvado |
| `outerAnimalFontSize` | `24` | Fuente rueda exterior (unidades SVG) |
| `innerAnimalFontSize` | `16` | Fuente rueda interior (unidades SVG) |

Para modificarlos editar directamente `wheel-container.component.ts` líneas 78–96.

## Archivos involucrados

| Archivo | Rol |
|---|---|
| `src/theme/variables.scss` | Valores default de `--wheel-diameter` y `--wheel-border-size` |
| `src/theme/responsive-variables.scss` | Breakpoints con overrides por dispositivo |
| `src/app/components/wheel-container/wheel-container.component.css` | Consume `var(--wheel-diameter)` en `.wheel-wrapper` y `.aurora-container` |
| `src/app/components/wheel-container/wheel-container.component.ts` | Contiene constantes SVG inlineadas; ya no toca las variables CSS de tamaño |


#### De `=== RESULT CARD ===` (sección conservada; variables cuyas clases CSS no existen en ningún HTML)
- `--result-animal-wrapper-width`
- `--result-animal-wrapper-max-width`
- `--result-animal-wrapper-height`
- `--result-animal-wrapper-max-height`
- `--result-animal-image-size`
- `--result-multiplier-badge-width`
- `--result-multiplier-badge-height`
- `--result-multiplier-badge-top`
- `--result-multiplier-badge-right`
- `--result-multiplier-badge-size`

#### De `=== WHEEL ===` / globales (sustituidas por CSS puro o eliminadas con el JS)
- `--wheel-displacement-x`
- `--wheel-displacement-y`
- `--wheel-margin-left`
- `--wheel-border-size` (quitada de todos los breakpoints; el valor por defecto permanece en `variables.scss`)

### Variables conservadas en `=== RESULT CARD ===`

Estas 7 variables sí tienen consumidor activo (`.result-container`, `.result-title`, `.win-amount` en `home.page.html`):

- `--result-card-width`
- `--result-card-max-width`
- `--result-card-height`
- `--result-card-max-height`
- `--result-card-padding`
- `--result-title-font-size`
- `--win-amount-font-size`

### Variables añadidas

#### `--wheel-diameter` en todos los breakpoints
Migrada de JS (`getWheelDiameter()`) a CSS puro. Ver tabla de breakpoints arriba.

#### `=== RESULTS HISTORY PANEL ===` (nueva sección en los 9 breakpoints)
- `--history-panel-right`
- `--history-panel-top`
- `--history-panel-transform`
- `--history-panel-width`
- `--history-label-font-size`
- `--history-entry-gap`
- `--history-entry-padding`
- `--history-entry-image-size`
- `--history-time-font-size`
- `--history-entry-font-size`



#### `=== CLOCK ===` (nueva sección en los 9 breakpoints)
Defaults en `variables.scss`: widget `170px / 82px / 1.5rem / 1.5rem`; contenido `1.4rem / 0px / 0px` y `1.6rem / 0px / 0px`.

Eliminados del HTML/TS: `clock-time-label` (div completo), bindings inline `[style.width]`, `[style.min-height]`, `[style.font-size]`, `[style.top/left/right/bottom/transform]` de `clock-time-value`.
Eliminado de `home.page.css`: `@media (max-width: 640px)` que sobreescribía hardcoded width y font-size.

| Variable | Descripción | Consumidor |
|---|---|---|
| `--clock-widget-width` | Ancho del contenedor `.clock-widget` | `home.page.css` |
| `--clock-widget-min-height` | Altura mínima del contenedor | `home.page.css` |
| `--clock-widget-bottom` | Distancia al borde inferior (position: absolute) | `home.page.css` |
| `--clock-widget-left` | Distancia al borde izquierdo | `home.page.css` |
| `--clock-value-font-size` | Tamaño de fuente del tiempo en `.clock-time-value` | `home.page.css` |
| `--clock-value-top` | Offset vertical (position: relative) dentro del widget | `home.page.css` |
| `--clock-value-left` | Offset horizontal dentro del widget | `home.page.css` |
| `--countdown-font-size` | Tamaño de fuente del `.countdown-value` | `countdown-timer.component.css` |
| `--countdown-top` | Offset vertical del host `<app-countdown-timer>` | `countdown-timer.component.css` |
| `--countdown-left` | Offset horizontal del host | `countdown-timer.component.css` |

Valores por breakpoint:

| Breakpoint | `--clock-widget-width` | `--clock-widget-min-height` | `--clock-value-font-size` | `--countdown-font-size` |
|---|---|---|---|---|
| Mobile (BP2–BP3B) | `145px` | `70px` | `0.9rem` | `1.0rem` |
| Tablet (BP4) | `160px` | `78px` | `1.2rem` | `1.4rem` |
| Desktop / Large Desktop (BP5–BP6) | `170px` | `82px` | `1.4rem` | `1.6rem` |
| Redmi Note 14 (BP7) | `300px` | `150px` | `2.5rem` | `3.0rem` |

`--clock-widget-bottom` y `--clock-widget-left`: `1rem` en mobile, `1.5rem` en tablet/desktop, `2rem` en Redmi.
`--clock-value-top/left` y `--countdown-top/left`: `0px` en todos los breakpoints (ajustar para mover dentro del widget).


#### `=== LOGO ===` (nueva sección en los 9 breakpoints)
Defaults en `variables.scss`: `80px / 10px / 10px / 0px / 0px`.

| Variable | Descripción |
|---|---|
| `--logo-size` | Ancho de `.game-logo` |
| `--logo-top` | `top` de `.logo-container` (position: fixed) |
| `--logo-left` | `left` de `.logo-container` |
| `--logo-translate-x` | Ajuste fino horizontal vía `transform: translate()` |
| `--logo-translate-y` | Ajuste fino vertical vía `transform: translate()` |

Valores por breakpoint:

| Breakpoint | `--logo-size` | `--logo-top` | `--logo-left` |
|---|---|---|---|
| Mobile (BP2–BP3B) | `80px` | `10px` | `10px` |
| iPhone Pro Max (BP3B) | `85px` | `10px` | `10px` |
| Tablet (BP4) | `80px` | `10px` | `10px` |
| Desktop / Large Desktop (BP5–BP6) | `215px` | `20px` | `20px` |
| Redmi Note 14 (BP7) | `300px` | `40px` | `40px` |


---

## Limpieza de `responsive-variables.scss` 

Se eliminaron todas las variables que ya no tenían consumidor activo en el HTML o en CSS vivo. A continuación el inventario completo por sección.

### Secciones eliminadas por completo

#### `=== BETTING PANEL ===`
- `--betting-panel-width`
- `--betting-panel-height`
- `--betting-panel-translate-x`
- `--betting-panel-translate-y`
- `--betting-panel-appear-offset-x`
- `--betting-panel-appear-offset-y`

#### `=== CHIPS ===`
- `--chips-columns`
- `--chips-section-width`
- `--chips-gap-horizontal`
- `--chips-gap-vertical`
- `--chips-scale`
- `--chips-top`
- `--chips-left`

#### `=== BET DISPLAY ===`
- `--bet-display-width`
- `--bet-display-height`
- `--bet-display-top`
- `--bet-display-right`
- `--bet-font-size`
- `--bet-font-size-alt`
- `--coin-chip-font-size`

#### `=== TOTAL BET DISPLAY ===`
- `--total-bet-bottom`
- `--total-bet-right`
- `--total-bet-font-size`

### Variables eliminadas de secciones parcialmente conservadas

#### De `=== UI ELEMENTS ===` (sección conservada, variables huérfanas eliminadas)
- `--logo-left`
- `--logo-size`
- `--help-button-size`
- `--help-button-top`
- `--help-button-icon-size`
- `--help-button-transform-x`
- `--help-buttons-direction`
- `--help-buttons-gap`
- `--clear-button-width`
- `--clear-button-height`
- `--clear-button-top`
- `--clear-button-left`
- `--clear-all-button-size`
- `--clear-all-button-top`
- `--clear-all-button-left`
- `--balance-display-left`
- `--settings-content-font-size`
- `--history-content-font-size`