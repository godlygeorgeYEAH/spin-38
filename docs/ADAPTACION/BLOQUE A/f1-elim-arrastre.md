# F1 — Eliminar sistema de giro manual (drag)

## Requisito
Eliminar todo el sistema de interacción manual: drag con mouse y touch, cálculo de inercia, detección de velocidad.

## Estado actual
El sistema ocupa aproximadamente 280 líneas del componente:
- Variables de estado: `isDragging`, `lastMouseAngle`, `manualRotation`, `isDragIntent`, `dragStartCoords`, `potentialTapTarget`, `justProcessedTap`, `currentVelocity`, `lastDeltaAngle`, `isAdjustmentMode`, `adjustmentStartAngle`, `lastUpdateTime`, `lastAngle`.
- Métodos: `setupManualInteraction` (l.528), `onMouseDown` (l.541), `onMouseMove` (l.570), `onMouseUp` (l.576), `onTouchStart` (l.592), `onTouchMove` (l.606), `onTouchEnd` (l.612), `startDrag` (l.618), `updateDrag` (l.687), `endDrag` (l.758), `applyInertiaStop` (l.747).
- Outputs: `manualSpinRequested` (l.54).
- `setupManualInteraction` se llama en `ngOnInit`.

## Plan
1. Eliminar todos los métodos y variables listados.
2. Eliminar el `@Output() manualSpinRequested`.
3. Eliminar la llamada a `setupManualInteraction()` en `ngOnInit`.
4. Eliminar `playIntentThreshold`, `velocityThreshold`, `expansionRange` si ya no se usan en otro contexto.
5. Revisar `home.page.ts` para eliminar el handler de `manualSpinRequested`.
