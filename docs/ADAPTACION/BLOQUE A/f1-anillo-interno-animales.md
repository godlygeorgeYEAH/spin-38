# F1 — Anillo interno con array de animales

## Requisito
El anillo interno debe dejar de mostrar multiplicadores numéricos y pasar a aceptar un segundo array de animales igual al exterior, para representar los 38 animales del animalito venezolano en ambos anillos.

## Estado actual
```ts
// wheel-container.component.ts:90
public numbers = [10, 5, 3, 2, 1.5, 1, 10, 5, 3, 2, 1.5, 1];

@Input() set multiplierValues(values: number[] | undefined) { ... }
```
El anillo interno se alimenta de `numbers[]` (multiplicadores numéricos). El template usa `getNumberTransform(i)` y renderiza `numbers[i]` como texto. `spinToResult` busca el índice del resultado en `numbers`.

## Plan
1. Eliminar `numbers[]` y el `@Input() multiplierValues`.
2. Añadir `@Input() innerAnimals: WheelItem[] = []` (mismo tipo que `animals`).
3. Añadir `innerDisplayItems: Animal[]` poblado en `prepareDisplayItems()` a partir de `innerAnimals`, con el mismo fallback que el anillo exterior.
4. En el template, reemplazar el render de números por imágenes/texto de animal usando `innerDisplayItems[i]` con `getNumberTransform(i)` (renombrar a `getInnerAnimalTransform` si se quiere claridad).
5. Actualizar `spinToResult` para buscar el animal del anillo interno en `innerDisplayItems` en vez de en `numbers`.
