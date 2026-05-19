# Fase 3A — Mock server con contrato mínimo

**Bloque:** B  
**Dependencias:** Fase 0 (estructura de monorepo con `apps/mock-server` creada)  
**Entregable:** Servidor Express corriendo en `mock-server.js` que simula un ciclo completo de ronda, levantado con `npm run mock-server`

## Estado

Implementado

### Notas de implementación

- Servidor en `mock-server.js` (raíz del proyecto). No se creó `apps/mock-server` ya que el proyecto no tiene estructura de monorepo.
- Script agregado en `package.json`: `"mock-server": "node mock-server.js"`.
- Pool de 38 posiciones: valores de la ruleta americana `[0, '00', 1–36]`.
- Ciclo configurable con `ROUND_DURATION_SEC` (default 300s). Uso acortado: `ROUND_DURATION_SEC=30 npm run mock-server`.
- El resultado se genera al inicio del estado `spinning` y queda disponible en `GET /api/round/:id/result` desde ese momento.

### Inicio
(Sintaxis de PowerShell, linux wot?)

# Ciclo normal (5 minutos por ronda)
pnpm run mock-server

# Ciclo acortado para testing (30 segundos por ronda)
$env:ROUND_DURATION_SEC=30; npm run mock-server

# Puerto personalizado
$env:PORT=4000; npm run mock-server
```

El servidor arranca en `http://localhost:3000` por defecto. La consola muestra cada transición de estado en tiempo real.

### Contrato de endpoints

---

#### `GET /api/round/current`

Sin payload.

**Response `200`**
```json
{
  "id": 1,
  "state": "idle",
  "secondsRemaining": 270
}
```

| Campo | Tipo | Valores posibles |
|---|---|---|
| `id` | `number` | Entero incremental, empieza en 1 |
| `state` | `string` | `"idle"` · `"spinning"` · `"revealing"` |
| `secondsRemaining` | `number` | Segundos hasta la próxima transición de estado |

---

#### `GET /api/round/:id/result`

Sin payload. `:id` es el `id` de ronda obtenido de `/current`.

**Response `200`** (disponible desde que el estado entra en `spinning`)
```json
{
  "roundId": 1,
  "outerPosition": 22,
  "innerPosition": "00"
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `roundId` | `number` | Identificador de la ronda |
| `outerPosition` | `number \| string` | Posición del anillo exterior — valor de la ruleta americana (`0`, `"00"`, `1`–`36`) |
| `innerPosition` | `number \| string` | Posición del anillo interior — mismo pool |

**Response `404`** (ronda no iniciada o sin resultado aún)
```json
{ "error": "Resultado no disponible aún para esta ronda" }
```

---

#### `POST /api/round/:id/ack`

**Payload:** ninguno (body vacío).

**Response `200`**
```json
{ "ok": true }
```

---

#### `GET /api/history`

Sin payload. Query param opcional: `?limit=N` (default `20`, máx `50`).

**Response `200`**
```json
[
  {
    "roundId": 3,
    "outerPosition": 7,
    "innerPosition": 14,
    "timestamp": "2026-05-08T12:34:56.789Z"
  },
  {
    "roundId": 2,
    "outerPosition": "00",
    "innerPosition": 0,
    "timestamp": "2026-05-08T12:34:26.789Z"
  }
]
```

Array en orden cronológico descendente (ronda más reciente primero). Campos por entrada idénticos a los de `/result`, más `timestamp` ISO 8601.

---

### Casos de testing

**1. Estado de ronda activa**
```powershell
Invoke-RestMethod http://localhost:3000/api/round/current
# id state secondsRemaining
# -- ----- ----------------
#  1 idle               270
```

**2. Resultado de ronda (disponible durante `spinning` o `revealing`)**
```powershell
# Esperar a que el log muestre "idle → spinning", luego:
Invoke-RestMethod http://localhost:3000/api/round/1/result
# roundId outerPosition innerPosition
# ------- ------------- -------------
#       1            22            00
```
Antes de `spinning`: responde `404 Resultado no disponible aún`.

**3. Confirmación de recepción**
```powershell
Invoke-RestMethod -Method POST http://localhost:3000/api/round/1/ack
# ok
# --
# True
# Consola muestra: [ROUND-1] ACK recibido
```

**4. Historial**
```powershell
# Después de completar al menos una ronda:
Invoke-RestMethod http://localhost:3000/api/history

# Limitar entradas:
Invoke-RestMethod "http://localhost:3000/api/history?limit=5"
```

**5. Ciclo completo con `ROUND_DURATION_SEC=30`**

```powershell
$env:ROUND_DURATION_SEC=30; npm run mock-server
```
Con ciclo de 30s (idle 1s → spinning 15s → revealing 15s), se puede verificar el ciclo completo en menos de un minuto observando los logs de consola:
```
[ROUND-1] idle → spinning  outer=7 inner=14
[ROUND-1] spinning → revealing
[ROUND-1] revealing → idle  (nueva ronda: 2)
```

## Objetivo

Proveer al equipo de frontend una fuente de datos real contra la cual probar el motor de giro. Sin este servidor, las pruebas de `spinToResult` son manuales desde la consola del browser, lo que no representa el flujo real y no escala. El mock server es también documentación ejecutable del contrato: cuando llegue el momento de integrar con Carlos y José Gregorio, el código de referencia ya existe y elimina ambigüedades sobre el comportamiento esperado. Cada endpoint define con precisión qué devuelve el servidor y en qué formato, antes de que ese servidor exista.

## Qué se construye / Qué se hace

- Servidor Express en `mock-server.js`, levantable con `npm run mock-server` desde la raíz del proyecto.
- Cuatro endpoints HTTP que cubren el ciclo completo de una ronda:
  - `GET /api/round/current` — devuelve el estado actual de la ronda: identificador, estado (`idle`, `spinning`, `revealing`), y segundos restantes hasta el próximo giro.
  - `GET /api/round/:id/result` — devuelve el resultado de una ronda específica: la posición del anillo exterior y la posición del anillo interior, como valores de la ruleta americana (38 posiciones).
  - `POST /api/round/:id/ack` — recibe la confirmación del frontend de que recibió la orden de giro. Responde `200 OK` y registra la recepción en consola para facilitar debugging.
  - `GET /api/history` — devuelve los últimos N resultados en orden cronológico descendente.
- Gestión automática del ciclo de ronda: el servidor avanza los estados (`idle → spinning → revealing → idle`) sin intervención manual.
- Estado en memoria (sin base de datos): toda la información de ronda activa e historial vive en variables del proceso.
- Log en consola de cada transición de estado para visibilidad del ciclo durante desarrollo.
- Variable de entorno `ROUND_DURATION_SEC` para ajustar la duración del ciclo.

## Criterio de completitud

- `npm run mock-server` levanta el servidor sin errores.
- `GET /api/round/current` responde con un objeto que incluye `id`, `state` y `secondsRemaining`.
- `GET /api/round/:id/result` responde con las posiciones del anillo exterior e interior como valores de la ruleta americana.
- `POST /api/round/:id/ack` responde `200 OK` y el log de consola muestra la recepción.
- `GET /api/history` responde con un array de resultados pasados en orden cronológico descendente.
- El servidor avanza los estados de ronda automáticamente sin intervención manual.
- El ciclo funciona con la duración acortada configurada por `ROUND_DURATION_SEC`.
- El frontend de Fase 3B puede apuntar al mock server y recibir respuestas coherentes en cada endpoint.
