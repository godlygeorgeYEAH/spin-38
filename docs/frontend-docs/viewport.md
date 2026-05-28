# Viewport

## Cambios realizados

- Se documentan los ajustes de viewport añadidos en `src/theme/responsive-variables.scss`.
- Se incorporaron dos breakpoints específicos para escritorio:
  - `1920x1080` — Full HD Desktop.
  - `2160x1440` — QHD Desktop.

## Detalles técnicos

- Se añadieron dos nuevas reglas CSS en `responsive-variables.scss`:
  - `@media (min-width: 1920px) and (max-width: 2159px) and (min-height: 1040px) and (max-height: 1120px)`
  - `@media (min-width: 2510px) and (max-width: 2560px) and (min-height: 1307px) and (max-height: 1440px)`
- Cada breakpoint define ajustes para:
  - área de la rueda (`wheel`)
  - puntero (`pointer`)
  - display del animal (`animal display`)
  - reloj (`clock widget`)
  - logo
  - modales
  - tarjetas de resultados (`result card`)
  - panel de historial y panel de resultados a la derecha

## Propósito

- Mejorar el comportamiento visual en monitores grandes y resoluciones de escritorio comunes.
- Evitar que las reglas generales de desktop se apliquen de forma demasiado amplia en `1920x1080` y `2160x1440`.

## Ruta del documento

- `docs/frontend-docs/viewport.md`


Jorge entra en google y coloca cual es mi viewport 

te debe salir como la imagen que mande a whatsapp vas a tomar esos valores y los colocaras en los min-width y min-heigth en el breakpoint de 1920x1080