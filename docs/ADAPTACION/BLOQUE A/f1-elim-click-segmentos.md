# F1 — Eliminar clicks en segmentos para selección de animales

## Requisito
Eliminar la interacción de click/tap sobre segmentos de la rueda para selección de animales. En Ruleta de Dupla la rueda es solo un display; la selección de animales no existe.

## Estado actual
```ts
// wheel-container.component.ts:461
public onSegmentClick(animal: Animal, event: Event): void { ... }
```
- Variables relacionadas: `potentialTapTarget`, `justProcessedTap` (gestionadas en el sistema de drag).
- Output: `onAnimalToggle` (l.52), emitido en `onSegmentClick` y en `endDrag`.
- Input: `selectedAnimals: string[]` (l.36), usado para highlight visual de segmentos y para determinar victoria en `spinAndGetResult`/`spinToResult`.
- `isAnimalSelected()` (l.1044) consulta `selectedAnimals`.

## Plan
1. Eliminar `onSegmentClick()`, `@Output() onAnimalToggle`, `@Input() selectedAnimals`, `isAnimalSelected()`.
2. Eliminar referencias a `selectedAnimals` en la lógica de victoria dentro de `spinToResult` (la detección de victoria pasa a ser responsabilidad del servidor).
3. Eliminar bindings en el template (event handlers en segmentos, clases condicionales de selección).
4. Revisar `home.page.ts` para eliminar el handler de `onAnimalToggle`.
