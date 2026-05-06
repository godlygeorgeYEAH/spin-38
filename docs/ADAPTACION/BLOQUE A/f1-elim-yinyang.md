# F1 — Eliminar yin-yang central y botón GIRAR

## Requisito
Eliminar el yin-yang central con el botón GIRAR y sus ondas de pulso. La ruleta es un display pasivo; el giro se inicia exclusivamente desde el servidor.

## Estado

Implementado

### Notas de Implementación

#### `wheel-container.component.ts`
- Eliminado `@Input() canSpinFromParent: boolean = false`.
- Eliminado `@Output() spinRequested = new EventEmitter<void>()`.
- Eliminadas variables `yinYangPressed` y `pulseWave`.
- Eliminado JSDoc + `private readonly CENTER_SIZE_RATIO = 0.15`.
- Eliminado bloque `if (changes['gameState'])` en `ngOnChanges` que actualizaba `yinYangPressed`.
- Eliminado método `onYinYangClick()` completo.
- **Guardas `closestYinYang`** en `onMouseDown` y `onTouchStart` conservadas — se eliminan junto con el sistema de drag en `f1-elim-drag.md`.

#### `wheel-container.component.html`
- Eliminado bloque `<div class="yin-yang-center">` completo, incluyendo las ondas de pulso, la imagen yin-yang y el `<button class="spin-center-button">`.

#### `wheel-container.component.css`
- Eliminados: `.yin-yang-center` y variantes (`.pressed`, `.disabled`, hover), `@keyframes pulse-center-glow`.
- **Comentados (desactivados, no eliminados)**: sección `/* === ONDAS DE PULSO ===` con `.pulse-waves`, `.pulse-wave`, nth-child variants y `@keyframes pulseWaveExpand` — reservados para uso futuro.
- Eliminados: `.yin-yang-image`, `@keyframes yinYangGlow`.
- Eliminados: `.spin-center-button` y todas sus variantes, `.spin-center-text` y variantes.
- Eliminada sección "ANIMACIÓN TUTORIAL - YIN YANG": `.yin-yang-image.tutorial-pulse` + `@keyframes tutorialYinYangPulse`.
- Eliminados en sección performance-low: `.wheel-wrapper.performance-low .yin-yang-image`, `.pulse-wave { filter: none }`, `.yin-yang-image.tutorial-pulse` + `@keyframes tutorialYinYangPulseLow`.
- Eliminados en sección performance-medium: `.wheel-wrapper.performance-medium .yin-yang-image`, `.yin-yang-image.tutorial-pulse` + `@keyframes tutorialYinYangPulseMedium`.

#### `home.page.html`
- Eliminados bindings `[canSpinFromParent]="canSpin()"` y `(spinRequested)="spinWheels()"` del `<app-wheel-container>`.
- `canSpin()` se conserva en `home.page.ts` — sigue usándose como guard interno en `spinWheels()`.

## Implementación actual
En el componente:
- Variables: `yinYangPressed` (l.65), `pulseWave` (l.66).
- Ratio de tamaño: `CENTER_SIZE_RATIO` (l.219).
- Método: `onYinYangClick()` (l.499), que activa el pressed state, la onda de pulso y emite `spinRequested`.
- Output: `spinRequested` (l.53).
- Input: `canSpinFromParent` (l.38), que controla si el yin-yang es clickeable.
- Referencias en `onMouseDown` y `onTouchStart` que ignoran clicks sobre `.yin-yang-center`.

En el template: elemento `.yin-yang-center` con binding al click, clase condicional `yinYangPressed`, animación de onda `pulseWave`.

## Plan
1. ~~Eliminar `yinYangPressed`, `pulseWave`, `onYinYangClick()`, `CENTER_SIZE_RATIO`.~~
2. ~~Eliminar `@Input() canSpinFromParent` y `@Output() spinRequested`.~~
3. ~~Eliminar el elemento `.yin-yang-center` del template y sus estilos en el CSS.~~
4. Eliminar las guardas `closestYinYang` en `onMouseDown` y `onTouchStart` (se eliminarán junto con el drag en `f1-elim-drag.md`).
5. ~~Revisar `home.page.ts` para eliminar bindings a `canSpinFromParent` y `spinRequested`.~~
