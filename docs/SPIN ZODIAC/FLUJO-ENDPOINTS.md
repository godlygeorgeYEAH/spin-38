# FLUJO DE ENDPOINTS - Spin Zodiac

> **Documento conciso:** Cuándo, qué endpoint, qué envía, qué recibe

---

## 📌 RESUMEN RÁPIDO

| Momento | Endpoint | Frecuencia | Descripción |
|---------|----------|------------|-------------|
| **Al cargar la app** | `GET /api/initialConfig` | 1 vez | Obtiene configuración inicial (fichas y multiplicadores) |
| **Al cargar la app** | `GET /api/balance` | 1 vez | Obtiene balance inicial del usuario |
| **Al presionar SPIN** | `POST /api/bet/place` | Cada giro | Registra apuesta, obtiene betId |
| **Inmediatamente después** | `POST /api/spin` | Cada giro | Ejecuta RNG, obtiene resultado |
| **Después de animación** | `GET /api/balance` | Cada giro | Actualiza balance desde backend |
| **Opcional/No usado** | `POST /api/validate-token` | N/A | Validación implícita en primera petición |

---

## 🔄 FLUJO DETALLADO

### 1️⃣ INICIO DE LA APP (HomePage.ngOnInit)

**Momento:** Al cargar la página (una sola vez)

La app hace dos llamados en paralelo para optimizar el tiempo de carga:

#### Endpoint 1A: Configuración Inicial

**Endpoint:** `GET /api/initialConfig`

**Request:**
```http
GET /api/initialConfig
Headers:
  X-Auth-Token: <token del URL>
  X-Language: <lng del URL o 'esp' por defecto>
```

**Response esperada:**
```json
{
  "success": true,
  "data": {
    "coinValues": [50, 100, 150, 200, 500, 5000],
    "multipliers": [2, 3, 4, 6, 10, 20]
  }
}
```

**Qué hace la app con la respuesta:**
- ✅ Si `coinValues` existe y tiene 6 elementos → `this.coinValues = data.coinValues`
- ✅ Si `multipliers` existe y tiene 6 elementos → `this.multiplierValues = data.multipliers` (ordenados de menor a mayor)
- ✅ Si faltan o son inválidos → usa valores por defecto
- ✅ Pasa `multiplierValues` a WheelContainer (que los duplica para 12 posiciones)

**Valores por defecto si backend no responde:**
- `coinValues: [1, 5, 10, 30, 50, 1000]`
- `multiplierValues: [1, 1.5, 2, 3, 5, 10]`

#### Endpoint 1B: Balance Inicial

**Endpoint:** `GET /api/balance`

**Request:**
```http
GET /api/balance
Headers:
  X-Auth-Token: <token del URL>
  X-Language: <lng del URL o 'esp' por defecto>
```

**Response esperada:**
```json
{
  "success": true,
  "data": {
    "balance": 10000,
    "currency": "USD"
  }
}
```

**Qué hace la app con la respuesta:**
- ✅ Establece `this.playerBalance = data.balance`
- ✅ Actualiza el observable `balanceSubject` para reflejar el balance en la UI

**Valor por defecto si backend no responde:**
- `balance: 10000`

---

### 2️⃣ USUARIO PRESIONA "SPIN" (HomePage.spinWheels)

#### Paso 2A: Registrar Apuesta

**Momento:** Al hacer clic en el botón de spin (después de validar balance)

**Endpoint:** `POST /api/bet/place`

**Request:**
```http
POST /api/bet/place
Headers:
  X-Auth-Token: <token>
  X-Language: <lng>
Content-Type: application/json

Body:
{
  "bets": [
    { "animal": "Dragón", "amount": 100 },
    { "animal": "Tigre", "amount": 50 }
  ],
  "totalAmount": 150
}
```

