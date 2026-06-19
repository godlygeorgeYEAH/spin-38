# Panel Admin — Comandos de Consola

## Descripción

Sistema de administración accesible desde la consola del navegador (`F12 → Console`).
No tiene interfaz visual: el operador escribe comandos directamente en la consola.

Protegido por autenticación SHA256 + salt con sesión de 8 horas en `sessionStorage`.

---

## Acceso

1. Abrir la aplicación en el navegador
2. Abrir DevTools (`F12`) → pestaña **Console**
3. Ejecutar `adminLogin("admin", "ruleta2025")`
4. Al hacer login exitoso, se imprime el listado completo de comandos disponibles (una sola vez, colapsado)

---

## Referencia de comandos

### Autenticación

| Comando | Descripción |
|---|---|
| `adminLogin("usuario", "contraseña")` | Iniciar sesión |
| `adminLogout()` | Cerrar sesión |
| `adminStatus()` | Ver estado y tiempo restante de sesión |
| `adminChangePassword("actual", "nueva")` | Cambiar contraseña (mínimo 8 caracteres) |
| `adminResetPassword()` | Resetear contraseña a `ruleta2025` (requiere sesión activa) |

**Credenciales por defecto:** `admin` / `ruleta2025`

---

### Fichas

| Comando | Descripción |
|---|---|
| `adminGetCoinValues()` | Ver valores actuales de las 6 fichas |
| `adminSetCoinValues([v1, v2, v3, v4, v5, v6])` | Establecer los 6 valores (positivos, sin duplicados) |
| `adminResetCoinValues()` | Resetear a `[1, 5, 10, 30, 50, 1000]` |

```javascript
adminSetCoinValues([1, 10, 50, 100, 500, 2000])
```

---

### Balance

| Comando | Descripción |
|---|---|
| `adminGetBalance()` | Ver balance actual del jugador |
| `adminSetBalance(monto)` | Establecer un balance exacto |
| `adminAddBalance(monto)` | Sumar o restar balance (negativo para restar) |
| `adminResetBalance()` | Resetear balance a `$10000` |

```javascript
adminSetBalance(50000)
adminAddBalance(-500)   // resta $500
```

---

### Historial de transacciones

| Comando | Descripción |
|---|---|
| `adminGetTransactions()` | Ver todas las transacciones en tabla |
| `adminGetTransactions(20)` | Ver las últimas N transacciones |
| `adminClearTransactions()` | Limpiar historial |

---

### Configuración de ruedas

| Comando | Descripción |
|---|---|
| `adminGetWheelDurations()` | Ver duración actual de ambas ruedas |
| `adminSetOuterWheelDuration(ms)` | Duración rueda externa (1000–30000 ms) |
| `adminSetInnerWheelDuration(ms)` | Duración rueda interna (1000–30000 ms) |
| `adminResetWheelDurations()` | Resetear (externa: 10000 ms, interna: 12000 ms) |

La rueda interna debe ser `>=` a la externa; si es menor, el sistema advierte pero acepta el valor.

```javascript
adminSetOuterWheelDuration(5000)
adminSetInnerWheelDuration(6000)
```

---

### Rendimiento gráfico

| Comando | Descripción |
|---|---|
| `adminGetPerformanceProfile()` | Ver tier y parámetros de rendimiento actuales |
| `adminSetPerformanceTier("high" \| "medium" \| "low")` | Cambiar tier (requiere recarga de página) |

---

### Control de ronda

| Comando | Descripción |
|---|---|
| `adminSpinManual()` | Giro local con posiciones aleatorias, sin animación de resultado |
| `adminSpinManual("17", "3")` | Giro local con posiciones específicas, sin animación de resultado |
| `adminSpinManual("17", "3", "DUPLA")` | Giro con posiciones específicas y animación de resultado |
| `adminSpinResult("DUPLA ESPECIAL")` | Giro con posiciones aleatorias y animación de resultado |
| `adminPingServer()` | Probar conexión: latencia y estado HTTP del servidor |
| `adminConnectionStatus()` | Observar `connectionStatus$` en tiempo real |

#### `adminSpinManual(outerPosition?, innerPosition?, text?)`

Dispara la animación de giro sin pasar por el servidor ni registrar apuesta.

