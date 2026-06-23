# Breakpoints Responsive — Todos los dispositivos

## Contexto

El cliente ejecuta la app desde una PC conectada a un TV de 32" o más por HDMI, con Chrome en modo fullscreen (`F11`). En ese modo el viewport CSS = resolución del TV ajustada por el scaling de Windows.

El archivo de estilos es `src/theme/responsive-variables.scss`.

---

## Breakpoints implementados

### Teléfonos en horizontal (landscape)

| Nombre | Viewport CSS | Media query activo | DevTools |
|---|---|---|---|
| `PHONE-LANDSCAPE-S` | 617-720 × max 430px | `min: 617 / max: 720 — max-h: 430 — landscape` | `667 x 375` |
| `PHONE-LANDSCAPE-M` | 721-900 × max 430px | `min: 721 / max: 900 — max-h: 430 — landscape` | `812 x 375` |
| `PHONE-LANDSCAPE-L` | 901-990 × max 460px | `min: 901 / max: 990 — max-h: 460 — landscape` | `932 x 430` |

```
iPhone SE / 8 landscape   → 667×375   → PHONE-LANDSCAPE-S
iPhone X/11/12/13 land.   → 812×375   → PHONE-LANDSCAPE-M
iPhone 14 landscape       → 844×390   → PHONE-LANDSCAPE-M
iPhone Pro Max landscape  → 932×430   → PHONE-LANDSCAPE-L
Samsung Galaxy landscape  → 740×360   → PHONE-LANDSCAPE-M
```

> Los teléfonos en landscape tienen altura muy reducida (360-430px). Los valores de esta sección son un punto de partida — requieren ajuste fino con el cliente.

---

### Monitores pequeños

| Nombre | Viewport CSS | Media query activo | DevTools |
|---|---|---|---|
| `MONITOR-1280` | 1280×720 o 1280×800 | `min: 1230 / max: 1315 — min-h: 665 / max-h: 850` | `1280 x 720` / `1280 x 800` |

```
Monitor HD-ready 1280×720   → Windows 100%  → 1280×720   → MONITOR-1280
Monitor WXGA 1280×800       → Windows 100%  → 1280×800   → MONITOR-1280
```

---

### TVs por HDMI

| Nombre | Viewport CSS | Media query activo | DevTools |
|---|---|---|---|
| `TV-HD` | 1366×768 | `min: 1316 / max: 1416 — min-h: 718 / max-h: 818` | `1366 x 768` |
| `TV-FHD-125` | 1536×864 | `min: 1486 / max: 1586 — min-h: 814 / max-h: 914` | `1536 x 864` |
| `TV-FHD` | 1920×1080 | `min: 1870 / max: 1970 — min-h: 895 / max-h: 1130` | `1920 x 1080` |
| `TV-QHD` | 2560×1440 | `min: 2460 / max: 2610 — min-h: 1257 / max-h: 1490` | `2560 x 1440` |
| `TV-QHD-PORTRAIT` | 2560×+ portrait | `min: 2460 — orientation: portrait` | `2560+ portrait` |
| `TV-4K` | 3840×2160 | `min: 3780 / max: 3890 — min-h: 2100 / max-h: 2210` | `3840 x 2160` |

```
TV 32" HD (720p)          → Windows 100%  → 1366×768   → TV-HD
TV 32"+ Full HD (1080p)   → Windows 125%  → 1536×864   → TV-FHD-125
TV 32"+ Full HD (1080p)   → Windows 100%  → 1920×1080  → TV-FHD
TV 4K                     → Windows 150%  → 2560×1440  → TV-QHD  ← más común en 4K
TV 4K                     → Windows 100%  → 3840×2160  → TV-4K
```

> Windows aplica 150% de scaling por defecto en TVs 4K, por eso `TV-QHD` es el caso más frecuente en esos equipos.

---

## Gaps entre breakpoints TV (sin overlap)

| Entre | Gap ancho |
|---|---|
| MONITOR-1280 → TV-HD | 1315 → 1316 (1px, continuo) |
| TV-HD → TV-FHD-125 | 1416 → 1486 (70px gap) |
| TV-FHD-125 → TV-FHD | 1586 → 1870 (284px gap) |
| TV-FHD → TV-QHD | 1970 → 2460 (490px gap) |
| TV-QHD → TV-4K | 2610 → 3780 (1170px gap) |

---

## Cómo probar en PC sin el TV

1. Abrir Chrome → `F12` → `Ctrl+Shift+M` (modo responsive)
2. Escribir las dimensiones del viewport en los campos de ancho y alto
3. Para landscape en teléfono: usar el ícono de rotación en DevTools
4. Verificar que el breakpoint correcto se activa inspeccionando las CSS variables en DevTools

> Los rangos son ±50px alrededor del viewport objetivo para tolerar variaciones menores de scaling sin que el breakpoint deje de activarse.
