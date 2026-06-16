# Fix: limpieza de warnings y errores de consola

Rama: `limpieza-warns-errores-consola`

Eliminación del ruido de consola (404 de assets, aviso NG0913 y error de SVG)
y del código muerto que referenciaba imágenes inexistentes.

## Problemas y soluciones

### 1. 404 masivos + "Failed to load image"
La lista de `preloadAssets()` en `src/app/home/home.page.ts` estaba obsoleta:
casi ninguna ruta existía en disco (animales del zodíaco, carpetas
`multiplicadores/`, `fichas/`, `botones/`, etc.).

**Fix:** se reconstruyó la lista usando solo assets que existen y se usan
(set `animales-sin-fondo/`, paneles, rueda, SVGs y el video).

### 2. `NG0913` — imagen sobredimensionada (`scorepanel2.png`)
Aviso automático de rendimiento de Angular: el archivo tiene dimensiones
intrínsecas mucho mayores que su tamaño renderizado (fondo decorativo).

**Fix:** `IMAGE_CONFIG` con `disableImageSizeWarning: true` en `src/main.ts`.

### 3. `<rect> attribute height: A negative value` (porthole-water)
Con el agua llena, `surfaceY - (cy - R)` daba ~`-2.8e-14` (negativo por
punto flotante), que SVG rechaza.

**Fix:** se clampa la altura del rect de aire a `>= 0` en
`porthole-water.component.ts` (`airRectH = Math.max(0, ...)`)

### 4. Código muerto con referencias a imágenes inexistentes
- Borrado `porthole-water.component.old.ts` (backup sin uso).
- `frameSrc` por defecto deja de apuntar a `assets/porthole.png`
  (siempre se pasa `centrorueda.png` desde `wheel-container`); default vacío.
- `reveal.service` `basePath` y ejemplos de doc → carpeta real
  `assets/images/animales-sin-fondo/` en vez de `assets/animals/` inexistente.

## Verificación
- `grep` confirma **0 referencias a imágenes inexistentes** en `src/`.
- `ng build` compila sin errores.

## Archivos tocados
- `src/app/home/home.page.ts`
- `src/main.ts`
- `src/app/components/porthole-water/porthole-water.component.ts`
- `src/app/components/porthole-water/porthole-water.component.old.ts` (borrado)
- `src/app/components/results-animation/reveal.service.ts`
- `src/app/components/results-animation/reveal-overlay.component.ts`
- `src/app/components/results-animation/README.md`
