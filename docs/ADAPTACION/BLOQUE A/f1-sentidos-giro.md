# F1 — Sentidos de giro invertidos entre anillos

## Requisito
Los dos anillos deben girar en sentidos opuestos entre sí.

## Estado actual
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
