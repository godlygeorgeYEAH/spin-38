# F1 — Eliminar yin-yang central y botón GIRAR

## Requisito
Eliminar el yin-yang central con el botón GIRAR y sus ondas de pulso. La ruleta es un display pasivo; el giro se inicia exclusivamente desde el servidor.

## Estado

Por implementar

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
1. Eliminar `yinYangPressed`, `pulseWave`, `onYinYangClick()`, `CENTER_SIZE_RATIO`.
2. Eliminar `@Input() canSpinFromParent` y `@Output() spinRequested`.
3. Eliminar el elemento `.yin-yang-center` del template y sus estilos en el CSS.
4. Eliminar las guardas `closestYinYang` en `onMouseDown` y `onTouchStart` (se eliminarán junto con el drag en `f1-elim-drag.md`).
5. Revisar `home.page.ts` para eliminar bindings a `canSpinFromParent` y `spinRequested`.
