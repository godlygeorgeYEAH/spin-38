# C2 — Texto de animación de resultado delegado al servidor

El texto que aparece en la animación de resultado ("MOROCHA", etc.) está actualmente hardcodeado en el frontend. El servidor debe ser la única fuente de verdad sobre qué texto mostrar, ya que la lógica de negocio de cuándo y qué mostrar es responsabilidad del cliente (operador).

---

## Contrato de datos

### Campo nuevo en `RoundResultResponse`

```typescript
// src/app/services/round-orchestrator.service.ts
export interface RoundResultResponse {
  roundId: number;
  outerPosition: number | string;
  innerPosition: number | string;
  resultLabel?: string | null;   // <-- nuevo
}
```

**Nombre:** `resultLabel`
**Tipo:** `string | null | undefined`
**Obligatorio:** No. Si el servidor no lo envía, o envía `null`, no se dispara la animación de reveal.

### Semántica del campo

| Valor del servidor | Comportamiento del frontend |
|---|---|
| `"MOROCHA"` | Dispara `RevealService.play()` con `hype: true` |
| Cualquier otro string no vacío | Dispara `RevealService.play()` con `hype: false` |
| `null` | No se dispara la animación de reveal |
| Ausente (campo no viene) | No se dispara la animación de reveal |
| `""` (string vacío) | Tratar igual que `null` — no disparar |

El frontend **no interpreta** el contenido del texto. No sabe qué significa "MOROCHA", no aplica lógica condicional sobre el valor. Solo pregunta: ¿hay un string no vacío? Si sí, lo muestra.

### Sobre el flag `hype`

La animación tiene dos modos internos en `RevealService`:
- **Normal**: texto aparece una vez con entrada/salida suave.
- **Hype**: ráfagas repetidas, parpadeos, efecto de letrero (modo "MOROCHA" actual).

La decisión de qué modo usar debe seguir siendo del frontend, basada en una convención acordada con el servidor. Propuesta: si el servidor envía `resultLabel`, siempre se usa `hype: true`. Si en el futuro se necesita control fino, se puede agregar un segundo campo `resultLabelStyle?: 'normal' | 'hype'` sin romper el contrato actual.

---

## Cambios de implementación

### 1. `RoundResultResponse` — agregar el campo

```typescript
// round-orchestrator.service.ts
export interface RoundResultResponse {
  roundId: number;
  outerPosition: number | string;
  innerPosition: number | string;
  resultLabel?: string | null;
}
```

### 2. `SpinCommand` — propagar el texto hacia el componente

```typescript
export interface SpinCommand {
  outerPosition: string;
  innerPosition: string;
  outerDurationMs: number;
  innerDurationMs: number;
  resultLabel?: string | null;   // <-- nuevo
}
```

### 3. `triggerSpin()` — leer y propagar

```typescript
// En triggerSpin(), dentro del next() del GET /round/:id/result:
const cmd: SpinCommand = {
  outerPosition: String(result.outerPosition),
  innerPosition: String(result.innerPosition),
  outerDurationMs: ...,
  innerDurationMs: ...,
  resultLabel: result.resultLabel ?? null,
};
```

### 4. `home.page.ts` (o quien consuma `spinCommand$`) — disparar el reveal

```typescript
this.orchestrator.spinCommand$.subscribe(async (cmd) => {
  await this.wheelContainer.spinToResult(cmd);
  this.orchestrator.notifySpinComplete();

  const label = cmd.resultLabel?.trim();
  if (label) {
    await this.revealService.play({
      leftImage: '...',
      rightImage: '...',
      text: label,
      hype: true,
    });
  }
});
```

### 5. Eliminar toda referencia hardcodeada a `"MOROCHA"`

Buscar en el proyecto cualquier comparación o asignación literal del string `"MOROCHA"` y eliminarla. El frontend no debe tener opinión sobre este valor.

---

## Criterios de aceptación

- Si el servidor envía `resultLabel: "MOROCHA"`, la animación muestra "MOROCHA" con modo hype.
- Si el servidor envía `resultLabel: "DUPLA ESPECIAL"`, la animación muestra "DUPLA ESPECIAL" con modo hype.
- Si el servidor envía `resultLabel: null` o no envía el campo, no aparece ninguna animación de reveal.
- No existe ninguna mención del string `"MOROCHA"` en el código TypeScript del frontend.
- El cambio es backward-compatible: si el servidor antiguo no envía el campo, la app funciona igual que antes (sin animación de reveal).

## Estado

Implementado
