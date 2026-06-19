# C7 — Colores de los círculos de animales según tema activo de la rueda

## Problema

Los círculos que encuadran las imágenes de animales en la animación de resultados (`char-ring`) tienen colores hardcodeados en el SCSS:

- `.ring-left` → fondo `#128DFC`, glow `#1A0B79`
- `.ring-right` → fondo `#FFE28F`, glow `#FFE28F`

El proyecto ya tiene un sistema de paletas por tema (`Clasica`, `Caribe`, `Selva`) definido en `wheel-palettes.ts`, con colores distintos para rueda externa e interna. La animación de resultado los ignora completamente: los colores son siempre los mismos independientemente del tema activo.

## Requerimiento

- El **animal izquierdo** (entra desde la izquierda) corresponde a la **rueda externa** y debe mostrar el fondo y glow con el color primario del tema activo de la rueda externa.
- El **animal derecho** (entra desde la derecha) corresponde a la **rueda interna** y debe mostrar el fondo y glow con el color primario del tema activo de la rueda interna.
- El cambio aplica tanto al `background` como al `box-shadow` (glow) de cada `char-ring`.

## Fuente de verdad

`src/app/components/wheel-container/wheel-palettes.ts`

- `ACTIVE_PALETTE` selecciona la paleta activa.
- Cada paleta expone `outerWheelColors` e `innerWheelColors`.
- El color representativo de cada rueda es el `color` del primer stop (`offset: '60%'`) del primer gradiente.

## Implementación sugerida

### 1. Extender `RevealConfig` — `reveal.service.ts`

Añadir dos campos opcionales:

```ts
leftThemeColor?: string;   // color primario rueda externa
rightThemeColor?: string;  // color primario rueda interna
```

### 2. Pasar los colores al llamar a `play()` — `home.page.ts`

```ts
import { WHEEL_PALETTES, ACTIVE_PALETTE } from '...wheel-palettes';

const palette = WHEEL_PALETTES[ACTIVE_PALETTE];
this.reveal.play({
  leftImage: '...',
  rightImage: '...',
  text: 'DUPLA',
  leftThemeColor:  palette.outerWheelColors[0].stops[0].color,
  rightThemeColor: palette.innerWheelColors[0].stops[0].color,
});
```

### 3. Inyectar como CSS custom properties — `reveal-overlay.component.ts`

En `applyVars()`:

```ts
host.style.setProperty('--ring-left-color',  cfg.leftThemeColor  ?? '#128DFC');
host.style.setProperty('--ring-right-color', cfg.rightThemeColor ?? '#FFE28F');
```

### 4. Usar las variables en SCSS — `reveal-overlay.component.scss`

Reemplazar los colores hardcoded en `.ring-left` y `.ring-right`:

```scss
&.ring-left {
  background: var(--ring-left-color);
  box-shadow:
    0 0 0 3px oklch(0.98 0.01 250 / 0.55),
    0 0 28px 4px var(--ring-left-color),
    0 10px 30px oklch(0 0 0 / 0.45);
}
&.ring-right {
  background: var(--ring-right-color);
  box-shadow:
    0 0 0 3px oklch(0.98 0.01 250 / 0.55),
    0 0 28px 4px var(--ring-right-color),
    0 10px 30px oklch(0 0 0 / 0.45);
}
```

## Lo que NO cambia

- La lógica de animación (timings, fases, hype).
- La estructura del `char-ring` y `char-fill`.
- Los colores del texto (`reveal-text`, `hype-word`, `hype-final`).

## Criterios de aceptación

- Con paleta `Clasica` activa: animal izquierdo muestra tono azul `#2097FC`, animal derecho muestra tono dorado `#FFD890`.
- Con paleta `Selva` activa: animal derecho muestra tono verde `#1EC468`.
- Si `leftThemeColor` / `rightThemeColor` no se pasan, los colores por defecto son los actuales (sin regresión).
- No hay regresiones en la animación de entrada ni salida.

## Estado

Implementado.
