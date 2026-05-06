# F1 — spinToResult con dos animales objetivo

## Requisito
`spinToResult` debe recibir dos animales objetivo: uno para el anillo exterior y otro para el anillo interior. El resultado siempre viene del servidor; nunca se genera localmente.

## Estado

Implementado

## Implementación actual
```ts
// wheel-container.component.ts:922
public spinToResult(result: { animal: Animal; number: number }): Promise<WheelSpinResult>
```
Recibe un solo animal (anillo exterior) y un número multiplicador (anillo interior). El índice del anillo interior se resuelve buscando el número en `numbers[]`.

## Plan
1. Cambiar la firma a:
   ```ts
   spinToResult(result: { outerAnimal: Animal; innerAnimal: Animal }): Promise<WheelSpinResult>
   ```
2. Resolver `outerResultIndex` buscando `result.outerAnimal.name` en `displayItems`.
3. Resolver `innerResultIndex` buscando `result.innerAnimal.name` en `innerDisplayItems`.
4. Actualizar `WheelSpinResult` en `wheel-general.interface.ts` si expone `number` como campo obligatorio — reemplazar por `innerAnimal: Animal`.
5. Actualizar el caller en `home.page.ts` cuando se adapte en el Bloque B.
