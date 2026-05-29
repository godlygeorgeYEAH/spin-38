# 🦉 Búho GIF — Animación Aleatoria

El búho del widget de reloj siempre está visible como una imagen estática (frame 0 del GIF capturado en canvas). Cada 15–30 segundos aleatorios, la animación se dispara: el GIF se recarga y reproduce desde el inicio. Al terminar vuelve automáticamente al estado congelado.

---

## 📦 Archivos involucrados

| Archivo | Qué se modificó |
|---|---|
| `src/assets/images/contenedores/buho.gif` | Asset del búho animado (7 frames, loop infinito) |
| `src/app/home/home.page.html` | Canvas + img superpuestos dentro de `.clock-widget` |
| `src/app/home/home.page.css` | Clase `.buho-gif` con variables CSS de posición y tamaño |
| `src/app/home/home.page.ts` | Lógica de canvas, timer aleatorio y control de animación |
| `src/theme/responsive-variables.scss` | Variables `--buho-width`, `--buho-top`, `--buho-left` en los 9 breakpoints |

---

## ⚙️ Cómo funciona

### El problema con GIFs
Los GIFs con loop infinito no se pueden pausar con CSS ni con JS directamente. Cambiar el `src` sin cache-buster no reinicia la animación.

### Solución: Canvas + `<img>` superpuestos

Dos elementos apilados dentro de `.clock-widget`:

```html
<!-- Frame 0 capturado en canvas — siempre visible -->
<canvas #owlCanvas class="buho-gif"></canvas>

<!-- GIF animado — opacity 0 por defecto, 1 durante la animación -->
<img class="buho-gif" [src]="owlGifSrc" [style.opacity]="owlAnimating ? '1' : '0'" alt="" aria-hidden="true">
```

- **Canvas**: al iniciar el componente, se carga el GIF en un `Image` oculto y se dibuja el primer frame en el canvas. Siempre visible.
- **`<img>`**: siempre en el DOM (evita recargas innecesarias), con `opacity: 0` cuando no está animando.
- **Trigger**: al activarse, el `src` del img recibe un cache-buster (`?t=timestamp`) para forzar reload desde frame 0, y `opacity` pasa a `1`.
- **Fin**: después de `OWL_DURATION_MS` ms, `opacity` vuelve a `0` y se agenda el siguiente ciclo.

---

## 🛠️ Modo desarrollo (posicionamiento del asset)

En `src/app/home/home.page.ts` existe una flag para facilitar el ajuste visual del búho:

```ts
private readonly OWL_DEV_MODE = false;
```

| Valor | Comportamiento |
|---|---|
| `false` | Modo normal: frame estático en canvas + disparo aleatorio cada 5–15s |
| `true` | Modo dev: GIF siempre visible y animando en loop, sin canvas ni timer |

Con `OWL_DEV_MODE = true`:
- `owlAnimating` se fija a `true` desde `ngOnInit`, por lo que el `<img>` tiene `opacity: 1` permanentemente.
- `captureOwlFirstFrame()` no se ejecuta (canvas queda vacío y oculto bajo el img).
- `scheduleOwlAnimation()` no se llama, no hay timers.

Útil para ajustar `--buho-width`, `--buho-top` y `--buho-left` sin esperar a que se dispare la animación.

---

## 🎛️ Ajuste de duración

En `src/app/home/home.page.ts`:

```ts
private readonly OWL_DURATION_MS = 700; // 7 frames × ~100ms — ajustar según el GIF
```

Si los frames del GIF tienen un delay diferente, multiplicar ese valor × 7 para obtener la duración exacta. Se puede inspeccionar con cualquier editor de GIF (ej. EZGIF).

---

## 📐 Variables responsive

Cada breakpoint de `responsive-variables.scss` tiene su bloque `/* === BUHO GIF === */`:

```scss
/* === BUHO GIF === */
--buho-width: 120px;   /* tamaño del búho */
--buho-top: -120px;    /* posición vertical relativa al clock-widget (negativo = sube) */
--buho-left: 25px;     /* posición horizontal relativa al clock-widget */
```

### Valores por breakpoint

| Breakpoint | `--buho-width` | `--buho-top` | `--buho-left` |
|---|---|---|---|
| Mobile Standard (360–415px) | 80px | -80px | 30px |
| iPhone 12/13/14 (388–393px, 840px+) | 80px | -80px | 30px |
| Samsung S21 (360–363px, 798–803px) | 80px | -80px | 30px |
| Mobile Large (414–599px) | 90px | -90px | 30px |
| iPhone Pro Max (426–432px, 920px+) | 90px | -90px | 30px |
| Tablet (600–1023px) | 100px | -100px | 30px |
| Desktop (1024–1799px) | 120px | -120px | 25px |
| Large Desktop (1800px+) | 200px | -200px | 140px |
| Redmi Note 14 (1216–1224px, 2708–2716px) | 150px | -150px | 75px |

---

## 🧩 CSS

```css
.buho-gif {
  position: absolute;
  width: var(--buho-width, 80px);
  height: auto;
  top: var(--buho-top, -80px);
  left: var(--buho-left, 30px);
  pointer-events: none;
}
```

El canvas y el `<img>` comparten esta clase. El apilamiento ocurre naturalmente por el flujo del DOM (el `<img>` queda sobre el canvas al tener `position: absolute` con el mismo origen).

---

## 🔧 Propiedades y métodos en `HomePage`

```ts
@ViewChild('owlCanvas') owlCanvasRef?: ElementRef<HTMLCanvasElement>;

public owlGifSrc = 'assets/images/contenedores/buho.gif';
public owlAnimating = false;
private owlTimer: any = null;
private readonly OWL_DURATION_MS = 700;
```

| Método | Cuándo se llama | Qué hace |
|---|---|---|
| `captureOwlFirstFrame()` | `ngAfterViewInit` | Dibuja el frame 0 del GIF en el canvas |
| `scheduleOwlAnimation()` | `ngOnInit` y recursivo | Agenda el próximo trigger en 15–30s aleatorio |
| Cleanup en `ngOnDestroy` | Al destruir el componente | Limpia el timeout pendiente |
