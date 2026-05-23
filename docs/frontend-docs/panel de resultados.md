# Panel de resultados

## Cambios realizados en esta sesión

### Archivos modificados
- `src/app/home/home.page.html`
- `src/app/home/home.page.css`

### Descripción
Se añadió un nuevo panel visual fijo en el lado derecho de la pantalla del home para mostrar resultados futuros.

### Detalles del cambio
- En `home.page.html` se agregó el bloque HTML:
  - `div.right-results-panel`
  - `img.right-results-panel-background`
  - `div.right-results-panel-content`
- El panel muestra un placeholder con un texto de acompañamiento:
  - Título: "Resultados"
  - Texto: "Próximamente aquí se mostrarán los resultados disponibles."

### Estilos aplicados
- `right-results-panel`:
  - Posición `fixed` en la esquina superior derecha.
  - Ancho responsivo con `width: min(700px, 90vw)` y `max-width: 800px`.
  - `overflow: visible` para evitar recortes del PNG.
  - `border-radius` para un borde redondeado.
- `right-results-panel-background`:
  - Imagen responsiva con `width: 100%` y `object-fit: contain`.
  - Centrado con `object-position: center`.
- `right-results-panel-content`:
  - `position: absolute` con `inset: 0` para superponer el contenido dentro del panel.
  - Fondo semitransparente y texto centrado.

### Notas
- El panel está oculto en pantallas pequeñas mediante la regla del diseño responsivo.
- El contenido del panel ya está contenido dentro del propio panel derecho y no debe cortarse.

### Actualización de la sesión actual
- Se expusieron variables CSS para `right-results-panel` en `src/app/home/home.page.css`.
- Se agregó la configuración base de variables en `src/theme/responsive-variables.scss` para permitir la manipulación del panel desde cualquier breakpoint.
- Variables añadidas incluyen control de:
  - `display`, `pointer-events`, `overflow`, `opacity`
  - ancho/alto/fit/posición del fondo del panel
  - layout del contenido (`display`, `flex-direction`, `justify-content`, `align-items`, `gap`)
  - colores de texto de `h3` y `p`
- Se cambió la regla móvil de `display: none` fija por `--right-panel-mobile-display`, de modo que el ocultado también sea configurable por breakpoint.
