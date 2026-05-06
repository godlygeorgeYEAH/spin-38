# F1 — Eliminar clicks en segmentos para selección de animales

## Requisito
Eliminar la interacción de click/tap sobre segmentos de la rueda para selección de animales. En Ruleta de Dupla la rueda es solo un display; la selección de animales no existe.

## Estado

Implementado

### Notas de Implementación

- Se eliminaron `@Input() selectedAnimals: string[]` y `@Output() onAnimalToggle` del componente.
- Se eliminó el método `onSegmentClick()` (~35 líneas) que era el punto de entrada de clicks en segmentos.
- Se eliminó el método `isAnimalSelected()` que consultaba `selectedAnimals`.
- Se eliminó la variable privada `justProcessedTap`, que solo existía para coordinar entre `onSegmentClick` y `endDrag` (evitar doble emisión de toggle). Ya no tiene razón de existir.
- En `endDrag()`: se eliminó el bloque `else if (potentialTapTarget)` que emitía `onAnimalToggle` desde el sistema de drag. `potentialTapTarget` se conserva como infraestructura del drag (se limpiará en `f1-elim-arrastre`).
- En `spinAndGetResult` y `spinToResult`: `playerWon` reemplazado por `const playerWon = false` con comentario explícito indicando que la detección de victoria fue desactivada y la responsabilidad pasa al servidor.
- **Template**: eliminados `(click)="onSegmentClick(...)"` de los tres grupos SVG (path, image, textPath). Fill de segmentos simplificado a alternancia par/impar sin gradiente de selección. Eliminados `[class.selected-segment]`, `[class.selected-animal]` y `style="cursor: pointer; pointer-events: all;"`.
- `home.page.ts`: eliminado el método `onAnimalToggle()` (~34 líneas).
- `home.page.html`: eliminados los bindings `(onAnimalToggle)="onAnimalToggle($event)"` y `[selectedAnimals]="getSelectedAnimalNames()"` del tag `<app-wheel-container>`. El segundo no estaba listado en el plan del spec pero era necesario dado que el `@Input` fue eliminado.
- **Fuera de scope pero relevante**: la definición SVG `selectedGradient` en `<defs>` queda como código muerto inofensivo; se puede limpiar en una pasada posterior.

## Implementación actual
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
