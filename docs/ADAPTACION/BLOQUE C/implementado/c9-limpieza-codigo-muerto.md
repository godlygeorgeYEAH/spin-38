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

---

# C9 — Limpieza de código muerto (Parte 2): apuestas, balance y endpoints

## Diagnóstico

El requerimiento surge del **análisis de los endpoints requeridos por la app**.
La app fue adaptada de un juego de apuestas a una **ruleta espectadora dirigida
por `RoundOrchestratorService`** (polling de `/api/round/*`). El giro real lo
emite el orquestador (`spinCommand$` → `wheelContainer.spinToResult()`), no el
endpoint `/api/spin`.

Con ese cambio, todo el **subsistema de apuestas/balance quedó huérfano**: el
código se ejecutaba pero ya no reflejaba ninguna funcionalidad real, y su UI era
**inalcanzable**. Verificado sobre la rama de trabajo:

- `spinWheels()` (cadena `placeBet → spin → getBalance`) solo se alcanzaba por el
  botón "girar de nuevo", que solo aparece con `showResult === true`, valor que
  **solo** seteaba `spinWheels()` mismo. El flujo del orquestador nunca lo activa
  → bucle cerrado sin punto de entrada.
- El balance del jugador (`playerBalance`) no se renderizaba en ninguna parte de
  la plantilla; solo lo usaba la validación de fondos del flujo muerto.
- `getInitialConfig()` se llamaba en el arranque, pero sus valores
  (`coinValues`, `multiplierValues`) solo alimentaban la UI de apuestas muerta y
  un fallback de consola admin; no determinan la rueda real.

## Estado de los endpoints (confirmado)

| Endpoint | Método `ApiService` | Estado | Acción |
|---|---|---|---|
| `POST /api/validate-token` | `validateToken()` | muerto (solo comentado en `main.ts`) | eliminado |
| `GET /api/initialConfig` | `getInitialConfig()` | se llamaba; valores sin uso real | eliminado |
| `GET /api/balance` | `getBalance()` | una llamada sin efecto visible + una en código inalcanzable | eliminado |
| `POST /api/bet/place` | `placeBet()` | en `spinWheels()` inalcanzable | eliminado |
| `POST /api/spin` | `spin()` | inalcanzable; no dirige la rueda | eliminado |
| `GET /api/history` | `getHistory()` | sin llamadores | eliminado |
| `GET /api/health` | `ping()` | **vivo** (consola admin) | conservado |
| `GET /api/round/*` | (orquestador) | **vivo** — núcleo del juego | conservado |

## Hallazgos eliminados

### home.page

| Símbolo | Razón |
|---|---|
| `spinWheels()` + cadena `placeBet → spin → getBalance` | flujo de apuestas inalcanzable |
| `playerBalance`, `balanceSubject`, `balance$`, `transactions`, `DEFAULT_BALANCE` | sistema de balance huérfano |
| `selectedAnimals`, `totalBetAmountSubject`, `currentEditingAnimal`, `gameResult`, `lastWin`, `totalAccumulatedWin`, `showResult` | estado de apuestas/resultado sin uso vivo |
| `coinValues`, `multiplierValues` + sus `DEFAULT_*` | configuración de fichas/multiplicadores no usada por la rueda |
| `deductBet`, `addWinnings`, `calculateWinnings`, `setBalance`, `addBalance`, `updateTotalBetAmount`, `canSpin`, `getDisplayedAnimals`, `getSelectedAnimalNames`, `getCoinImage`, `trackByCoin` | métodos de la lógica de apuestas |
| `setCurrentEditingAnimal`, `addCoinToCurrentAnimal`, `clearAllBets`, `clearAnimalBet`, `clearCurrentAnimalBet`, `showBettingPanel`, `hideBettingPanel` | interacción del panel de apuestas |
| `closeResultOverlay`, `spinAgain`, `clearWheelAndClose`, `resetGame` | overlay de resultado de apuesta |
| `preCaptureScreenshot`, `shareWin`, `downloadCapturedImage` + import `html2canvas` + `@ViewChild('resultCard')` | compartir victoria |
| `loadBetHistory`, `saveBetHistory`, `addToHistory`, `openBetHistory`, `closeBetHistory`, `clearBetHistory`, `betHistory`, `historyIdCounter`, `BET_HISTORY_KEY` | historial de apuestas (reemplazado por el panel de resultados del orquestador) |
| `chipAudio` + `playChipSound()` | sonido exclusivo de fichas |
| `errorMessage` + `showInfoMessage()` | overlay de error solo usado por el flujo de apuestas |
| Comandos admin de **balance/fichas/transacciones** (`adminSetBalance`, `adminAddBalance`, `adminResetBalance`, `adminGetBalance`, `adminGetTransactions`, `adminClearTransactions`, `adminSetCoinValues`, `adminGetCoinValues`, `adminResetCoinValues`) + helper `setCoinValues()` | operaban sobre estado eliminado |
| Inyecciones `NgZone` y `AudioService`, registro `addIcons`/`IonIcon`, import `CountdownTimerComponent`, `AsyncPipe`, `BehaviorSubject` | quedaron sin uso tras el borrado |

