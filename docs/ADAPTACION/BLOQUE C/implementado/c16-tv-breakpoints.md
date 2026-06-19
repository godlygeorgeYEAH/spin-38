# TV Breakpoints — PC conectada a TV por HDMI

## Contexto

El cliente ejecuta la app desde una PC conectada a un TV de 32" o más por HDMI, con Chrome en modo fullscreen (`F11`). En ese modo el viewport CSS = resolución del TV ajustada por el scaling de Windows.

El archivo de estilos es `src/theme/responsive-variables.scss`.

---

## Breakpoints implementados

| Nombre | Viewport CSS | Media query activo | DevTools |
|---|---|---|---|
| `TV-HD` | 1366×768 | `min: 1356 / max: 1366 — min-h: 758 / max-h: 768` | `1366 x 768` |
| `TV-FHD-125` | 1536×864 | `min: 1526 / max: 1536 — min-h: 854 / max-h: 864` | `1536 x 864` |
| `TV-FHD` | 1920×1080 | `min: 1910 / max: 1920 — min-h: 945 / max-h: 1080` | `1920 x 1080` |
| `TV-QHD` | 2560×1440 | `min: 2510 / max: 2560 — min-h: 1307 / max-h: 1440` | `2560 x 1440` |
| `TV-QHD-PORTRAIT` | 2560×+ portrait | `min: 2510 — orientation: portrait` | `2560+ portrait` |
| `TV-4K` | 3840×2160 | `min: 3830 / max: 3840 — min-h: 2150 / max-h: 2160` | `3840 x 2160` |

---

## Cuándo se activa cada uno

```
TV 32" HD (720p)          → Windows 100%  → 1366×768   → TV-HD
TV 32"+ Full HD (1080p)   → Windows 125%  → 1536×864   → TV-FHD-125
TV 32"+ Full HD (1080p)   → Windows 100%  → 1920×1080  → TV-FHD
TV 4K                     → Windows 150%  → 2560×1440  → TV-QHD  ← más común en 4K
TV 4K                     → Windows 100%  → 3840×2160  → TV-4K
```

> Windows aplica 150% de scaling por defecto en TVs 4K, por eso `TV-QHD` es el caso más frecuente en esos equipos.

---

## Cómo probar en PC sin el TV

1. Abrir Chrome → `F12` → `Ctrl+Shift+M` (modo responsive)
2. Escribir las dimensiones del viewport en los campos de ancho y alto
3. Verificar que el breakpoint correcto se activa inspeccionando las CSS variables en DevTools

> Los valores de cada breakpoint son proporcionales al de `TV-FHD` (1920×1080) y se ajustan durante las pruebas con el cliente.
