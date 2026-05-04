# F1 — Eliminar tutorial stage

## Requisito
Eliminar la lógica de tutorial stage que afectaba animaciones del componente.

## Estado

Por implementar

## Implementación actual
```ts
// wheel-container.component.ts:43
@Input() tutorialStage: string = '';
```
- Se referencia en `ngOnChanges` con el comentario "La animación de tutorial está desactivada en Safari via HTML binding".
- En el template hay bindings condicionales basados en `tutorialStage` (clases CSS de animación).
- `TutorialService` es externo al componente y se elimina en Fase 2, pero el Input `tutorialStage` vive en el componente.

## Plan
1. Eliminar `@Input() tutorialStage`.
2. Eliminar el comentario y cualquier referencia residual en `ngOnChanges`.
3. Eliminar en el template todos los bindings condicionales que lean `tutorialStage`.
4. Verificar que no queden clases CSS huérfanas relacionadas con el tutorial en el `.css` del componente.
