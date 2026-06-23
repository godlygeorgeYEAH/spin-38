# Animación "Resultado Spin" — Guía de implementación (Ionic / Angular)

Overlay que **oscurece + desenfoca** la pantalla, despliega **dos franjas
diagonales** detrás de los anillos, hace entrar **dos imágenes** en círculo con
anillo de color y un **texto** (azul neón normal, o secuencia **DUPLA** dorada con
ráfagas + parpadeos), y al terminar **repliega las franjas primero** y luego hace
converger texto + imágenes al centro mientras la pantalla se aclara.

Es el calco 1:1 del prototipo `Reveal Prototipo.html`.

---

## 1. Archivos

| Archivo | Rol |
|---|---|
| `reveal.service.ts` | Dispara la animación, resuelve rutas de imágenes, defaults. |
| `reveal-overlay.component.ts` | Componente standalone del overlay (máquina de fases + franjas). |
| `reveal-overlay.component.scss` | Estilos, keyframes (neón, glow, hype, franjas). |

Cópialos a, por ejemplo, `src/app/reveal/`.

---

## 2. Instalación

### 2.1 Fuente Titan One
El texto usa **Titan One**. En `src/index.html` dentro de `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Titan+One&display=swap" rel="stylesheet" />
```

### 2.2 Imágenes (assets)
Coloca tus PNG bajo `src/assets/` y ajusta las rutas en el servicio si difieren:

```
src/assets/images/animales-sin-fondo/DELFIN.png, ZORRO.png, ...
src/assets/images/contenedores/rueda-resultado-izquierda.png
src/assets/images/contenedores/rueda-resultado-derecha.png
```

> En el prototipo las rutas eran `../images/...`. En Angular el estándar es
> `assets/images/...`. Cambia `animalsBasePath`, `resultadoIzqSrc` y
> `resultadoDerSrc` del servicio si usas otra ubicación o un CDN.

### 2.3 Montar el overlay UNA sola vez (en la raíz)
`app.component.html`:
```html
<ion-app>
  <ion-router-outlet></ion-router-outlet>
  <app-reveal-overlay></app-reveal-overlay>   <!-- siempre presente -->
</ion-app>
```

`app.component.ts` (standalone):
```ts
import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { RevealOverlayComponent } from './reveal/reveal-overlay.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, RevealOverlayComponent],
  templateUrl: 'app.component.html',
})
export class AppComponent {}
```

---

## 3. API

```ts
interface RevealConfig {
  leftImage: string;        // filename o URL (p.ej. 'DELFIN.png')
  rightImage: string;       // filename o URL (p.ej. 'ZORRO.png')
  text: string;             // texto a dibujar (p.ej. 'DUPLA')
  leftThemeColor?: string;  // color anillo/franja izq.  (def. '#128DFC')
  rightThemeColor?: string; // color anillo/franja der.  (def. '#FFE28F')
  leftName?: string;        // etiqueta bajo el círculo izq. (opcional)
  rightName?: string;       // etiqueta bajo el círculo der. (opcional)
  enterMs?: number;         // entrada (def. 2500)
  holdMs?: number;          // espera  (def. 5000)
  exitMs?: number;          // salida  (def. 2500)
  shrinkScale?: number;     // escala final 0–1 (def. 0.1)
  textY?: number;           // posición vertical del texto en vh (def. 30)
  bursts?: number;          // textos por ola en DUPLA (def. 3)
  waves?: number;           // ráfagas / veces por lado en DUPLA (def. 5)
  hype?: boolean;           // true=DUPLA dorado, false=normal azul.
                            // Si se omite: auto cuando text === 'DUPLA'.
}
```

Métodos del `RevealService`:

| Método | Descripción |
|---|---|
| `play(config): Promise<void>` | Reproduce. La promesa resuelve al terminar. |
| `playNormal(config): Promise<void>` | Atajo, fuerza `hype:false` (texto azul). |
| `playHype(config): Promise<void>` | Atajo, fuerza `hype:true` (DUPLA dorado). |
| `resolveAnimal(src): string` | Resuelve filename/URL a ruta de `<img>`. |
| `done$: Observable<RevealConfig>` | Emite al terminar cada animación. |
| `animalsBasePath: string` | Base para resolver filenames de animal. |
| `resultadoIzqSrc / resultadoDerSrc` | Imágenes decorativas de rueda. |