- `outerPosition`: posición de la rueda externa (string). Si se omite, se elige al azar de `animalsForWheel`.
- `innerPosition`: posición de la rueda interna (string). Si se omite, se elige al azar de `animalsForWheel`.
- `text`: texto que se muestra en la animación de resultado (ej. `"DUPLA ESPECIAL"`). Si se omite, el giro termina sin animación de resultado, igual que en producción cuando el servidor no devuelve `resultLabel`.
- Usa las duraciones de giro configuradas en ese momento (`spinDuration` / `innerWheelSpinDuration`).
- El polling al servidor se suspende durante el giro y se reactiva automáticamente al terminar.
- No puede ejecutarse si el sistema está en estado `SPINNING` o `REVEALING`.

```javascript
adminSpinManual()                          // posiciones aleatorias, sin resultado
adminSpinManual("7", "5")                  // outer=7, inner=5, sin resultado
adminSpinManual("7", "5", "DUPLA")         // outer=7, inner=5, con animación de resultado
```

#### `adminSpinResult(text)`

Atajo para disparar un giro con posiciones aleatorias y animación de resultado. Equivale a `adminSpinManual(undefined, undefined, text)`.

- `text`: obligatorio. Texto que se muestra en la animación de resultado.
- Las posiciones se eligen al azar de `animalsForWheel`.
- Replica exactamente el flujo de producción: giro → ruedas se detienen → overlay de resultado con el texto dado.

```javascript
adminSpinResult("DUPLA ESPECIAL")
adminSpinResult("MOROCHA")
```

#### `adminPingServer()`

Realiza una llamada a `GET /api/health` y reporta:
- Endpoint consultado
- Latencia en milisegundos
- Código HTTP de respuesta
- Estado de disponibilidad (`✅` / `❌`)

```
📡 PING SERVIDOR
🔗 Endpoint: http://localhost:3000/api/health
⏱️  Latencia: 12ms
📊 Estado HTTP: 200
✅ Servidor disponible
```

> El mock server expone `GET /api/health` que devuelve `{ status: "ok", uptime: <segundos> }`.

#### `adminConnectionStatus()`

Se suscribe a `connectionStatus$` del orquestador y loguea cada transición en tiempo real:

```
✅ connectionStatus$: online
❌ connectionStatus$: offline
```

Retorna la suscripción RxJS, por lo que se puede detener:

```javascript
const s = adminConnectionStatus();
// ... observar cambios ...
s.unsubscribe();  // dejar de observar
```

---

## Flujo típico de una sesión

```javascript
// 1. Login
adminLogin("admin", "ruleta2025")

// 2. Verificar estado
adminStatus()

// 3. Probar servidor
adminPingServer()

// 4. Ajustar balance para pruebas
adminSetBalance(100000)

// 5. Hacer un giro de prueba (con animación de resultado)
adminSpinResult("DUPLA ESPECIAL")

// 6. Ver transacciones generadas
adminGetTransactions()

// 7. Cerrar sesión
adminLogout()
```

---

## Seguridad

- Contraseña almacenada como `SHA256(password + salt)` — nunca en texto plano.
- Sesión en `sessionStorage`: se destruye al cerrar la pestaña o el navegador.
- Duración máxima de sesión: 8 horas; cada operación verifica la expiración.
- Los logs de debug del juego solo son visibles cuando hay sesión activa.

---

## Comportamiento de consola

Los comandos de admin están diseñados para no contaminar la consola:

- **Mensaje de disponibilidad** (`🔐 Sistema admin disponible`) — aparece una sola vez al cargar la app, independientemente de cuántas veces se recree el componente.
- **Listado de comandos** — se muestra una única vez tras el primer login exitoso, dentro de un grupo colapsado (`console.groupCollapsed`). Se resetea al hacer `adminLogout()`.
- **`adminLogin` con sesión activa** — si se llama mientras ya hay sesión, retorna silenciosamente sin imprimir nada. Para conocer el estado de la sesión usar `adminStatus()`.
- **Registro de window functions** — los comandos se registran en `window` una sola vez por ciclo de vida de la aplicación (flag estático `adminCommandsSetup`), incluso si Angular recrea el componente internamente.

---

## Archivos relevantes

| Archivo | Rol |
|---|---|
| `src/app/services/admin-auth.service.ts` | Autenticación, sesión, cambio de contraseña |
| `src/app/services/api.service.ts` | Método `ping()` usado por `adminPingServer` |
| `src/app/services/round-orchestrator.service.ts` | Método `triggerManualSpin()` usado por `adminSpinManual` y `adminSpinResult` |
| `src/app/home/home.page.ts` | Exposición de todos los comandos en `window` (`setupAdminCommands`) |
| `mock-server.js` | Endpoint `GET /api/health` para `adminPingServer` |

## Estado

Implementado
