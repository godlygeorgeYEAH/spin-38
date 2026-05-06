# F1 — Sentidos de giro invertidos entre anillos

## Requisito
Los dos anillos deben girar en sentidos opuestos entre sí.

## Estado

Implementado

### Notas de Implementación

El spec original decía "ya implementado" pero había un bug en `calculateFinalAngle`: usaba `Math.floor(currentAngle / 360)` para calcular `currentRevolutions`. Cuando el anillo interno acumula ángulos negativos grandes (ej: -3705 tras el primer giro), `Math.floor` retorna un valor muy negativo, `baseRotation` se vuelve negativo, y al negar produce un resultado positivo — haciendo que el anillo interno gire en el mismo sentido que el externo a partir del segundo giro.

**Fix**: Reescrita la función para no depender de `currentRevolutions`. Ahora usa el ángulo normalizado de ambas ruedas y garantiza por construcción que:
- Outer siempre avanza en positivo desde `currentAngle` (horario).
- Inner siempre retrocede en negativo desde `currentAngle` (antihorario).

```ts
// wheel-container.component.ts — calculateFinalAngle
const remainder = ((-segmentCenterAngle % 360) + 360) % 360;
const currentNorm = ((currentAngle % 360) + 360) % 360;
// Outer: target = currentAngle + rotations*360 + extraToReachSegment
// Inner: target = currentAngle - rotations*360 - extraToReachSegment
```

## Implementación actual
`calculateFinalAngle` ya maneja la inversión:
```ts
// wheel-container.component.ts:1123
return isOuter ? (baseRotation + offsetAngle) : -(baseRotation + Math.abs(offsetAngle));
```
El anillo externo gira en positivo y el interno en negativo. Durante el drag manual también se aplica:
```ts
// wheel-container.component.ts:739-740
outerWheel: rotate(restingOuterAngle + manualRotation)
innerWheel: rotate(restingInnerAngle - manualRotation)
```
**Este requisito ya está implementado correctamente.** No requiere cambios, pero debe verificarse que siga funcionando después de eliminar el sistema de drag (el giro invertido en `calculateFinalAngle` es independiente).

## Plan
Sin acción requerida. Validar tras completar `f1-elim-drag.md`.