---

## 4. Uso

```ts
import { Component } from '@angular/core';
import { RevealService } from '../reveal/reveal.service';

@Component({ /* … */ })
export class GamePage {
  constructor(private reveal: RevealService) {}

  // Texto normal (azul neón)
  async resultadoNormal() {
    await this.reveal.playNormal({
      leftImage: 'DELFIN.png',
      rightImage: 'ZORRO.png',
      leftThemeColor: '#128DFC',
      rightThemeColor: '#FFE28F',
      text: 'GANASTE',
      leftName: 'Delfín',
      rightName: 'Zorro',
    });
    this.continuar();
  }

  // Secuencia DUPLA (dorada con ráfagas)
  async resultadoDupla() {
    await this.reveal.playHype({
      leftImage: 'DELFIN.png',
      rightImage: 'ZORRO.png',
      leftThemeColor: '#128DFC',
      rightThemeColor: '#FFE28F',
      text: 'DUPLA',
      bursts: 3,
      waves: 5,
    });
  }
}
```

`play()` decide solo el modo si no pasas `hype`: lo activa cuando `text === 'DUPLA'`.

---

## 5. Modelo de fases y timing

```
 idle → in ───────→ hold ──→ [franjas se repliegan] ──→ shrink ──→ clear → done
        entrada     espera        bandOut                encoge     aclara
        enterMs      holdMs    ≈ exitMs*0.5            ── resto de exitMs ──
```

- **entrada (`enterMs`)** — backdrop oscurece+desenfoca; las franjas diagonales se
  despliegan (izq: arriba→abajo, der: abajo→arriba) detrás de los anillos; las
  imágenes entran desde ±62vw a ±`--char-rest`; el texto entra (azul) o se ejecuta
  la secuencia DUPLA (ráfaga horizontal + parpadeos verticales + aterrizaje final).
- **espera (`holdMs`)** — todo permanece visible; anillos con glow pulsante.
- **salida (`exitMs`)** — **primero** las franjas se repliegan a sus bordes de origen
  (`--reveal-band-out` ≈ mitad de `exitMs`); **luego** texto + imágenes convergen al
  centro a `shrinkScale` y el backdrop se aclara.

Las duraciones, la escala y los colores se inyectan como CSS custom properties en
`.reveal-root` (vía `rootVars` del componente): no necesitas tocar el SCSS para
cambiar tiempos o colores por jugada.

---

## 6. Personalización (SCSS, en `:host`)

| Quiero cambiar… | Variable / selector |
|---|---|
| Tamaño de los círculos | `--char-ring-size` |
| Separación de los círculos | `--char-rest` |
| Tamaño/posición de la rueda decorativa | `--resultado-*-size` / `--resultado-*-offset-*` |
| Color del texto normal / glow azul | `.reveal-text` (`color`, `filter`, `-webkit-text-stroke`) |
| Color del texto DUPLA / glow dorado | `.hype-word`, `.hype-final` |
| Ángulo / ancho de las franjas | `.reveal-band.left/right` (`rotate`, `width`) |
| Qué tan oscuras son las franjas | `color-mix(... 52%/68% ..., #000)` en `.reveal-band` |
| Patrón del glow pulsante | `@keyframes ring-glow-pulse` |

---

## 7. Notas

- `pointer-events: none` en `.reveal-root`: no bloquea toques al juego de abajo.
  Cámbialo a `auto` si quieres bloquear interacción durante la animación.
- `z-index: 9999`; las franjas van en `z-index:0`, el texto en `1`, los círculos
  en `2` (las franjas quedan **detrás** de los anillos).
- Los timers corren fuera de la zona de Angular (`runOutsideAngular`) y solo
  re-entran para refrescar la vista; el componente es `OnPush`.
- Si una imagen de animal no carga, el círculo muestra el **nombre del archivo**
  como fallback (degradación elegante).
- El color de cada franja se deriva automáticamente de su anillo con
  `color-mix(in srgb, var(--ring-*-color) 60%, #000)` — siempre una versión más
  oscura, sin lógica extra en TS.
