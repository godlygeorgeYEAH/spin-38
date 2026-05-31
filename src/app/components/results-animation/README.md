# Animación "Resultado Dupla" — Guía de implementación (Ionic / Angular)

Overlay que **oscurece + desenfoca** la pantalla, hace entrar **dos imágenes**
(centro-izquierda / centro-derecha) y un **texto grande delineado**, los mantiene
visibles, y al terminar hace **converger todo al centro encogiéndolo** mientras la
pantalla se aclara y el blur se disipa.

Las rutas de las imágenes son **dinámicas** (assets, CDN, backend o filesystem de
Capacitor). Solo se reproducen 2 imágenes por animación, elegidas de un pool de X.

---

## 1. Archivos del paquete

| Archivo | Rol |
|---|---|
| `reveal.service.ts` | Dispara la animación, resuelve rutas dinámicas y administra el pool. |
| `reveal-overlay.component.ts` | Componente standalone del overlay (máquina de fases). |
| `reveal-overlay.component.scss` | Estilos y transiciones (duraciones inyectadas como CSS vars). |

Cópialos a, por ejemplo, `src/app/reveal/`.

---

## 2. Instalación

### 2.1 Requisitos
- Ionic 6/7 con Angular **standalone components** (Angular 15+).
- Una fuente display para el texto delineado (el SCSS usa **Archivo Black**).

### 2.2 Cargar la fuente
En `src/index.html` dentro de `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap" rel="stylesheet" />
```

> Si tu app ya tiene una fuente display propia, cambia `font-family` en
> `reveal-overlay.component.scss` (selector `.reveal-text`) y omite este paso.

### 2.3 Montar el overlay UNA sola vez (en la raíz)
Para que quede por encima de todas las páginas, móntalo en `app.component`.

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

> ¿App con NgModules en vez de standalone? Declara `RevealOverlayComponent` en el
> módulo raíz (o impórtalo si lo conviertes a standalone) y úsalo igual en
> `app.component.html`.

---

## 3. Rutas de imágenes dinámicas

El servicio resuelve cada `leftImage` / `rightImage` con el método `resolve()`:

1. Si el valor es una **URL absoluta** (`http:`, `https:`, `data:`, `blob:`,
   `file:`, `//…`) o empieza por `/`, se usa **tal cual**.
2. Si no, se concatena con **`basePath`** (configurable en runtime).

```ts
// Cambiar la base en cualquier momento:
this.reveal.basePath = 'assets/animals/';                 // assets locales
this.reveal.basePath = 'https://cdn.misitio.com/animals/'; // CDN
```

Ejemplos de lo que puedes pasar a `play`:

```ts
leftImage: 'zorro.png'                               // -> basePath + 'zorro.png'
leftImage: 'https://cdn.misitio.com/a/oso.png'       // -> tal cual
leftImage: Capacitor.convertFileSrc(localUri)        // -> tal cual (filesystem)
```

### 3.1 Cargar el pool desde el backend
```ts
this.http.get<string[]>('/api/animals').subscribe(filenames => {
  this.reveal.pool = filenames;     // filenames o URLs
});
```

---

## 4. API

```ts
interface RevealConfig {
  leftImage: string;    // filename o URL (se resuelve dinámicamente)
  rightImage: string;   // filename o URL
  text: string;         // texto delineado a dibujar
  enterMs?: number;     // fase de entrada   (def. 2500)
  holdMs?: number;      // fase "showing"    (def. 10000)
  exitMs?: number;      // fase de salida    (def. 2500)
  shrinkScale?: number; // escala final 0–1  (def. 0.1 = 10%)
  textY?: number;       // posición vertical del texto en vh (def. 0 = centrado)
  bursts?: number;      // nº de TEXTOS por ola en la secuencia hype (def. 7)
  waves?: number;       // nº de RÁFAGAS (veces que se reproduce cada lado, def. 2)
  hype?: boolean;       // fuerza la secuencia hype (auto si text === 'MOROCHA')
}
```

Métodos del `RevealService`:

| Método | Descripción |
|---|---|
| `play(config): Promise<void>` | Reproduce con 2 imágenes y un texto. La promesa **resuelve al terminar**. |
| `playRandomFromPool(text, opts?): Promise<void>` | Elige 2 imágenes distintas del pool y reproduce. |
| `resolve(src): string` | Resuelve un filename/URL a ruta usable por `<img>`. |
| `done$: Observable<RevealConfig>` | Emite cada vez que una animación termina. |
| `basePath: string` | Base para resolver filenames relativos. |
| `pool: string[]` | Pool de X imágenes (filenames o URLs). |

---

## 5. Uso

### 5.1 Con dos imágenes concretas
```ts
import { Component } from '@angular/core';
import { RevealService } from '../reveal/reveal.service';

@Component({ /* … */ })
export class GamePage {
  constructor(private reveal: RevealService) {}

  async onSpinResult(a: string, b: string, etiqueta: string) {
    await this.reveal.play({
      leftImage: a,          // p.ej. 'animal_03.png' o una URL
      rightImage: b,
      text: etiqueta,        // p.ej. 'MOROCHA'
    });
    // aquí ya terminó la animación
    this.continuarFlujo();
  }
}
```

