# Fase 3B — Doble anillo con números de ruleta americana

**Bloque:** B  
**Dependencias:** Fase 3A (mock server con contrato mínimo)  
**Entregable:** `WheelContainerComponent` mostrando los 38 números de la ruleta americana en ambos anillos, con `spinToResult` recibiendo posiciones numéricas directamente

## Estado

Implementado

### Notas de implementación

#### Dónde están definidos los números

`ROULETTE_NUMBERS` es un array privado en `wheel-container.component.ts`:

```ts
private readonly ROULETTE_NUMBERS: (number | string)[] = [
  0, '00', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
  13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
  26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36
];
```

38 valores. El índice del array es el índice del segmento: segmento 0 = `0`, segmento 1 = `'00'`, segmento 2 = `1`, ..., segmento 37 = `36`.

**Nota:** Este orden (`0, 00, 1–36`) es un orden lineal de conveniencia, no el orden físico de una ruleta americana real (`0, 28, 9, 26...`). El orden físico real se implementará en una fase posterior cuando llegue el mapeo de Carlos y José Gregorio.

---

#### Cómo se usan en el render

`displayItems` e `innerDisplayItems` son ahora `number[]` simples — solo indices — generados en `prepareDisplayItems()`:

```ts
private prepareDisplayItems(): void {
  this.displayItems = Array.from({ length: this.segmentsCount }, (_, i) => i);
  this.innerDisplayItems = [...this.displayItems];
}
```

El template itera sobre estos arrays usando solo el índice `i`, y llama a `getRouletteNumber(i)` para obtener el valor a mostrar:

```ts
public getRouletteNumber(index: number): number | string {
  return this.ROULETTE_NUMBERS[index] ?? index;
}
```

En el HTML, ambos anillos usan el mismo patrón:

```html
<!-- Anillo exterior -->
<g *ngFor="let item of displayItems; let i = index" [attr.transform]="getAnimalTransform(i)">
  <text x="0" y="0" class="roulette-number-outer">{{ getRouletteNumber(i) }}</text>
</g>

<!-- Anillo interior -->
<g *ngFor="let item of innerDisplayItems; let i = index" [attr.transform]="getInnerAnimalTransform(i)">
  <text x="0" y="0" class="roulette-number-inner">{{ getRouletteNumber(i) }}</text>
</g>
```

El `<text>` usa `text-anchor: middle` y `dominant-baseline: middle` en CSS, lo que lo centra automáticamente dentro del transform del segmento.

---

#### Cómo se usan en `spinToResult`

`spinToResult` recibe `{ outerPosition, innerPosition }` como valores de la ruleta americana (`number | string`). Usa `ROULETTE_NUMBERS.indexOf()` para resolver el índice de segmento:

```ts
public spinToResult(result: { outerPosition: number | string; innerPosition: number | string }): Promise<WheelSpinResult>
```

```ts
const outerResultIndex = this.ROULETTE_NUMBERS.indexOf(result.outerPosition);
// ej: spinToResult({ outerPosition: 7 }) → ROULETTE_NUMBERS.indexOf(7) → 8
// ej: spinToResult({ outerPosition: '00' }) → ROULETTE_NUMBERS.indexOf('00') → 1
```

El índice resultante alimenta `calculateFinalAngle()` que determina cuántos grados rotar cada anillo.

---

#### Interfaz de retorno

`WheelSpinResult` ya no contiene animales:

```ts
export interface WheelSpinResult {
  outerPosition: number | string;   // ej: 7
  innerPosition: number | string;   // ej: '00'
  isPositioningOnly?: boolean;
  outerWheelIndex?: number;         // índice en ROULETTE_NUMBERS (0–37)
  innerWheelIndex?: number;
}
```

---

#### Posicionamiento SVG de los números

- **Anillo exterior:** `getAnimalTransform(i)` — radio `SVG_VIEWBOX_RADIUS × ANIMAL_POSITION_RATIO (0.720)` — font-size 18px
- **Anillo interior:** `getInnerAnimalTransform(i)` — radio `SVG_VIEWBOX_RADIUS × NUMBER_POSITION_RATIO (0.450)` — font-size 14px
- Ambos métodos hacen `translate(x, y) rotate(angleDeg)`. El `<text x="0" y="0">` queda centrado en la posición calculada sin cálculo adicional.

---

#### Lo que quedó pendiente para fases posteriores

- Reordenar `ROULETTE_NUMBERS` al orden físico real de la ruleta americana cuando llegue el mapeo del backend.
- `resetToInitialPosition()` (mencionado en el spec original) — no implementado; el orquestador de la Fase 4 determinará si hace falta.

## Objetivo

Hacer funcionar el motor portado del Bloque A con datos reales de posición: dos anillos concéntricos girando en sentidos opuestos, cada uno deteniéndose en la posición numérica dictada por `spinToResult`. Los números de la ruleta americana sirven como placeholder visual verificable antes de recibir los assets finales, y permiten confirmar que el índice de segmento correcto coincide con el valor numérico esperado.

## Qué se construye / Qué se hace

- **Pool de 38 posiciones.** `ROULETTE_NUMBERS = [0, '00', 1–36]` define los valores de ambos anillos. El índice en el array es el índice del segmento.
- **`spinToResult` con firma numérica.** Recibe `{ outerPosition, innerPosition: number | string }` directamente desde el mock server o el backend, sin adaptadores intermedios.
- **Render de números como texto SVG.** Cada segmento muestra su número con `<text>` centrado. No hay imágenes de animales.
- **`WheelSpinResult` actualizado.** Retorna `outerPosition` e `innerPosition` en lugar de objetos `Animal`.
- **Limpieza del componente.** `animalMap`, `fallbackZodiacs` y `getAnimalImage()` eliminados.

## Criterio de completitud

- Ambos anillos muestran números (`0`, `00`, `1`–`36`) en cada segmento, sin imágenes.
- `spinToResult({ outerPosition: X, innerPosition: Y })` gira ambos anillos y se detiene con `X` e `Y` en la posición de resultado.
- El componente compila sin errores y sin referencias a `Animal`, `animalMap` ni `fallbackZodiacs`.
- `WheelSpinResult` retorna `outerPosition` e `innerPosition` como `number | string`.
