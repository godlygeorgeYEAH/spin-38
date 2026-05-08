# Fase 5 — Componentes de UI auxiliar

**Bloque:** B  
**Estimación:** 3 días  
**Dependencias:** `RoundOrchestratorService` con sus observables públicos definidos (puede desarrollarse en paralelo con Fase 4 si el contrato de observables se acuerda antes)  
**Entregable:** Countdown, panel de historial y placeholder de jackpot funcionando e integrados en `home.page`, alimentados por el orquestador

## Objetivo

Completar la pantalla con los elementos informativos que rodean la rueda. La rueda es el elemento central, pero la experiencia en agencia requiere contexto: el jugador necesita saber cuánto tiempo queda para el próximo giro, qué resultados salieron antes, y dónde se muestra el acumulado. Cada componente de esta fase es independiente del resto, consume del orquestador mediante sus observables, y puede construirse en paralelo si hay capacidad de equipo. Al terminar, la pantalla está funcionalmente completa desde la perspectiva del usuario.

## Qué se construye / Qué se hace

- **`CountdownTimerComponent`.**
  - Muestra el tiempo restante hasta el próximo sorteo en formato `mm:ss`.
  - Se suscribe a `secondsToNextRound$` del `RoundOrchestratorService`.
  - Emite un evento o aplica una clase CSS visible cuando llega a cero, usable para disparar una animación de anticipación en la rueda desde `home.page`.
  - Se oculta o muestra un estado alternativo durante `SPINNING` y `REVEALING` (cuando el concepto de "tiempo restante" no aplica).

- **`ResultsHistoryPanelComponent`.**
  - Muestra los últimos 5–6 resultados como duplas de posiciones: números de la ruleta americana en esta etapa, imágenes de animales cuando lleguen los assets.
  - Se actualiza automáticamente después de cada ronda revelada, sin necesidad de interacción del usuario.
  - Consume `recentHistory$` del orquestador.
  - El layout de cada entrada del historial es compatible con render condicional: si hay imagen disponible, muestra imagen; si no, muestra el número — el mismo patrón de la Fase 3B.

- **`JackpotDisplayComponent`.**
  - Placeholder visual con el hueco arquitectural reservado para el acumulado.
  - Muestra `—` o `$0` en esta versión (v1), dejando claro en la UI que el dato existe pero no está conectado aún.
  - El componente está integrado en el layout de `home.page` desde esta fase para que en una iteración futura solo haga falta conectar el observable del dato, sin tocar estructura ni posición en el layout.

## Criterio de completitud

- `CountdownTimerComponent` muestra el countdown en `mm:ss` actualizándose cada segundo a partir de `secondsToNextRound$`.
- El countdown llega a `00:00` y emite el evento de anticipación sin errores.
- `ResultsHistoryPanelComponent` muestra entre 1 y 6 resultados pasados, actualizándose automáticamente al completar cada ronda.
- El panel de historial renderiza los valores numéricos en esta etapa y el layout soporta imagen cuando `item.image` esté disponible.
- `JackpotDisplayComponent` está visible en el layout con `—` o `$0`, en la posición definitiva que ocupará el dato real.
- Los tres componentes están integrados en `home.page` y compilando sin errores.
- Ninguno de los tres componentes realiza llamadas HTTP propias — todos consumen del orquestador.
- La pantalla completa (rueda + countdown + historial + jackpot placeholder) funciona end-to-end contra el mock server en un ciclo de ronda completo.

## Estado

Pendiente
