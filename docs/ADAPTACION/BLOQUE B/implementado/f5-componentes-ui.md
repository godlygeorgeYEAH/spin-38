# Fase 5 — Componentes de UI auxiliar

**Dependencias:** `RoundOrchestratorService` con sus observables públicos definidos (puede desarrollarse en paralelo con Fase 4 si el contrato de observables se acuerda antes)  
**Entregable:** Countdown, panel de historial y placeholder de jackpot funcionando e integrados en `home.page`, alimentados por el orquestador

## Componentes del DOM involucrados

| Selector | Componente | Archivo |
|---|---|---|
| `<app-home>` | `HomePageComponent` | `src/app/home/home.page.ts` — página contenedora donde se integran los tres componentes |
| `<app-wheel-container>` | `WheelContainerComponent` | `src/app/components/wheel-container/wheel-container.component.ts` — rueda central ya existente |
| `<app-countdown-timer>` | `CountdownTimerComponent` | `src/app/components/countdown-timer/countdown-timer.component.ts` — **nuevo** |
| `<app-results-history-panel>` | `ResultsHistoryPanelComponent` | `src/app/components/results-history-panel/results-history-panel.component.ts` — **nuevo** |
| `<app-jackpot-display>` | `JackpotDisplayComponent` | `src/app/components/jackpot-display/jackpot-display.component.ts` — **nuevo** |

## Objetivo

Completar la pantalla con los elementos informativos que rodean la rueda. La rueda es el elemento central, pero la experiencia en agencia requiere contexto: el jugador necesita saber cuánto tiempo queda para el próximo giro, qué resultados salieron antes, y dónde se muestra el acumulado. Cada componente de esta fase es independiente del resto, consume del orquestador mediante sus observables, y puede construirse en paralelo si hay capacidad de equipo. Al terminar, la pantalla está funcionalmente completa desde la perspectiva del usuario.

## Estado

Implementado — 2026-05-20

## Qué se construye / Qué se hace

- **`CountdownTimerComponent` (`<app-countdown-timer>`).**
  - Muestra el tiempo restante hasta el próximo sorteo en formato `mm:ss`.
  - Se suscribe a `secondsToNextRound$` del `RoundOrchestratorService`. Usa el valor del observable como base y decrementa localmente cada segundo con un `setInterval`; cada nuevo valor del observable resetea el tick local para corregir drift.
  - El countdown es visible durante `REVEALING` y `COUNTING_DOWN`; se oculta **solo** durante `SPINNING`.
  - Durante `REVEALING`, `secondsToNextRound$` emite el tiempo combinado (`revealSecondsRemaining + idleSeconds`), por lo que el timer muestra una cuenta regresiva continua desde el inicio del revealing hasta el fin del idle — sin saltos ni resets visibles.
  - Emite `@Output() anticipation` cuando el valor llega a cero, usable para disparar una animación de anticipación desde `home.page` (ver `onAnticipation()` en `home.page.ts`).

- **`ResultsHistoryPanelComponent` (`<app-results-history-panel>`).**
  - Muestra los últimos 6 resultados. Cada entrada tiene **tres columnas**:
    1. **HH:MM** — hora local en que comenzó a girar la rueda, capturada en el cliente en el momento de la transición a `SPINNING`.
    2. **Animal exterior** — imagen del animal correspondiente a `outerPosition`.
    3. **Animal interior** — imagen del animal correspondiente a `innerPosition`.
  - Si no hay imagen disponible para una posición, se muestra el número como fallback (mismo patrón de `WheelContainerComponent`).
  - Las imágenes se resuelven mediante `ANIMAL_MAP`, extraído a `src/app/data/animal-map.ts` como fuente única compartida con `WheelContainerComponent`.
  - El historial se actualiza en dos momentos:
    - **Al arrancar la app** (`orchestrator.start()`): un fetch inicial trae los resultados previos del servidor.
    - **Al comenzar `REVEALING`**: el orquestador inserta el resultado de la ronda actual en `recentHistory$` de forma inmediata, usando la hora y posiciones capturadas durante `SPINNING`, sin esperar al servidor (el servidor solo persiste el resultado al final de `REVEALING`).
  - Consume `recentHistory$` del orquestador; no hace llamadas HTTP propias.
  - `RoundHistoryEntry` tiene campo opcional `spinTime?: string` para la hora del giro — entradas históricas del servidor sin este campo muestran `—`.

- **`JackpotDisplayComponent` (`<app-jackpot-display>`).**
  - Placeholder visual con el hueco arquitectural reservado para el acumulado.
  - Muestra `—` o `$0` en esta versión (v1), dejando claro en la UI que el dato existe pero no está conectado aún.
  - El componente está integrado en el layout de `home.page` desde esta fase para que en una iteración futura solo haga falta conectar el observable del dato, sin tocar estructura ni posición en el layout.
  - **`showJackpot: boolean`** — propiedad en `HomePageComponent` que controla la visibilidad del componente mediante `*ngIf="showJackpot"` en el template. Se inicializa en `false` y se activa manualmente cuando el feature esté listo para mostrarse en producción.

## Criterio de completitud

- `CountdownTimerComponent` muestra el countdown en `mm:ss` actualizándose cada segundo a partir de `secondsToNextRound$`.
- El timer es visible durante `REVEALING` y muestra la suma de revealing + idle restante como una única cuenta regresiva continua.
- El timer se oculta únicamente durante `SPINNING`.
- El countdown llega a `00:00` y emite el evento de anticipación sin errores.
- `ResultsHistoryPanelComponent` muestra entre 1 y 6 resultados, actualizándose automáticamente al iniciar `REVEALING`.
- Cada entrada muestra tres columnas: hora `HH:MM`, imagen del animal exterior e imagen del animal interior.
- Si no existe imagen para una posición, se muestra el número como fallback.
- Al cargar la app, el historial previo del servidor es visible de inmediato (fetch en `start()`).
- Las entradas traídas del servidor sin `spinTime` muestran `—` en la columna de hora.
- `JackpotDisplayComponent` está visible en el layout con `—` o `$0`, en la posición definitiva que ocupará el dato real.
- `showJackpot` está declarado en `HomePageComponent` e inicializado en `false`; cambiar su valor a `true` muestra el componente sin ningún otro cambio de código.
- Los tres componentes están integrados en `home.page` y compilando sin errores.
- Ninguno de los tres componentes realiza llamadas HTTP propias — todos consumen del orquestador.
- La pantalla completa (rueda + countdown + historial + jackpot placeholder) funciona end-to-end contra el mock server en un ciclo de ronda completo.

## Archivos relevantes

| Archivo | Rol |
|---|---|
| `src/app/data/animal-map.ts` | `ANIMAL_MAP` — fuente única del mapeo posición→animal, compartida con `WheelContainerComponent` |
| `src/app/services/round-orchestrator.service.ts` | `recentHistory$`, `revealComplete$`, `lastSpinStartTime`, `lastSpinCommand` |
| `src/app/components/countdown-timer/` | `CountdownTimerComponent` |
| `src/app/components/results-history-panel/` | `ResultsHistoryPanelComponent` + `HistoryDisplayEntry` |
| `src/app/components/jackpot-display/` | `JackpotDisplayComponent` |


