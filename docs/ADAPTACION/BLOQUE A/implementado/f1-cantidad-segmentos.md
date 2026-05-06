# F1 — segmentsCount como @Input()

## Requisito
`segmentsCount` debe ser un `@Input()` configurable, con valor 38 para este proyecto. No debe ser una constante interna.

## Estado

Implementado

## Nota post-implementación
`fallbackZodiacs` (12 items) y `numbers` (12 items) quedan por debajo de los 38 segmentos. No producen errores en runtime pero los segmentos se repiten. Ambos arrays serán reemplazados en tareas posteriores.

El `@Input() set multiplierValues` en `wheel-container.component.ts` sobreescribía `numbers` con 12 items al recibir el binding de `home.page.html`, pisando el array de 38. Se eliminó el binding del template como fix inmediato. **Pendiente:** ¿Eliminar el setter `multiplierValues` del componente en una tarea posterior?

## Implementación actual
```ts
// wheel-container.component.ts:92
private readonly segmentsCount = 12;
private readonly degreesPerSegment = 360 / this.segmentsCount;
```
Hardcodeado en 12. No expuesto como Input. `degreesPerSegment` se deriva de él en tiempo de inicialización de clase, por lo que al volverlo Input habrá que convertirlo en getter o recalcularlo en `ngOnInit`/`ngOnChanges`.

## Plan
1. Convertir `segmentsCount` en `@Input() segmentsCount: number = 38`.
2. Convertir `degreesPerSegment` en getter: `get degreesPerSegment() { return 360 / this.segmentsCount; }`.
3. Invalidar los caches de paths (`segmentPathCache`, `textPathCache`, `animalTransformCache`, `numberTransformCache`) en `ngOnChanges` cuando cambie `segmentsCount`.
4. Verificar que `fallbackZodiacs` y `numbers` también se dimensionen según el nuevo valor.


