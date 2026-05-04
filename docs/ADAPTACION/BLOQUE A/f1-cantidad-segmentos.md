# F1 — segmentsCount como @Input()

## Requisito
`segmentsCount` debe ser un `@Input()` configurable, con valor 38 para este proyecto. No debe ser una constante interna.

## Estado actual
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
