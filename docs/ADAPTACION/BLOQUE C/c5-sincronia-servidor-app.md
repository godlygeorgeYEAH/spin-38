# C5 — Análisis de sincronía servidor-app

Auditoría del flujo de polling y estado del orquestador. El objetivo es identificar los puntos donde el cliente y el servidor pueden desincronizarse y proponer mitigaciones.

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
                                  │                       scheduleNextPoll(0) ← único punto de reanudar
                                  └─ state=idle|revealing → scheduleNextPoll(5000|30000)
```

Durante `SPINNING` y `REVEALING`, el poll **se detiene completamente**. El cliente maneja ese período con timers locales.

---

## Puntos de riesgo identificados

### R1 — Cliente arranca mientras el servidor está en `spinning`

**Escenario:** El usuario recarga la página o la app se reinicia en mitad de una ronda que ya está girando.

**Qué pasa:** El cliente recibe `state: spinning` con `id` desconocido (`lastHandledRoundId === null`). Ejecuta `triggerSpin()`, obtiene el resultado, y arranca la animación de giro por `spinDurationSec` completos — aunque el servidor lleva, por ejemplo, 12 segundos girando y quedan solo 3.

**Consecuencia:** El cliente anima durante 30 segundos mientras el servidor ya está en `revealing` desde hace 27. El cliente nunca detecta el desync porque deja de pollear durante `SPINNING`.

**Propuesta:** Al recibir `state: spinning`, incluir en la respuesta el campo `spinStartedAt` (timestamp ISO) o `spinElapsedSec`. El cliente calcula el tiempo restante y acorta `outerDurationMs` / `innerDurationMs` en consecuencia. Si la ronda ya terminó de girar (elapsed ≥ spinDuration), saltar directamente a `REVEALING` sin animar.

---

### R2 — `notifySpinComplete()` no se llama → el polling se detiene para siempre

**Escenario:** La animación de la rueda falla, el componente se destruye antes de terminar, o hay una excepción en el callback de `spinCommand$`.

**Qué pasa:** El orquestador transiciona a `SPINNING` y espera que alguien llame `notifySpinComplete()`. Si nadie lo llama, `scheduleNextPoll()` nunca se ejecuta. El polling muere silenciosamente.

**Consecuencia:** La pantalla queda congelada en `SPINNING` indefinidamente. No hay ningún mecanismo de timeout que rompa este estado.

**Propuesta:** Añadir un timeout de guardia en `triggerSpin()` o al transicionar a `SPINNING`:

```typescript
// Dentro de triggerSpin(), tras emitir spinCommandSubject.next(cmd):
const safetyTimeoutMs = cmd.innerDurationMs + 5000; // 5s de margen
const guard = setTimeout(() => {
  if (this.stateSubject.value === 'SPINNING') {
    console.warn('[Orchestrator] Safety timeout — forzando notifySpinComplete()');
    this.notifySpinComplete();
  }
}, safetyTimeoutMs);
// Cancelar el guard si notifySpinComplete() se llama antes
```

---

### R3 — ACK fire-and-forget: si falla, el servidor no sabe que el cliente recibió el giro

**Escenario:** El ACK a `/round/:id/ack` falla por red (timeout, 500, etc.).

**Qué pasa:** El código actual solo hace `console.warn`. El servidor, dependiendo de su implementación, puede reenviar el spin command en el siguiente poll o puede quedar en un estado de espera.

**Consecuencia:** En el próximo poll el cliente ya tiene `lastHandledRoundId` igual al `id` de la ronda actual, así que no vuelve a disparar `triggerSpin()`. Pero si el servidor decidió resetear el `id` por falta de ACK, el cliente perderá esa ronda sin disparar el giro.

**Propuesta:** Reintentar el ACK con backoff exponencial (2–3 intentos, máx. 10s de espera total). Si agota los reintentos, loguear el error de forma prominente (no solo `warn`). No es necesario bloquear el flujo principal por el ACK — solo asegurar entrega best-effort.

```typescript
private sendAck(roundId: number, attempt = 1): void {
  this.http.post(`${this.baseUrl}/round/${roundId}/ack`, {}).subscribe({
    error: (err) => {
      if (attempt < 3) {
        setTimeout(() => this.sendAck(roundId, attempt + 1), attempt * 2000);
      } else {
        console.error('[Orchestrator] ACK fallido tras 3 intentos:', err);
      }
    }
  });
}
```

---

### R4 — `REVEAL_DURATION_SEC` hardcodeado en cliente: desync con el servidor

**Escenario:** El servidor configura un período de revealing diferente a 15 segundos.

**Qué pasa:** El cliente siempre asume 15s de revealing + `lastKnownIdleDurationSec`. Si el servidor usa 20s, el cliente resume el polling 5 segundos antes de que el servidor haya terminado el revealing, y recibe `state: revealing`. Trata `revealing` igual que `idle`, actualiza el countdown, y reprograma el poll — lo que en la práctica es benigno pero genera polls innecesarios y un countdown incorrecto.

**Propuesta:** El endpoint `/round/current` debería incluir `revealDurationSec` cuando `state === 'revealing'`. El cliente lo usa en lugar del hardcode. Fallback al valor actual de 15s si el campo no viene.

---

### R5 — Estado `revealing` del servidor nunca dispara la animación de reveal

**Escenario:** El cliente arranca (o reconecta) mientras el servidor está en `revealing`.

**Qué pasa:** `handleRoundData()` trata `revealing` igual que `idle` — actualiza el countdown y reprograma el poll. Nunca llama a `RevealService.play()`. El usuario no ve la animación de resultado para esa ronda.

**Consecuencia:** Las reconexiones durante `revealing` resultan en una pantalla sin animación. Para una pantalla de agencia que no se recarga intencionalmente esto es aceptable, pero es un blind spot conocido.

**Propuesta (opcional):** Si el servidor incluye `outerPosition` e `innerPosition` en la respuesta de `state: revealing`, el cliente puede disparar la animación de reveal. Esto requiere un cambio de contrato y coordinación con el backend. Evaluar si el caso de uso lo justifica.

---

### R6 — `lastKnownIdleDurationSec` se desactualiza silenciosamente

**Escenario:** El servidor cambia la duración del período idle entre rondas (ej. de 60s a 90s por un evento especial).

**Qué pasa:** La condición de actualización es `secondsRemaining > lastKnownIdleDurationSec * 0.9`. Si el idle se alarga, la condición eventualmente se cumple y se actualiza. Si el idle se acorta (ej. de 90s a 30s), `lastKnownIdleDurationSec` queda en 90 y el countdown mostrado al usuario es incorrecto durante varias rondas.

**Propuesta:** Exponer `idleDurationSec` como campo explícito en la respuesta del servidor, separado de `secondsRemaining`. El cliente lo usa directamente en lugar de inferirlo. Si no viene, mantener el comportamiento actual como fallback.

---

## Resumen de propuestas por prioridad

| # | Riesgo | Impacto | Complejidad | Prioridad |
|---|---|---|---|---|
| R2 | Polling muerto si `notifySpinComplete()` no se llama | Alto — pantalla congelada para siempre | Baja | **Alta** |
| R3 | ACK fire-and-forget | Medio — ronda perdida si servidor requiere ACK | Baja | **Alta** |
| R1 | Arranque en mitad de `spinning` | Alto — animación desfasada | Media (requiere campo nuevo) | Media |
| R4 | `REVEAL_DURATION_SEC` hardcodeado | Bajo — polls extras, countdown incorrecto | Baja (requiere campo nuevo) | Baja |
| R5 | No hay reveal al reconectar en `revealing` | Bajo — solo afecta reconexiones | Media | Baja |
| R6 | `lastKnownIdleDurationSec` desactualizado | Bajo — countdown visual incorrecto | Baja (requiere campo nuevo) | Baja |

R2 y R3 se pueden implementar puramente en el frontend sin coordinar con el backend. R1, R4, R5, R6 requieren campos nuevos en el contrato del servidor.

## Estado

Pendiente — análisis completo, implementación no iniciada.
