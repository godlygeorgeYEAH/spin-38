# C3 — Retoque visual de la animación de resultado

## Diagnóstico

La animación ya tiene suficiente dinamismo: desplazamiento de texto para atrapar la mirada → texto estático que brilla como letrero. La fase dinámica no se toca. El problema está en la **fase estática (hold)**: se ve genérica porque la fuente no tiene personalidad y el efecto de brillo no transmite calidad.

## Dirección

- **Emoción:** celebración. Referencia: máquinas tragaperras.
- **Qué se mejora:** solo la fase estática. La fuente y el tratamiento visual del texto en reposo.
- **El overlay está bien.** No se toca el sonido.

## Fuente

Debe sentirse **cálida y expresiva** — no fría ni geométrica. Referencia de personalidad: letras de cartel festivo, display bold con algo de humanismo, trazos que no sean perfectamente mecánicos. Opciones a evaluar (Google Fonts, libre):

| Fuente | Característica |
|---|---|
| **Lilita One** | Bold latino, trazo uniforme caliente |
| **Boogaloo** | Informal festivo, ligero |
| **Righteous** | Display cálido, algo retro |
| **Titan One** | Muy bold, impacto, cercano al cartel |
| **Fredoka One** | Redondeado, amigable |

Elegir la que mejor lea como **grito** en mayúsculas y que tenga personalidad cuando está estática en pantalla.

## Dos modos de texto

La animación distingue dos casos según el resultado:

| Modo | Condición | Comportamiento |
|---|---|---|
| **Hype** (morocha/dupla) | `outerPosition === innerPosition` | Ráfaga horizontal + parpadeos verticales + texto final centrado. Texto dorado (`#FFD700`) con brillo ámbar. |
| **Normal** (resultado simple) | `outerPosition !== innerPosition` | Texto entra desde la izquierda, se detiene en el centro. Texto **blanco** con brillo **azul**. Sin ráfagas. |

La condición se evalúa en `home.page.ts` en los dos puntos donde se llama `reveal.play()`:
```ts
const isDupla = String(cmd.outerPosition) === String(cmd.innerPosition);
await this.reveal.play({ ..., hype: isDupla });
```

## Efecto de brillo

### Modo hype — brillo ámbar/dorado
`@keyframes neon-flicker` en `src/global.scss` — 9 keyframes irregulares en tono ámbar/dorado. Easing `cubic-bezier(0.37, 0, 0.63, 1)`, duración 4 s.

### Modo normal — brillo azul
`@keyframes neon-flicker-blue` en `src/global.scss` — misma estructura que `neon-flicker` pero en tono azul eléctrico (`#2299FF` / `#0066FF`). Aplicado a `.reveal-text` en el componente.

Características comunes:
- Borde/outline grueso de contraste para leer a distancia en TV.
- `paint-order: stroke fill` — el outline queda detrás del relleno.
- Pulso orgánico con easing no lineal y variación de intensidad entre keyframes.

## Colapso al centro de la rueda

Al terminar la animación, todos los elementos (imágenes y texto) se desplazan al **centro exacto de la rueda**, independientemente del breakpoint.

**Implementación:**
- `WheelContainerComponent.getWheelCenterViewport()` devuelve las coordenadas viewport del centro del SVG.
- `RevealConfig.collapseTarget?: { x, y }` recibe esas coordenadas.
- `applyVars()` en el overlay calcula el offset respecto al centro de pantalla y lo inyecta como `--reveal-collapse-x` / `--reveal-collapse-y`.
- Los estados `.collapse` y `.gone` de imágenes y texto aplican ese offset en su `transform`.
- Fallback: `0px` / `0px` (centro de pantalla) si el elemento no está disponible.

## Lo que NO cambia

- La secuencia de entrada (desplazamiento / ráfagas).
- El overlay y su opacidad.
- El sonido.
- Los timings de `REVEAL_DEFAULTS`.

## Criterios de aceptación

- La fuente en fase estática tiene personalidad visible — no es una sans-serif genérica.
- Modo hype: brillo irradia calidez (tono ámbar/dorado).
- Modo normal: texto blanco con brillo azul, sin ráfagas, entrada suave sin saltos.
- Los elementos colapsan hacia el centro de la rueda en todos los breakpoints.
- El texto es legible a distancia en TV con el outline.
- No hay regresiones en la fase dinámica de entrada.

## Archivos modificados

| Archivo | Cambios |
|---|---|
| `src/index.html` | `<link>` preconnect + stylesheet de Titan One |
| `src/global.scss` | `@keyframes neon-flicker` (ámbar) + `@keyframes neon-flicker-blue` (azul) |
| `reveal-overlay.component.scss` | Fuente `Titan One`; modo hype: dorado `#FFD700`; modo normal: blanco `#ffffff` con brillo azul y easing sin overshoot `cubic-bezier(0.25, 1, 0.5, 1)`; colapso con `--reveal-collapse-x/y` |
| `reveal-overlay.component.ts` | `applyVars` inyecta `--reveal-collapse-x/y` calculados desde `collapseTarget` |
| `reveal.service.ts` | `RevealConfig` añade `collapseTarget?: { x, y }` |
| `wheel-container.component.ts` | Método público `getWheelCenterViewport()` |
| `home.page.ts` | Condición `isDupla` para `hype`; pasa `collapseTarget` en ambos puntos de llamada |

## Estado

Implementado
