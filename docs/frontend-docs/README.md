# Frontend Docs

## Cambios del día 17 de mayo de 2026

### 1. Logo en esquina superior izquierda
- Se agregó el bloque HTML del logo en `src/app/home/home.page.html`.
- La ruta usada actualmente es `assets/images/logo/logo1.png`.

### 2. Posicionamiento granular del logo
- En `src/app/home/home.page.css` se definió `logo-container` como `position: fixed`.
- Se añadieron variables CSS para ajuste fino:
  - `--logo-top`
  - `--logo-left`
  - `--logo-translate-x`
  - `--logo-translate-y`
- Esto permite mover el logo con precisión sin cambiar la estructura HTML.

### 3. Estado actual del CSS del logo
- El logo ahora usa `transform: translate(var(--logo-translate-x, 0), var(--logo-translate-y, 0))`.
- El tamaño del logo se controla con `--logo-size`.

### 4. Notas adicionales
- El archivo `src/app/home/home.page.css` contiene actualmente el estilo del `logo-container`.
- El contenido de `docs/frontend-docs` está pensado para llevar un registro simple y directo de los cambios de frontend hechos hoy.
