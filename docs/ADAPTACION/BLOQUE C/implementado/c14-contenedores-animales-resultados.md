# C14 — Contenedores decorativos de animales en animación de resultado

## Requerimiento

Añadir imágenes decorativas PNG detrás de cada círculo de animal en la animación de resultado:

- `rueda-resultado-izquierda.png` → detrás del círculo del animal de la **rueda externa** (`.reveal-img.left`)
- `rueda-resultado-derecha.png` → detrás del círculo del animal de la **rueda interna** (`.reveal-img.right`)

Las imágenes deben ser controlables en tamaño y posición por breakpoint, siguiendo el mismo patrón que el resto de elementos responsivos del proyecto: **variables base en `variables.scss` + overrides por breakpoint en `responsive-variables.scss`**.

## Archivos involucrados

| Archivo | Rol |
|---|---|
| `src/assets/images/contenedores/rueda-resultado-izquierda.png` | Asset decorativo izquierdo |
| `src/assets/images/contenedores/rueda-resultado-derecha.png` | Asset decorativo derecho |
| `src/theme/variables.scss` | Valores base de las CSS custom properties |
| `src/theme/responsive-variables.scss` | Overrides por breakpoint |
| `src/app/components/results-animation/reveal-overlay.component.ts` | Template HTML |
| `src/app/components/results-animation/reveal-overlay.component.scss` | Estilos del componente |

## Implementación

### 1. CSS custom properties — `variables.scss`

```scss
// Resultado izquierda
--resultado-izq-size: clamp(220px, 52vmin, 360px);
--resultado-izq-offset-x: 0px;
--resultado-izq-offset-y: 0px;

// Resultado derecha
--resultado-der-size: clamp(220px, 52vmin, 360px);
--resultado-der-offset-x: 0px;
--resultado-der-offset-y: 0px;
```

### 2. Overrides por breakpoint — `responsive-variables.scss`

Se añade una sección `=== RESULTADO IZQUIERDA ===` y `=== RESULTADO DERECHA ===` en cada breakpoint activo:

```scss
/* === RESULTADO IZQUIERDA === */
--resultado-izq-size: 280px;
--resultado-izq-offset-x: 0px;
--resultado-izq-offset-y: -2.8vh;

/* === RESULTADO DERECHA === */
--resultado-der-size: 280px;
--resultado-der-offset-x: 0px;
--resultado-der-offset-y: -2.8vh;
```

Breakpoints activos cubiertos:
- `(min-width: 1910px) and (max-width: 1920px)` — Desktop 1920
- `(min-width: 2510px) and (max-width: 2560px)` — Large Desktop 2K
- `(min-width: 2510px) and (orientation: portrait)` — Large Desktop portrait

### 3. Template — `reveal-overlay.component.ts`

Las imágenes se insertan como **primer hijo** de cada `.reveal-img`, antes del `.char-ring`, para quedar detrás por orden DOM:

```html
<!-- Imagen izquierda -->
<div class="reveal-img left" ...>
  <img class="resultado-izq-bg"
       src="assets/images/contenedores/rueda-resultado-izquierda.png"
       aria-hidden="true" />
  <div class="char-ring ring-left">...</div>
  <span class="char-name">...</span>
</div>

<!-- Imagen derecha -->
<div class="reveal-img right" ...>
  <img class="resultado-der-bg"
       src="assets/images/contenedores/rueda-resultado-derecha.png"
       aria-hidden="true" />
  <div class="char-ring ring-right">...</div>
  <span class="char-name">...</span>
</div>
```

### 4. Estilos — `reveal-overlay.component.scss`

```scss
.resultado-izq-bg,
.resultado-der-bg {
  position: absolute;
  left: 50%;
  top: 50%;
  height: auto;
  max-width: none;   // anula img { max-width: 100% } de Ionic
  pointer-events: none;
  user-select: none;
}

.resultado-izq-bg {
  width: var(--resultado-izq-size);
  transform: translate(
    calc(-50% + var(--resultado-izq-offset-x)),
    calc(-50% + var(--resultado-izq-offset-y))
  );
}

.resultado-der-bg {
  width: var(--resultado-der-size);
  transform: translate(
    calc(-50% + var(--resultado-der-offset-x)),
    calc(-50% + var(--resultado-der-offset-y))
  );
}
```

**Nota:** `max-width: none` es necesario porque Ionic inyecta globalmente `img { max-width: 100% }`. Sin este override, la imagen queda truncada al ancho del `.char-ring` (~150-230px) independientemente del valor de `--resultado-izq-size`.

El `.char-ring` tiene `position: relative` para apilarse correctamente sobre la imagen decorativa dentro del mismo contexto de apilamiento.

### 5. Contexto de apilamiento — `reveal-overlay.component.scss`

`.reveal-stage` tiene `z-index: 1` e `isolation: isolate` para garantizar que todo su contenido se componga por encima del `backdrop-filter` del overlay oscuro (`.reveal-backdrop`), evitando que el oscurecimiento de pantalla afecte a los contenedores decorativos.

## Lo que NO cambia

- La lógica de animación (fases, timings, hype).
- Los colores de los anillos (`--ring-left-color`, `--ring-right-color`).
- El comportamiento del círculo contenedor (`.char-ring`, `.char-fill`).
- Los nombres de animales (`.char-name`).

## Estado

Implementado.
