# C9 — Limpieza de código muerto (Parte 1)

## Diagnóstico

El código acumulaba ramas inalcanzables, métodos sin llamadores y restos de
features ya eliminadas. Estos símbolos no aportaban comportamiento pero
aumentaban la superficie a leer y mantener, y confundían sobre qué está vivo.

Un examen inicial señaló 7 puntos. Un análisis posterior los **verificó uno a
uno sobre la rama de trabajo** (no sobre la rama del examen original, que ya
había divergido), descartó 1 falso positivo y descubrió **8 símbolos muertos
adicionales** más sus cascadas

## Alcance

Solo **borrado de código muerto, sin cambio de comportamiento**. La eficiencia
y refactors (trackBy, fugas de suscripción, getters recalculados) quedan para
una Parte 2 separada.

## Hallazgos eliminados

### wheel-container

La rama `const playerWon = false` era inalcanzable (la detección de victoria
pasó al servidor en `f1-elim-click-segmentos`). Al ser siempre `false`, todo el
subsistema de confetti/victoria que solo se activaba desde ahí quedó muerto:

| Símbolo | Tipo |
|---|---|
| `playerWon` + bloque `if (playerWon)` + ternario `resultDelay` | rama inalcanzable |
| `showConfetti`, `winningInnerAnimalIndex` | campos |
| `confettiArray`, `generateConfettiDistribution()`, `getConfettiColor()` | estado/métodos |
| `.confetti-container` / `.confetti` (template) + reglas y `@keyframes confetti-burst` (CSS) | vista |

### home.page

| Símbolo | Razón |
|---|---|
| `setDevPassword` | sistema legacy DEPRECADO, reemplazado por `setupAdminCommands()` |
| `getDevSecrets()`, `HASH_B64`, `SALT_B64` | solo los usaba `setDevPassword` |
| `import * as CryptoJS` | sin más usos en este archivo (sigue vivo en `admin-auth.service`) |
| `startResultOverlayTimer()` | sin llamadores (temporizador automático eliminado) |
| `resultOverlayTimer`, `resultOverlayInterval` | solo los usaba el timer; se limpió `closeResultOverlay()` |
| `delay()` | helper sin uso (el código usa `setTimeout` directo) |
| `recordLoss()` | sin llamadores (la lógica de balance ya lo cubre) |

### servicios

| Archivo | Símbolo | Razón |
|---|---|---|
| `audio.service.ts` | `playVictory()` + `victorySound` + `isVictoryLoaded` + su init | huérfanos tras quitar confetti |
| `audio.service.ts` | `getEnabled`, `toggleEnabled`, `isReady`, `setMinTimeBetweenClicks`, `getMinTimeBetweenClicks` | accesores sin llamadores |
| `api.service.ts` | `get<T>()`, `post<T>()` genéricos | sin llamadores (todo usa métodos tipados) |
| `performance-detector.service.ts` | `isFeatureEnabled()` | sin llamadores |
| `admin-auth.service.ts` | `MASTER_KEY_ENCRYPTED` | constante sin uso |

## Falso positivo descartado

Los **wrappers de comandos admin** (`adminSetBalance`, `adminAddBalance`,
`adminSetCoinValues`, etc.) NO se tocaron. El examen inicial afirmaba que
"duplican verificación de auth que ya hace el servicio", pero se verificó que
los métodos subyacentes (`setBalance`, `addBalance`, `setCoinValues`) **no**
chequean autenticación: el `if (this.adminAuth.isAuthenticated())` de los
wrappers es la **única capa de auth real**. Eliminarlo sería una regresión de
seguridad.

## Lo que NO cambia

- Comportamiento observable de la app (cero cambios funcionales).
- Dependencia `crypto-js` (la usa `admin-auth.service`).
- Enum `TransactionType.LOSS` y `PerformanceProfile.confettiParticles` (son
  datos/contratos, no código muerto).
- Los wrappers admin y su capa de autenticación.

## Validación

- `pnpm`/`npm` install + `ng build --configuration development` → **exit 0**
  (solo warnings preexistentes de `@import` en SCSS, ajenos a estos cambios).
- `tsc --noEmit -p tsconfig.app.json` → sin errores.
- Búsqueda de referencias colgantes a cada símbolo eliminado → cero resultados.

## Criterios de aceptación

- Ningún símbolo eliminado tiene referencias restantes en `src/`.
- El build de producción/desarrollo pasa sin errores nuevos.
- El comportamiento de la app es idéntico (sin regresiones funcionales).
- La capa de autenticación admin permanece intacta.

## Archivos modificados

| Archivo | Cambios |
|---|---|
| `wheel-container.component.ts` | Eliminada rama `playerWon` y cascada de confetti/victoria (campos + métodos) |
| `wheel-container.component.html` | Eliminado bloque `.confetti-container` |
| `wheel-container.component.css` | Eliminada sección de estilos y `@keyframes` de confetti |
| `home.page.ts` | `setDevPassword`, `getDevSecrets`, `HASH_B64`/`SALT_B64`, import `crypto-js`, `startResultOverlayTimer` + campos, `delay()`, `recordLoss()` |
| `audio.service.ts` | `playVictory()` + infra `victorySound`/`isVictoryLoaded`; accesores sin uso |
| `api.service.ts` | métodos genéricos `get()`/`post()` |
| `performance-detector.service.ts` | `isFeatureEnabled()` |
| `admin-auth.service.ts` | constante `MASTER_KEY_ENCRYPTED` |

Resultado: ~360 líneas eliminadas, 0 cambios de comportamiento.

## Estado

Implementado