### servicios

| Archivo | Símbolo | Razón |
|---|---|---|
| `api.service.ts` | `validateToken`, `getInitialConfig`, `getBalance`, `placeBet`, `spin`, `getHistory` | endpoints obsoletos (ver tabla) |
| `api.service.ts` | imports `HttpHeaders` + interfaces de request/response | sin uso tras quitar los métodos |
| `main.ts` | línea comentada `// return apiService.validateToken()...` | referencia muerta |

### vista y archivos eliminados

| Elemento | Acción |
|---|---|
| `home.page.html` | removidos panel de apuestas, fichas, overlay de resultado, `error-overlay`, `app-bet-history` y header comentado |
| `home.page.css` | eliminadas las reglas de los elementos anteriores |
| `components/bet-history/` | componente eliminado (reemplazado por `results-history-panel`) |
| `pipes/find-bet.pipe.ts` | pipe sin importadores |
| `interfaces/api-request.interface.ts`, `api-response.interface.ts`, `bet-history.interface.ts`, `transaction.interface.ts` | interfaces sin uso |

## Reversión del "falso positivo" de la Parte 1

La Parte 1 **conservó** los wrappers admin de balance/fichas
(`adminSetBalance`, `adminAddBalance`, `adminSetCoinValues`…) porque eran la
**única capa de auth real** sobre una feature de balance entonces viva.

En la Parte 2 esa premisa ya no aplica: **se elimina el balance y las fichas por
completo**, junto con sus métodos subyacentes (`setBalance`, `addBalance`,
`setCoinValues`). Al desaparecer el dato que protegían, los wrappers se eliminan
con ellos **sin regresión de seguridad** (no queda balance ni fichas que
proteger). Los wrappers admin que siguen vigentes (`adminSpinManual`,
`adminPingServer`, duraciones de rueda, rendimiento, autenticación) conservan su
capa de `isAuthenticated()`.

## Lo que NO cambia

- El núcleo vivo del juego: orquestador, `spinToResult`, `reveal`, `ANIMAL_MAP`,
  `gameState`, panel de resultados, jackpot, reloj/búho, video de fondo.
- El modal de audio (`GameSettingsComponent`) y `playPressSound`.
- `ApiService` para auth/token/estado de conexión y `ping()`.
- `mock-server.js` (conserva los endpoints legacy para desarrollo).

## Validación

- `pnpm install --frozen-lockfile` + `ng build --configuration development` →
  **exit 0** (solo warnings preexistentes de `@import` SCSS, ajenos a estos
  cambios).
- Búsqueda de referencias colgantes a cada símbolo/endpoint eliminado → cero
  resultados en `src/`.

## Archivos modificados

| Archivo | Cambios |
|---|---|
| `src/main.ts` | eliminada referencia comentada a `validateToken` |
| `src/app/services/api.service.ts` | eliminados 6 métodos de endpoint + imports/interfaces sin uso |
| `src/app/home/home.page.ts` | eliminado el subsistema de apuestas/balance, historial, compartir y comandos admin asociados (~1.205 líneas) |
| `src/app/home/home.page.html` | removida la UI de apuestas, overlay de resultado y bet-history |
| `src/app/home/home.page.css` | removidas las reglas de estilo asociadas (~1.060 líneas) |
| `src/app/components/bet-history/*` | **eliminado** |
| `src/app/pipes/find-bet.pipe.ts` | **eliminado** |
| `src/app/interfaces/{api-request,api-response,bet-history,transaction}.interface.ts` | **eliminados** |

Resultado: **~3.230 líneas eliminadas**, 0 cambios de comportamiento sobre el
juego vivo (ruleta espectadora).

## Estado

Implementado
