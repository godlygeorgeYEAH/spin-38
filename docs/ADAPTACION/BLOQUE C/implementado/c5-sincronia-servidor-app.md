# C5 — Sincronía servidor-app

Auditoría del flujo de polling y estado del orquestador. Identifica los puntos donde el cliente y el servidor pueden desincronizarse y documenta las mitigaciones implementadas.

---

## Flujo actual

```
poll() → GET /round/current → handleRoundData()
                                  ├─ state=spinning, id≠lastHandledRoundId
                                  │     └─ triggerSpin() → GET /round/:id/result
                                  │           └─ spinCommandSubject.next(cmd)
                                  │                 (componente anima la rueda)
                                  │                 notifySpinComplete()
                                  │                 └─ transitionTo(REVEALING)
                                  │                       revealTimeout → scheduleNextPoll(0)
                                  └─ state=idle|revealing → scheduleNextPoll(5000|30000)
```

Durante `SPINNING` y `REVEALING`, el poll periódico se pausa. El cliente maneja ese período con timers locales. Un poll inmediato se dispara al volver la pestaña al frente (ver R7).

---

## Contrato del servidor

`GET /api/round/current` — campos relevantes para sincronía:

| Campo | Cuándo aparece | Uso en cliente |
|---|---|---|
| `id` | siempre | detectar ronda nueva |
| `state` | siempre | máquina de estados |
| `secondsRemaining` | siempre | countdown visual |
| `spinDurationSec` | siempre | calibrar duración de animación |
| `spinStartedAt` | solo `spinning` | calcular tiempo restante del giro |
| `revealDurationSec` | siempre | duración local del período revealing |
| `idleDurationSec` | siempre | duración local del período idle |
| `outerPosition` | solo `revealing` | resultado disponible al reconectar |
| `innerPosition` | solo `revealing` | resultado disponible al reconectar |

---

## Riesgos y estado de implementación

### R1 — Cliente arranca mientras el servidor está en `spinning` ✅ Implementado

**Escenario:** El usuario recarga la página o la app se reconecta en mitad de una ronda que ya está girando.

**Causa original:** El cliente arrancaba la animación por `spinDurationSec` completos sin considerar cuánto tiempo llevaba el servidor girando.

**Implementación:**
- El servidor incluye `spinStartedAt` (ISO timestamp) en la respuesta cuando `state === 'spinning'`.
- `handleRoundData()` calcula `elapsedSec = (Date.now() - new Date(spinStartedAt)) / 1000`.
- `triggerSpin()` recibe `remainingDurationSec = max(0, spinDurationSec - elapsedSec)`.
- `SpinCommand` lleva `outerDurationMs` e `innerDurationMs` precalculados (90% y 100% del tiempo restante).
- `spinToResult()` en `WheelContainerComponent` acepta esos valores y los usa como duración de la CSS transition.
- Si `remainingDurationSec <= 0`: salta directamente a `REVEALING` sin animar (el giro ya terminó en el servidor).

---

### R2 — Polling muerto si `notifySpinComplete()` no se llama ✅ Implementado

**Escenario:** La animación falla, el componente se destruye antes de terminar, o hay una excepción en el callback de `spinCommand$`.

**Causa original:** No había ningún mecanismo de timeout. El orquestador podía quedar congelado en `SPINNING` indefinidamente.

**Implementación:** `spinGuardTimeout` en `triggerSpin()`:

```typescript
this.spinGuardTimeout = setTimeout(() => {
  if (this.stateSubject.value === 'SPINNING') {
    console.warn('[Orchestrator] Safety timeout — forzando notifySpinComplete()');
    this.notifySpinComplete();
  }
}, cmd.innerDurationMs + 5000);
```

Se cancela si `notifySpinComplete()` se llama antes. El margen de 5s absorbe latencia de red y variaciones de animación.

---

### R3 — ACK fire-and-forget ✅ Implementado

**Escenario:** El ACK a `/round/:id/ack` falla por red.

**Implementación:** `sendAck()` reintenta hasta 3 veces con backoff exponencial (2s, 4s):

```typescript
private sendAck(roundId: number, attempt = 1): void {
  this.http.post(...).subscribe({
    error: (err) => {
      if (attempt < 3) setTimeout(() => this.sendAck(roundId, attempt + 1), attempt * 2000);
      else console.error('[Orchestrator] ACK fallido tras 3 intentos:', err);
    }
  });
}
```

---

### R4 — `REVEAL_DURATION_SEC` hardcodeado en cliente ✅ Implementado

**Causa original:** El cliente asumía 15s de revealing independientemente de lo que configurase el servidor.

