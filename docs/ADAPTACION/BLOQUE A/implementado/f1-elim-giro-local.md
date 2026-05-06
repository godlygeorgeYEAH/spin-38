# F1 — Eliminar spinAndGetResult

## Requisito
Eliminar el método `spinAndGetResult`, que genera el resultado con `Math.random()` localmente. En Ruleta de Dupla el resultado siempre viene del servidor.

## Estado

Implementado

### Notas de Implementación

- Se eliminó el método completo `spinAndGetResult()` (~108 líneas) junto con su JSDoc de `wheel-container.component.ts`.
- El único caller era `adjustWheelPosition()` en `home.page.ts` (llamado desde `resetGame()`). `adjustWheelPosition` existía únicamente para hacer un giro aleatorio de reposicionamiento visual; sin `spinAndGetResult`, el método quedaba vacío de lógica real, por lo que se eliminó también el método completo.
- En `resetGame()`: eliminadas las líneas `await new Promise(resolve => setTimeout(resolve, 500))` (delay para esperar la animación de posicionamiento) y `await this.adjustWheelPosition()`, que eran una unidad funcional junto con el método removido.
- No había referencias al método en templates ni otros servicios.

## Implementación actual
```ts
// wheel-container.component.ts:823
public spinAndGetResult(): Promise<WheelSpinResult> {
  ...
  const outerResultIndex = Math.floor(Math.random() * this.segmentsCount);
  const innerResultIndex = Math.floor(Math.random() * this.segmentsCount);
  ...
}
```
El método existe y es llamado desde `home.page.ts`. Contiene también lógica de victoria/confetti que debe moverse o eliminarse según lo que se decida con el overlay de resultado.

## Plan
1. Eliminar el método completo (`spinAndGetResult`, líneas 823–915).
2. Localizar todos los callers en `home.page.ts` y eliminar o reemplazar por llamadas a `spinToResult`.
3. Verificar que no queden referencias al método en el template ni en otros servicios.
