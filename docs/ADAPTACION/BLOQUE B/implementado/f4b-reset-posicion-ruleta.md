# Fase 4B — Reset automático de posición de la ruleta

**Bloque:** B  
**Dependencias:** Fase 4 (`RoundOrchestratorService` activo, `spinToResult` funcionando)  
**Entregable:** Al terminar cada giro, ambos anillos regresan automáticamente a una posición configurable (`00/00` por defecto) con una animación corta y suave.

## Objetivo

Evitar que la rueda quede detenida en posiciones arbitrarias entre rondas. Después de que `spinToResult` resuelve, se ejecuta un reposicionamiento visual rápido que sirve como "estado neutro" entre rondas y facilita el debugging al siempre saber en qué posición arranca el próximo giro.

## Implementación

### Constantes configurables en `wheel-container.component.ts`

```ts
// ── Posición de reset ──────────────────────────────────────────────────────
// Cambia estos valores para ajustar a dónde vuelve la rueda después de cada giro
private readonly RESET_OUTER_POSITION: number | string = '00';
private readonly RESET_INNER_POSITION: number | string = '00';
private readonly RESET_DURATION_MS = 1200;
private readonly RESET_ROTATIONS = 1;
```

- `RESET_OUTER_POSITION` / `RESET_INNER_POSITION`: cualquier valor del array `ROULETTE_NUMBERS` (`0`, `'00'`, `1–36`).
- `RESET_DURATION_MS`: duración total de la animación de reset en milisegundos.
- `RESET_ROTATIONS`: número de vueltas adicionales antes de llegar a la posición destino (1 = una vuelta suave, 0 = salto directo).

### Método `resetToPosition(): Promise<void>`

Ubicación: `wheel-container.component.ts`

```ts
public resetToPosition(): Promise<void> {
  const outerIndex = this.ROULETTE_NUMBERS.indexOf(this.RESET_OUTER_POSITION);
  const innerIndex = this.ROULETTE_NUMBERS.indexOf(this.RESET_INNER_POSITION);
  if (outerIndex === -1 || innerIndex === -1) return Promise.resolve();

  const targetOuter = this.calculateFinalAngle(outerIndex, this.restingOuterAngle, true, this.RESET_ROTATIONS);
  const targetInner = this.calculateFinalAngle(innerIndex, this.restingInnerAngle, false, this.RESET_ROTATIONS);

  this.applySpinAnimation(this.outerWheel.nativeElement, targetOuter, this.RESET_DURATION_MS, 'ease-out');
  this.applySpinAnimation(this.innerWheel.nativeElement, targetInner, this.RESET_DURATION_MS, 'ease-out');

  return new Promise(resolve => {
    setTimeout(() => {
      this.restingOuterAngle = targetOuter;
      this.restingInnerAngle = targetInner;
      this.forceStopAnimation(this.outerWheel.nativeElement, targetOuter);
      this.forceStopAnimation(this.innerWheel.nativeElement, targetInner);
      resolve();
    }, this.RESET_DURATION_MS);
  });
}
```

**Flujo:**
1. Busca el índice de `RESET_OUTER_POSITION` e `RESET_INNER_POSITION` en `ROULETTE_NUMBERS`.
2. Calcula el ángulo destino acumulado partiendo del ángulo en reposo actual (`restingOuterAngle` / `restingInnerAngle`) más `RESET_ROTATIONS` vueltas.
3. Aplica la transición CSS con easing `ease-out` y duración `RESET_DURATION_MS`.
4. Tras el timeout, actualiza los ángulos en reposo y llama a `forceStopAnimation` para fijar la posición.
5. Resuelve la Promise, permitiendo que el caller encadene la siguiente acción.

### Parámetros extendidos en funciones auxiliares

`calculateFinalAngle` acepta un cuarto parámetro opcional `rotations` (por defecto `10` para giros normales):

```ts
private calculateFinalAngle(
  targetIndex: number,
  currentAngle: number,
  isOuter: boolean,
  rotations: number = 10
): number
```

`applySpinAnimation` acepta un cuarto parámetro opcional `easing`:

```ts
private applySpinAnimation(
  element: SVGGElement,
  targetAngle: number,
  duration?: number,
  easing: string = 'cubic-bezier(0.23, 1, 0.32, 1)'
): void
```

El reset usa `'ease-out'` para una desaceleración simple, a diferencia del `cubic-bezier` del giro principal que imita la deceleración de una ruleta real.

### Integración en `home.page.ts`

El reset se encadena después de `notifySpinComplete()`:

```ts
this.wheelContainer.spinToResult(cmd)
  .then(() => {
    this.orchestrator.notifySpinComplete();
    return this.wheelContainer.resetToPosition();
  })
  .then(() => {
    this.gameState = GameState.RESULT;
    this.cdr.markForCheck();
  });
```

## Criterio de completitud

- Al terminar el giro, ambos anillos se mueven hacia `00/00` con una animación visible (~1.2 s).
- El movimiento incluye exactamente 1 vuelta antes de detenerse en `00`.
- Cambiando `RESET_OUTER_POSITION = 7` y `RESET_INNER_POSITION = 14`, la rueda queda apuntando a esos números.
- Cambiando `RESET_DURATION_MS = 500` la animación es perceptiblemente más rápida.
- No hay saltos ni glitches visuales entre el fin del giro principal y el inicio del reset.

## Estado

Implementado