**Response esperada:**
```json
{
  "success": true,
  "data": {
    "betId": "BET1001",
    "timestamp": "2026-02-01T10:30:00.000Z",
    "balanceAfter": 9850
  },
  "message": "Apuesta registrada exitosamente"
}
```

**Qué hace la app con la respuesta:**
- ✅ Guarda `betId` para usarlo en el siguiente request
- ✅ **NO actualiza balance** (ya fue deducido localmente antes de la petición)
- ⚠️ Si `success: false` → muestra error y revierte deducción de balance

---

#### Paso 2B: Ejecutar Giro (RNG Backend)

**Momento:** Inmediatamente después de recibir respuesta de `/api/bet/place`

**Endpoint:** `POST /api/spin`

**Request:**
```http
POST /api/spin
Headers:
  X-Auth-Token: <token>
  X-Language: <lng>
Content-Type: application/json

Body:
{
  "betId": "BET1001"
}
```

**Response esperada:**
```json
{
  "success": true,
  "data": {
    "winningAnimal": "Dragón",
    "winningMultiplier": 5,
    "winAmount": 500,
    "balanceAfter": 10350,
    "isWin": true,
    "bets": [
      { "animal": "Dragón", "amount": 100, "isWinner": true },
      { "animal": "Tigre", "amount": 50, "isWinner": false }
    ]
  },
  "message": "¡Felicidades, ganaste!"
}
```

**Qué hace la app con la respuesta:**
1. ✅ Encuentra el animal ganador: `this.animalsForWheel.find(a => a.name === data.winningAnimal)`
2. ✅ Llama a `wheelContainer.spinToResult({ animal, number: data.winningMultiplier })`
3. ✅ Espera a que termine la animación de la ruleta
4. ✅ Actualiza balance del backend: `this.playerBalance = data.balanceAfter`
5. ✅ Guarda en historial local (localStorage)
6. ✅ Muestra modal de resultado con ganancia

**Backend decide:**
- 🎲 Animal ganador (aleatorio entre 12 animales)
- 🎲 Multiplicador ganador (aleatorio entre valores de `MULTIPLIERS`)
- 💰 Si el jugador ganó (comparando apuestas con animal ganador)
- 💰 Monto ganado (apuesta × multiplicador si ganó)
- 💰 Balance después del giro (balance anterior + ganancia)

---

#### Paso 2C: Actualizar Balance (Después de la Animación)

**Momento:** Después de que la animación de la ruleta termina

**Endpoint:** `GET /api/balance`

**Request:**
```http
GET /api/balance
Headers:
  X-Auth-Token: <token>
  X-Language: <lng>
```

**Response esperada:**
```json
{
  "success": true,
  "data": {
    "balance": 10350,
    "currency": "USD"
  }
}
```

**Qué hace la app con la respuesta:**
- ✅ Actualiza `this.playerBalance = data.balance`
- ✅ Muestra el balance actualizado en la UI
- ✅ Si falla, usa `balanceAfter` del resultado de `/api/spin` como fallback

**Nota:** Este endpoint se llama para garantizar que el balance mostrado sea la fuente de verdad del backend.

---

### 3️⃣ ENDPOINTS NO USADOS (Disponibles pero Opcionales)

#### `POST /api/validate-token`

**Estado:** ✅ Implementado en mock server, ❌ NO usado explícitamente

**Razón:** Token se valida implícitamente en la primera petición (`/api/balance`)

**Request teórico:**
```http
POST /api/validate-token
Headers:
  X-Auth-Token: <token>
```

**Response teórica:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "userId": "USER_001",
    "username": "test_user"
  }
}
```

---

## 🔐 HEADERS AUTOMÁTICOS

Todas las peticiones HTTP incluyen automáticamente estos headers (vía `AuthInterceptor`):

```http
X-Auth-Token: <valor del query param ?token=xxx>
X-Language: <valor del query param ?lng=xxx o 'esp' por defecto>
X-Param-*: <otros query params capturados>
```

**Ejemplo:**
```
URL: http://localhost:8100/?token=test123&lng=esp&userId=456