**Implementación:** El servidor incluye `revealDurationSec` en todas las respuestas. El cliente lo almacena en `lastKnownRevealDurationSec` y lo usa en `notifySpinComplete()`. Fallback a 15s si el campo no viene.

---

### R5 — Animación de reveal al reconectar en `revealing` ✅ Implementado

**Escenario:** El cliente arranca o reconecta mientras el servidor está en `revealing`.

**Implementación:** Se leen `outerPosition`/`innerPosition` en `handleRoundData()` cuando `state === 'revealing'` y se dispara el overlay de resultado si el cliente estaba en `IDLE` (reconexión, no transición normal).

---

### R6 — `lastKnownIdleDurationSec` inferido ✅ Implementado

**Causa original:** El cliente infería la duración del idle observando `secondsRemaining`, lo que fallaba si el idle se acortaba.

**Implementación:** El servidor incluye `idleDurationSec` explícito en todas las respuestas. El cliente lo almacena directamente. Fallback de inferencia mantenido para compatibilidad con servidores que no lo envíen.

---

### R7 — Desync al volver de pestaña oculta ✅ Implementado

**Escenario:** El usuario cambia de pestaña mientras se reproduce la animación de giro, permanece ausente (segundos a minutos), y vuelve.

**Causa raíz — dos relojes con velocidades distintas cuando la pestaña está oculta:**

| Mecanismo | Comportamiento al estar oculto |
|---|---|
| `setTimeout` | Throttled (~1s mínimo), pero eventualmente dispara |
| `requestAnimationFrame` | Completamente pausado — no ejecuta hasta que la pestaña vuelve |

Con el diseño anterior (sin `spinStartedAt`), el `setTimeout` de `spinToResult()` podía disparar mientras la pestaña estaba oculta: el estado JS avanzaba a `RESULT` mientras los `requestAnimationFrame` acumulados en cola ejecutaban al volver, produciendo la animación de rueda y la animación de resultado simultáneamente.

**Solución — Filosofía B (servidor como única fuente de verdad del tiempo):**

En lugar de parchear el cliente para tolerar el desync, se eliminó la posibilidad de que ocurra:

1. **El servidor declara cuándo empezó el giro** (`spinStartedAt`). Cada cliente, sin importar cuándo se conecte o reconecte, calcula su propio `remainingMs = spinDurationMs - elapsed` y anima exactamente lo que falta — no lo que duraría un giro completo.

2. **`visibilitychange` dispara un poll inmediato** al volver la pestaña. Hasta este cambio, el handler `handleVisibilityChange()` existía en el código pero nunca se registraba — faltaba el `addEventListener` en `start()`.

3. **Force resync en `handleRoundData()`**: si el poll de visibilidad devuelve que el servidor ya está en `idle`/`revealing` pero el cliente sigue en `SPINNING`/`REVEALING`, se limpian los timers locales y se acepta el estado del servidor. Antes, el guard bloqueaba silenciosamente cualquier actualización durante esas fases.

**Flujo al volver de pestaña (después del fix):**

```
pestaña visible
  └─ visibilitychange → handleVisibilityChange()
        └─ poll inmediato → GET /round/current
              ├─ servidor en spinning, misma ronda
              │     └─ calcular remainingMs con spinStartedAt
              │           ├─ remainingMs > 0 → animar por lo que falta
              │           └─ remainingMs ≤ 0 → saltar a REVEALING sin animar
              └─ servidor en idle/revealing (cliente atrasado)
                    └─ limpiar timers locales → aceptar estado del servidor
```

**Archivos modificados:**
- `mock-server.js` — `spinStartedAt`, `spinDurationSec`, `revealDurationSec`, `idleDurationSec`
- `round-orchestrator.service.ts` — `addEventListener` en `start()`, force resync en `handleRoundData()`
- `wheel-container.component.ts` — `spinToResult()` acepta `outerDurationMs`/`innerDurationMs`

---

## Resumen por prioridad

| # | Riesgo | Impacto | Estado |
|---|---|---|---|
| R2 | Polling muerto si `notifySpinComplete()` no se llama | Alto — pantalla congelada | ✅ Implementado |
| R7 | Desync al volver de pestaña oculta | Alto — animaciones simultáneas | ✅ Implementado |
| R3 | ACK fire-and-forget | Medio — ronda perdida | ✅ Implementado |
| R1 | Arranque en mitad de `spinning` | Alto — animación desfasada | ✅ Implementado |
| R4 | `REVEAL_DURATION_SEC` hardcodeado | Bajo — countdown incorrecto | ✅ Implementado |
| R6 | `lastKnownIdleDurationSec` inferido | Bajo — countdown incorrecto | ✅ Implementado |
| R5 | No hay reveal al reconectar en `revealing` | Bajo — solo reconexiones | ✅ Implementado |