### 5.2 Dejando que el servicio elija del pool
```ts
this.reveal.playRandomFromPool('MOROCHA');

// con overrides puntuales:
this.reveal.playRandomFromPool('JACKPOT', {
  holdMs: 4000,
  shrinkScale: 0.2,
  textY: 0,        // texto centrado en esta animación
});
```

### 5.3 Reaccionar al fin de la animación (sin await)
```ts
this.reveal.done$.subscribe(cfg => {
  console.log('Terminó la animación de', cfg.text);
});
```

---

## 6. Modelo de fases y timing

```
 idle ─▶ in ──────▶ hold ────────▶ shrink ───────▶ clear ─▶ done
        entrada     showing         salida (encoge)  salida (aclara)
        enterMs      holdMs          ── exitMs ──────────────
```

- **entrada (`enterMs`)** — el backdrop oscurece + desenfoca; las imágenes entran
  desde ±62vw a su reposo (±118px del centro); el texto entra desde la izquierda
  hasta su posición (`textY`).
- **showing (`holdMs`)** — todo permanece visible en reposo.
- **salida (`exitMs`)** — se divide internamente: ~58% **encoger** (imágenes y
  texto convergen al centro exacto y se reducen a `shrinkScale`) + ~42% **aclarar**
  (el backdrop se aclara, el blur se disipa y todo se desvanece).

La velocidad de cada fase es independiente: puedes alargar el "showing" sin que la
entrada se sienta lenta. Las duraciones y la escala se inyectan como CSS custom
properties (`--reveal-enter`, `--reveal-shrink`, `--reveal-clear`,
`--reveal-img-shrink`, `--reveal-text-shrink`, `--reveal-text-y`).

### 6.1 Modo "hype" del texto (MOROCHA)
Cuando `text === 'MOROCHA'` (o pasas `hype: true` en cualquier texto), el texto NO
entra como una sola pieza: se reproduce una secuencia más llamativa, toda dentro de
la fase de **entrada** (`enterMs`):

1. **Ráfaga horizontal** — varios textos cruzan la pantalla de izquierda a derecha,
   escalonados (primeros ~50% de `enterMs`).
2. **Parpadeos verticales** — el texto aparece y desaparece rápido, uno a uno, de
   arriba hacia abajo (cada uno termina antes de que aparezca el siguiente).
2.b La cadencia **desacelera** (cada parpadeo dura un poco más) para no cortar en seco.
3. **Aterrizaje final** — un texto final **aterriza centrado** (a `textY`, escalando
   desde un poco más grande) y permanece en el medio hasta que la escena se aclara.

Para activarlo en otros textos:
```ts
this.reveal.play({ leftImage, rightImage, text: 'BONUS', hype: true });
```
Para desactivarlo aunque el texto sea MOROCHA: `hype: false`.

Dos controles afinan la intensidad:
- `bursts` — cuántos **textos** aparecen por ola de cada lado (densidad).
- `waves`  — cuántas **ráfagas** (veces que se reproduce cada lado).
```ts
this.reveal.play({ leftImage, rightImage, text: 'MOROCHA', bursts: 8, waves: 3 });
```
El texto final **aterriza centrado** (escala desde un poco más grande) y se mantiene
en el medio hasta que la escena se aclara.

---

## 7. Personalización rápida (SCSS)

| Quiero cambiar… | Dónde |
|---|---|
| Tamaño de los círculos | `.char-ring { width: clamp(...) }` |
| Color del anillo izq./der. | `.ring-left` / `.ring-right` (`background` + `box-shadow`) |
| Grosor/color del trazo del texto | `.reveal-text { -webkit-text-stroke: … }` |
| Intensidad del blur | `.reveal-backdrop { backdrop-filter: blur(9px) }` |
| Oscurecimiento del fondo | `.reveal-backdrop { background: oklch(… / 0.55) }` |
| Distancia de reposo de los círculos | variable SCSS `$rest` (def. `118px`) |
| Easings | variables SCSS `$ease-in` / `$ease-out` |

Las imágenes se pintan con `object-fit: cover` dentro de un círculo. Si tus
personajes vienen **ya recortados con transparencia**, puedes quitar el
`overflow:hidden`/`border-radius` de `.char-fill` para que sobresalgan del anillo.

---

## 8. Notas

- El overlay usa `pointer-events: none`, así que **no bloquea** toques al juego de
  abajo. Si quieres bloquear interacción durante la animación, cambia a
  `pointer-events: auto` en `.reveal-root`.
- `z-index: 9999` para quedar sobre el contenido de Ionic. Súbelo si tienes modales
  con z-index mayor.
- Los timers corren **fuera de la zona de Angular** (`runOutsideAngular`) y solo
  re-entran para cambiar de fase, para no disparar detección de cambios de más.
- El componente es `OnPush`: no necesita nada del exterior salvo el servicio.

---

## 9. Equivalencia con el prototipo HTML

El prototipo (`Animacion Resultado Dupla.html`) y este componente comparten el
mismo modelo de fases, offsets de reposo (±118px), easings y proporciones, para que
el *feel* sea idéntico. Diferencias:

- En el prototipo se dibujan placeholders rayados con el filename; aquí
  `<img [src]="resolve(...)">` carga el personaje real.
- El prototipo expone sliders (entrada / showing / salida / reducción / posición
  vertical del texto) que se corresponden 1:1 con `enterMs` / `holdMs` / `exitMs` /
  `shrinkScale` / `textY`.