Headers automáticos:
  X-Auth-Token: test123
  X-Language: esp
  X-Param-userId: 456
```

---

## ⚠️ MANEJO DE ERRORES

### Error 401 (Token Inválido)

**Interceptor automático** captura y muestra alerta:
```
"Tu sesión ha expirado. Por favor, recarga la página."
```

### Error de Conexión

**App maneja con try/catch:**
- Muestra mensaje: `"Error de conexión con el servidor"`
- Revierte deducción de balance si estaba en medio de apuesta
- Usa valores por defecto si falla `/api/balance` inicial

### Backend Retorna `success: false`

**App verifica `response.success`:**
- Muestra `response.message` al usuario
- Revierte operación si es necesario
- Logs en consola para debugging

---

## 📊 DIAGRAMA DE SECUENCIA

```
USUARIO                  FRONTEND                 BACKEND
  |                         |                        |
  |--- Abre app ----------->|                        |
  |                         |--- GET /initialConfig ->|
  |                         |--- GET /balance ------>|
  |                         |<-- coins, multipliers -|
  |                         |<-- balance ------------|
  |                         |                        |
  | (Usuario hace apuestas) |                        |
  |                         |                        |
  |--- Click SPIN --------->|                        |
  |                         |--- POST /bet/place --->|
  |                         |<-- betId --------------|
  |                         |                        |
  |                         |--- POST /spin -------->|
  |                         |<-- resultado RNG ------|
  |                         |                        |
  |                         | (Anima ruleta visual)  |
  |                         |                        |
  |                         |--- GET /balance ------>|
  |                         |<-- balance actualizado |
  |                         |                        |
  |<-- Modal resultado -----|                        |
  |                         |                        |
```

**Nota:** Los endpoints `/api/initialConfig` y `/api/balance` se llaman en paralelo al inicio para optimizar el tiempo de carga.

---

## 🎯 PUNTOS CLAVE

1. **Dos endpoints al iniciar (en paralelo):** `GET /api/initialConfig` + `GET /api/balance`
2. **Tres endpoints por giro:** `POST /api/bet/place` → `POST /api/spin` → `GET /api/balance`
3. **Balance actualizado después de cada giro:** Se llama a `GET /api/balance` después de la animación
4. **Backend decide todo el RNG:** Animal ganador, multiplicador, ganancias
5. **Frontend solo anima:** Recibe resultado y lo muestra visualmente
6. **Configuración cargada una sola vez:** coinValues y multipliers desde `/api/initialConfig`
7. **Balance siempre desde backend:** Nunca se calcula localmente
8. **Headers automáticos:** Token y otros params vía interceptor

---

## 🧪 TESTING CON MOCK SERVER

### Iniciar Mock Server

```bash
node mock-server.js
```

### Usuarios de Prueba

| Token | Balance | Descripción |
|-------|---------|-------------|
| `test123` | $10,000 | Usuario básico |
| `abc123` | $50,000 | Usuario con más fondos |
| `demo` | $100,000 | Usuario demo |

### URL de Prueba

```
http://localhost:8100/?token=test123&lng=esp
```

### Valores Configurados en Mock Server

```javascript
COIN_VALUES = [50, 100, 150, 200, 500, 5000]
MULTIPLIERS = [2, 3, 4, 6, 10, 20]
```

---

## 📞 REFERENCIAS

- **Planificación completa:** [PLANIFICACION-BACKEND-COMUNICACION.md](./PLANIFICACION-BACKEND-COMUNICACION.md)
- **Estado de implementación:** [ESTADO-ACTUAL-IMPLEMENTACION.md](./ESTADO-ACTUAL-IMPLEMENTACION.md)
- **Interfaces TypeScript:** `src/app/interfaces/api-*.interface.ts`
- **Mock Server:** `mock-server.js` (raíz del proyecto)
