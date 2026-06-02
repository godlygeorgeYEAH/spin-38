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

## Efecto de brillo estático

El brillo tipo letrero que ya existe debe mejorar en calidad. Características deseadas:
- Brillo suave y cálido (no frío/blanco puro) — amarillo dorado o ámbar, como luz incandescente.
- El texto debe tener **outline/borde grueso** de contraste para leer bien a distancia en TV.
- El pulso de brillo debe sentirse orgánico, no mecánico (easing no lineal, variación de intensidad).

## Lo que NO cambia

- La secuencia de entrada (desplazamiento / ráfagas).
- El overlay y su opacidad.
- El sonido.
- Los timings de `REVEAL_DEFAULTS`.

## Criterios de aceptación

- La fuente en fase estática tiene personalidad visible — no es una sans-serif genérica.
- El brillo irradia calidez (tono cálido, no blanco frío).
- El texto es legible a distancia en TV con el outline.
- No hay regresiones en la fase dinámica de entrada.

## Implementación

**Fuente elegida:** `Titan One` (Google Fonts) — cargada en `src/index.html`.

**Archivos modificados:**
- `src/index.html` — `<link>` preconnect + stylesheet de Titan One
- `src/global.scss` — `@keyframes neon-flicker` reescrito con 9 keyframes irregulares en tono ámbar/dorado (eliminado el `steps(1, end)` mecánico)
- `src/app/components/results-animation/reveal-overlay.component.scss`:
  - Font: `Archivo Black` → `Titan One` en `.reveal-text`, `.hype-word`, `.hype-final`
  - Color: `transparent` + stroke blanco/frío → fill `#FFD700` + stroke `#1A0500` (oscuro, grueso para TV)
  - `paint-order: stroke fill` para que el outline quede detrás del relleno
  - Animación `.enter`: `0.5s steps(1, end)` → `4s cubic-bezier(0.37, 0, 0.63, 1)`
  - Animación `.hype-final`: `2.5s ease-in-out` → `4.4s cubic-bezier(0.37, 0, 0.63, 1)`

## Estado

Implementado — pendiente revisión visual y ajuste fino.
