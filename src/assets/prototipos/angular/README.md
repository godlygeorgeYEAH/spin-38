# Sun Rays — componente Ionic / Angular

Animación de rayos de sol anclados al sol del fondo, sin breakpoints.

## Archivos
- `sun-rays.component.ts`
- `sun-rays.component.html`
- `sun-rays.component.scss`
- + tu imagen `fondo.png`

## Instalación
1. Copia los tres archivos `sun-rays.component.*` a `src/app/sun-rays/`.
2. Copia la imagen a `src/assets/fondo.png` (el SCSS la referencia como `/assets/fondo.png`).
3. Úsalo detrás de tu contenido:

```html
<ion-content>
  <app-sun-rays></app-sun-rays>
  <!-- tu UI aquí -->
</ion-content>
```

Por ser standalone, impórtalo en el componente que lo use:

```ts
import { SunRaysComponent } from './sun-rays/sun-rays.component';

@Component({
  // ...
  imports: [SunRaysComponent],
})
```

## Ajustes (en el SCSS)
- **Velocidad de giro:** `99s` en `.sr-beams`, `168s` en `.sr-diffuse`. Más alto = más lento.
- **Sentido:** `rotate(360deg)` = horario; cambia a `-360deg` para antihorario.
- **Intensidad de haces:** `opacity` en `.sr-beams` (0–1).
- **Intensidad del brillo:** `opacity` en `.sr-diffuse` y `.sr-breath`.
- **Alcance de los rayos:** `--reach` en `.sr-rot`.
- **Posición del sol:** `left`/`top` en `.sr-anchor` (% sobre la imagen).

## Por qué no usa breakpoints
El `.sr-stage` replica `background-size: cover` con unidades de container-query
(`100cqw` / `100cqh`) y la proporción del PNG (4096/2496). Los rayos son hijos
posicionados en % de ese stage, así que se anclan al sol y escalan solos en
cualquier viewport.
