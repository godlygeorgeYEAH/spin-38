# ~~wheel.config.ts~~ — OBSOLETO (eliminado 2026-05-20)

> Este archivo fue eliminado. Ver `responsive-wheel-sizing.md` para la implementación actual.

---

# wheel.config.ts — Fuente única de verdad de la rueda

`src/app/components/wheel-container/wheel.config.ts`

## Problema que resuelve

Antes de esta implementación, el tamaño y las proporciones de la rueda estaban dispersos en tres lugares:
- Constantes privadas en `wheel-container.component.ts` (radios SVG)
- `responsive-variables.scss` (9 definiciones de `--wheel-diameter`)
- `home.page.css` (5 overrides de `--wheel-diameter`)

Cualquier cambio requería editar múltiples archivos sin garantía de consistencia.

## Cómo lo resuelve

`wheel.config.ts` centraliza dos sistemas que antes estaban desconectados:

- **Proporciones SVG** (`WHEEL_SVG`): los ratios y font-sizes que antes vivían como constantes privadas en el componente ahora son datos editables en un solo lugar. El componente los importa y los usa para todos sus cálculos trigonométricos y bindings del template.

- **Diámetro visual** (`WHEEL_BREAKPOINTS`): los breakpoints que antes eran media queries CSS dispersas en dos archivos ahora son un array TypeScript. La función `getWheelDiameter()` los evalúa en runtime con `window.matchMedia` y aplica `--wheel-diameter` sobre `:root`, replicando exactamente la cascada CSS (el último que coincide gana).

El resultado es que para cambiar cualquier aspecto del tamaño o radio de la rueda se edita únicamente `wheel.config.ts`.

## Estructura del config

### `WHEEL_SVG` — proporciones internas del SVG

| Campo | Valor | Descripción |
|---|---|---|
| `viewboxRadius` | 300 | Límite del sistema de coordenadas SVG (-300 a +300) |
| `outerRingRatio` | 0.999 | Radio rueda exterior (⚠️ debe ser < 1.0) |
| `innerRingRatio` | 0.555 | Radio rueda interior (debe ser < outerRingRatio) |
| `animalPositionRatio` | 0.720 | Posición radial de imágenes de animales |
| `numberPositionRatio` | 0.450 | Posición radial de números |
| `animalImageSizeRatio` | 0.299 | Tamaño de imágenes de animales |
| `animalTextPositionRatio` | 0.88 | Posición texto curvado de animales |
| `outerNumberFontSize` | 24 | Fuente números rueda exterior (unidades SVG) |
| `innerNumberFontSize` | 16 | Fuente números rueda interior (unidades SVG) |

Los radios reales se calculan en el componente: `radio = viewboxRadius × ratio`.

### `WHEEL_BREAKPOINTS` — diámetro visual por dispositivo

Array de objetos `{ mediaQuery, diameter }` evaluados en orden.
El **último que coincide gana**, igual que la cascada CSS.

Breakpoints activos (2026-05-12):

| Dispositivo | Media query | Diámetro |
|---|---|---|
| Default | — | 450px |
| HD+ Laptops | 1580–1680px, h 880–920px | 520px |
| Large Desktop | ≥ 1800px | 650px |
| 2K/QHD | 2540–2600px, h 1400–1480px | 600px |
| 4K/UHD | ≥ 3800px, h ≥ 2100px | 700px |

Los breakpoints de móvil y tablet están comentados, pendientes de ajuste.

### `getWheelDiameter()` — función de resolución

Itera `WHEEL_BREAKPOINTS` usando `window.matchMedia` y retorna el último diámetro que coincide.

## Cómo funciona en runtime

`WheelContainerComponent` llama a `getWheelDiameter()` en `ngOnInit` y en cada `resize`,
aplicando el resultado como `document.documentElement.style.setProperty('--wheel-diameter', ...)`.

Los font-size SVG se bindean directamente en el template con `[attr.font-size]`,
garantizando que escalen con el viewBox en lugar de con el documento HTML.

## Archivos que heredan del config

| Archivo | Qué consume |
|---|---|
| `wheel-container.component.ts` | `WHEEL_SVG`, `getWheelDiameter` |
| `wheel-container.component.html` | `outerNumberFontSize`, `innerNumberFontSize` (vía getters del componente) |
| `wheel-container.component.css` | `var(--wheel-diameter)` (aplicada en runtime) |
| `home.page.css` | `var(--wheel-diameter)` (aplicada en runtime) |
