# API Endpoints — Spin 38

## Configuración general

| Ítem | Valor |
|------|-------|
| Framework backend | Express.js (Node.js) — `mock-server.js` |
| Base URL Dev | `http://localhost:3000/api` |
| Base URL Prod | `/api` (relativa, mismo servidor) |
| Puerto | `3000` (configurable vía `PORT`) |

### Headers inyectados en todas las requests

Aplicados automáticamente por `src/app/services/auth.interceptor.ts` a cada petición saliente.

| Header | Origen | Descripción |
|--------|--------|-------------|
| `X-Auth-Token` | Query param `?token=` de la URL | Token de sesión |
| `X-Language` | Query param `?lng=` de la URL | Idioma del cliente |
| `X-Param-{key}` | Cualquier otro query param adicional | Parámetros extra |

> Si no hay token, la request pasa sin modificar.
> Un error `401` invalida el token y dispara el evento `TOKEN_INVALID`.

---

## Endpoints

### `GET /api/round/current`

Estado actual de la ronda en curso. Es el endpoint principal; `RoundOrchestratorService` lo consulta en loop.

**Llamado desde:** `src/app/services/round-orchestrator.service.ts:160`
**Frecuencia:** cada 5s si `secondsRemaining < 60`, cada 30s en caso contrario, cada 10s en error.

**Request:** Sin parámetros ni body.

**Response `200`:**
```json
{
  "id": 1,
  "state": "idle",
  "secondsRemaining": 270,
  "spinDurationSec": 30,
  "revealDurationSec": 15,
  "idleDurationSec": 255
}
```

Campos adicionales según estado:

| Estado | Campos extra |
|--------|-------------|
| `"spinning"` | `"spinStartedAt": "2026-06-16T19:00:00.000Z"` |
| `"revealing"` | `"outerPosition": 22, "innerPosition": "00"` |

**Descripción de todos los campos:**

| Campo | Tipo | Siempre presente | Descripción |
|-------|------|-----------------|-------------|
| `id` | `number` | Sí | ID incremental de la ronda |
| `state` | `"idle" \| "spinning" \| "revealing"` | Sí | Estado actual |
| `secondsRemaining` | `number` | Sí | Segundos hasta la próxima transición |
| `spinDurationSec` | `number` | Sí | Duración total del estado spinning (30s) |
| `revealDurationSec` | `number` | Sí | Duración total del estado revealing (15s) |
| `idleDurationSec` | `number` | Sí | Duración total del estado idle |
| `spinStartedAt` | `string` (ISO 8601) | Solo en `"spinning"` | Timestamp de inicio del giro |
| `outerPosition` | `number \| string` | Solo en `"revealing"` | Posición rueda exterior |
| `innerPosition` | `number \| string` | Solo en `"revealing"` | Posición rueda interior |

**Ciclo de estados:**
```
idle ──(countdown = 0)──► spinning ──(30s)──► revealing ──(15s)──► idle
```

---

### `GET /api/round/:id/result`

Resultado de una ronda específica.

**Llamado desde:** `src/app/services/round-orchestrator.service.ts:228`
Se llama cuando el estado cambia a `spinning` y la ronda es nueva.

**Path param:** `:id` — ID de la ronda (`number`).

**Request:** Sin body ni query params.

**Response `200`:**
```json
{
  "roundId": 1,
  "outerPosition": 22,
  "innerPosition": "00",
  "resultLabel": "MOROCHA"
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `roundId` | `number` | ID de la ronda |
| `outerPosition` | `number \| string` | Posición rueda exterior (pool ruleta americana: `0`, `"00"`, `1`–`36`) |
| `innerPosition` | `number \| string` | Posición rueda interior (mismo pool) |
| `resultLabel` | `string \| null` | `"MOROCHA"` si `outerPosition === innerPosition`, `null` en caso contrario |

**Response `404`:**
```json
{ "error": "Resultado no disponible aún para esta ronda" }
```

> El resultado se genera cuando la ronda pasa de `idle` → `spinning`. Retorna `404` si la ronda aún no ha comenzado a girar.

---

### `POST /api/round/:id/ack`

El cliente confirma al backend que recibió y procesó el resultado de la ronda.

**Llamado desde:** `src/app/services/round-orchestrator.service.ts:269`
Inmediatamente después de recibir el resultado de `/result`. Reintenta hasta 3 veces con backoff (2s, 4s).

**Path param:** `:id` — ID de la ronda.

**Request body:** `{}` (vacío)

**Response `200`:**
```json
{ "ok": true }
```

---

### `GET /api/history`

Historial de las últimas rondas completadas.

**Llamado desde:** `src/app/services/round-orchestrator.service.ts:281`
Una sola vez al arrancar, con `?limit=10`.

**Query params:**

| Param | Tipo | Default | Máximo | Descripción |
|-------|------|---------|--------|-------------|
| `limit` | `number` | `20` | `50` | Cantidad de registros a devolver |

**Response `200`** (array, orden descendente — más reciente primero):
```json
[
  {
    "roundId": 3,
    "outerPosition": 7,
    "innerPosition": 14,
    "timestamp": "2026-06-16T19:00:00.000Z",
    "resultLabel": null
  },
  {
    "roundId": 2,
    "outerPosition": "00",
    "innerPosition": "00",
    "timestamp": "2026-06-16T18:55:00.000Z",
    "resultLabel": "MOROCHA"
  }
]
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `roundId` | `number` | ID de la ronda |
| `outerPosition` | `number \| string` | Posición rueda exterior |
| `innerPosition` | `number \| string` | Posición rueda interior |
| `timestamp` | `string` (ISO 8601) | Momento en que la ronda pasó a idle |
| `resultLabel` | `string \| null` | Etiqueta especial o `null` |

---

### `GET /api/health`

Health check del servidor.

**Llamado desde:** `src/app/services/api.service.ts:110` — método `ping()`, para medir latencia y estado de conexión.

**Request:** Sin parámetros.

**Response `200`:**
```json
{
  "status": "ok",
  "uptime": 3600.5
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `status` | `string` | Siempre `"ok"` si el servidor responde |
| `uptime` | `number` | Segundos desde que el proceso arrancó |

---

## Variables de entorno del servidor

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `3000` | Puerto del servidor |
| `ROUND_DURATION_SEC` | `300` | Duración total del ciclo de ronda en segundos |
| `FORCE_MOROCHA` | `0` | `1` para forzar `outerPosition === innerPosition` en todos los resultados |
| `FORCE_LABEL` | — | fuerza un `resultLabel` específico en todos los resultados |
