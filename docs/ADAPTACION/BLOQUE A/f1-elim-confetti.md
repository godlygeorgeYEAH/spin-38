# F1 — Eliminar confetti

## Requisito
Eliminar el sistema de confetti del componente.

## Estado

Por implementar

## Implementación actual
```ts
// wheel-container.component.ts:306
public confettiArray: { index: number; angle: number; distance: number; delay: number; duration: number }[] = [];
```
- `generateConfettiDistribution()` (l.353): genera las partículas basándose en `performanceProfile.confettiParticles`.
- `getConfettiColor()` (l.384): retorna color por índice.
- `showConfetti: boolean` (l.63): flag que activa el render en template.
- Se activa en `spinAndGetResult` y `spinToResult` cuando el jugador gana.
- Se llama en el constructor (l.328).

## Plan
1. Eliminar `confettiArray`, `showConfetti`, `generateConfettiDistribution()`, `getConfettiColor()`.
2. Eliminar la llamada a `generateConfettiDistribution()` en el constructor.
3. Eliminar el bloque de confetti del template (`*ngFor` sobre `confettiArray`).
4. Eliminar los estilos de confetti en el CSS.
5. Dejar `auroraRingsArray` intacto si los anillos de aurora se conservan como efecto visual de fondo.
