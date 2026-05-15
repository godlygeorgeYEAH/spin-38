# Fase 3C — Mapping de la ruleta americana con animales venezolanos

**Estado:** Implementado  
**Archivos modificados:** `wheel-general.interface.ts`, `wheel-container.component.ts`, `wheel-container.component.html`, `home.page.ts`, `api-response.interface.ts`, `round-orchestrator.service.ts`

---

## Objetivo

Reemplazar el modelo de datos centrado en el nombre del animal (herencia de Spin Zodiac) por un modelo centrado en la posición de la ruleta americana. El número de posición es el identificador principal; el animal (nombre, emoji, imagen) es metadata asociada a ese número. Esta fase también corrige el bug de orden en `ROULETTE_NUMBERS` y establece el mapping completo de los 38 animales venezolanos definidos por Carlos y JG.

---

## Cambios implementados

### `src/app/interfaces/wheel-general.interface.ts`

Se añadió `position: string` como campo obligatorio e identificador primario de `Animal`. Se renombró `WheelItem.name` a `WheelItem.position`.

```ts
export interface Animal {
  position: string;   // número de ruleta: '0', '28', '00', etc.
  name: string;
  emoji: string;
  image?: string;
  description?: string;
}

export interface WheelItem {
  position: string;
  image?: string;
}
```

`WheelSpinResult` no requirió cambios estructurales — ya tenía `outerPosition` e `innerPosition`.

---

### `src/app/components/wheel-container/wheel-container.component.ts`

**`animalMap`** — objeto `const` definido fuera de la clase, con las 38 posiciones de la ruleta americana como claves y los animales venezolanos como valores. Incluye nombre, emoji e imagen para cada posición.

**`rouletteSequence`** — reemplaza a `ROULETTE_NUMBERS`, que tenía un bug activo: estaba en orden numérico (`0, '00', 1, 2, 3...`) en vez del orden físico real de la ruleta americana. La secuencia correcta es:

```
0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3,
24, 36, 13, 1, 00, 27, 10, 25, 29, 12, 8, 19, 31, 18,
6, 21, 33, 16, 4, 23, 35, 14, 2
```

**`displayItems` / `innerDisplayItems`** — tipo cambiado de `number[]` a `Animal[]`.

**`prepareDisplayItems()`** — reescrito con lookup en `animalMap` por posición y fallback consistente en ambos anillos:

```ts
private prepareDisplayItems(): void {
  this.displayItems = this.rouletteSequence.map(pos =>
    animalMap[pos] || { position: pos, name: pos, emoji: '' }
  );
  this.innerDisplayItems = this.innerAnimals.length > 0
    ? this.innerAnimals.map(item =>
        animalMap[item.position] || { position: item.position, name: item.position, emoji: '' }
      )
    : this.rouletteSequence.map(pos =>
        animalMap[pos] || { position: pos, name: pos, emoji: '' }
      );
}
```

**`spinToResult`** — firma cambiada de `number | string` a `string`. La búsqueda interna usa `rouletteSequence.indexOf()`.

**`getAnimalImage(position)`** — método público para lookup de imagen por posición.

**`onImageError(_event, item)`** — handler que pone `item.image = undefined` y llama `markForCheck()`, activando el branch de fallback si el archivo no existe en disco.

---

### `src/app/components/wheel-container/wheel-container.component.html`

Ambos anillos renderizan imagen si `item.image` existe. Si no, muestran el emoji del animal. Si tampoco hay emoji (posición fuera del map), muestran el número de posición como último recurso.

```html
<image *ngIf="item.image"
       [attr.href]="item.image"
       [attr.x]="animalImageOffset" [attr.y]="animalImageOffset"
       [attr.width]="animalImageSize" [attr.height]="animalImageSize"
       (error)="onImageError($event, item)" />
<text *ngIf="!item.image" x="0" y="0" class="roulette-number-outer">
  {{ item.emoji || item.position }}
</text>
```

La prioridad de render por segmento es: **imagen → emoji → número de posición**.

---

### `src/app/home/home.page.ts`

`animalsForWheel` reemplazado de 12 zodiácos chinos a 38 `WheelItem` en el orden físico de la ruleta americana:

```ts
public readonly animalsForWheel: WheelItem[] = [
  { position: '0' }, { position: '28' }, { position: '9' }, ...
];
```

Se eliminó el bloque `find` + guard que buscaba el animal ganador por nombre — la validación de posición ocurre dentro del componente. El caller ahora pasa posiciones directamente:

```ts
await this.wheelContainer.spinToResult({
  outerPosition: backendResult.outerPosition,
  innerPosition: backendResult.innerPosition,
});
```

---

### `src/app/interfaces/api-response.interface.ts`

`SpinResponse` actualizado al contrato del backend de Dupla:

```ts
export interface SpinResponse {
  outerPosition: string;
  innerPosition: string;
  winAmount: number;
  balanceAfter: number;
  isWin: boolean;
}
```

---

### `src/app/services/round-orchestrator.service.ts`

`SpinCommand` y `RoundResultResponse` alineados a `string` para `outerPosition` e `innerPosition`, eliminando el tipo union `number | string`.

---

## Mapping completo de animales venezolanos

Orden físico de la ruleta americana (38 posiciones):

| Posición | Animal    | Emoji |
|----------|-----------|-------|
| 0        | Delfin    | 🐬    |
| 28       | Zamuro    | 🦅    |
| 9        | Aguila    | 🦅    |
| 26       | Vaca      | 🐄    |
| 30       | Caiman    | 🐊    |
| 11       | Gato      | 🐱    |
| 7        | Perico    | 🦜    |
| 20       | Cochino   | 🐷    |
| 32       | Ardilla   | 🐿️    |
| 17       | Pavo      | 🦃    |
| 5        | Leon      | 🦁    |
| 22       | Camello   | 🐪    |
| 34       | Venado    | 🦌    |
| 15       | Zorro     | 🦊    |
| 3        | Cienpies  | 🐛    |
| 24       | Iguana    | 🦎    |
| 36       | Culebra   | 🐍    |
| 13       | Mono      | 🐒    |
| 1        | Carnero   | 🐏    |
| 00       | Ballena   | 🐳    |
| 27       | Perro     | 🐕    |
| 10       | Tigre     | 🐅    |
| 25       | Gallina   | 🐔    |
| 29       | Elefante  | 🐘    |
| 12       | Caballo   | 🐴    |
| 8        | Raton     | 🐭    |
| 19       | Cabra     | 🐐    |
| 31       | Lapa      | 🐾    |
| 18       | Burro     | 🫏    |
| 6        | Rana      | 🐸    |
| 21       | Gallo     | 🐓    |
| 33       | Pescado   | 🐟    |
| 16       | Oso       | 🐻    |
| 4        | Alacran   | 🦂    |
| 23       | Cebra     | 🦓    |
| 35       | Jirafa    | 🦒    |
| 14       | Paloma    | 🕊️    |
| 2        | Toro      | 🐂    |

---

## Assets esperados

Las imágenes deben estar en `src/assets/images/animales/` con nombres en mayúsculas:

```
DELFIN.png, ZAMURO.png, AGUILA.png, VACA.png, CAIMAN.png,
GATO.png, PERICO.png, COCHINO.png, ARDILLA.png, PAVO.png,
LEON.png, CAMELLO.png, VENADO.png, ZORRO.png, CIENPIES.png,
IGUANA.png, CULEBRA.png, MONO.png, CARNERO.png, BALLENA.png,
PERRO.png, TIGRE.png, GALLINA.png, ELEFANTE.png, CABALLO.png,
RATON.png, CABRA.png, LAPA.png, BURRO.png, RANA.png,
GALLO.png, PESCADO.png, OSO.png, ALACRAN.png, CEBRA.png,
JIRAFA.png, PALOMA.png, TORO.png
```

Mientras no existan, los segmentos muestran el emoji. No se requiere ningún cambio de código cuando lleguen los assets.

---

## Lo que no cambió

- La lógica de animación (`applySpinAnimation`, `calculateFinalAngle`, `forceStopAnimation`) opera sobre índices y ángulos, indiferente al modelo de datos.
- Los performance tiers.
- El render condicional imagen/texto en el template — solo cambió qué campo se usa en la rama de fallback.
