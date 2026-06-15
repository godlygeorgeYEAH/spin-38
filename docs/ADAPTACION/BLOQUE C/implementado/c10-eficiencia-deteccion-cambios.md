# C10 — Eficiencia: detección de cambios y suscripciones (Parte 2)

## Diagnóstico

Tras la limpieza de código muerto (C9), un análisis de rendimiento detectó
patrones que castigaban la detección de cambios y un riesgo de fuga de
memoria. A diferencia de C9, estos cambios **afectan el comportamiento interno**
(rendimiento y ciclo de vida), por lo que se validaron con build.

## Alcance

Lote de **alto valor / bajo riesgo**: `trackBy` faltantes, getters
recalculados, suscripciones sin liberar y consolidación del mensaje de error.
Quedan fuera (opcionales, cosméticos): tracking de `setTimeout` sueltos y
deduplicación de inicialización de audio.

## Hallazgos resueltos

### B — `trackBy` en `*ngFor` de rutas calientes

Sin `trackBy`, Angular destruye y recrea el DOM en cada ciclo de detección.
Se añadió identidad estable a todos los `*ngFor` posicionales:

| Template | Loops | trackBy |
|---|---|---|
| `wheel-container.component.html` | gradientes + segmentos + animales (6 loops) | `trackByIndex` (índice) |
| `bet-history.component.html` | historial + apuestas anidadas | `trackByEntry` (`entry.id`) / `trackByBet` (índice) |
| `home.page.html` | fichas (`coinValues`) | `trackByCoin` (valor) |

`results-history-panel` ya tenía `trackBy`; no se tocó.

### C — Getters recalculados en `bet-history`

`get sortedHistory()` copiaba + ordenaba el array **en cada ciclo de
detección** y devolvía una referencia nueva (rompiendo la identidad del
`*ngFor`). Se convirtió en:

- Propiedad `sortedHistory` recalculada solo en `ngOnChanges` (cuando cambia
  `historyData`, que siempre se reasigna con nueva referencia en `home.page`).
- `ChangeDetectionStrategy.OnPush` en el componente.
- `trackBy` para mantener referencia estable de filas.

Además, el getter `statistics` estaba **muerto** (sin referencias en template
ni código) → eliminado.

### A — Suscripciones sin liberar en `home.page`

5 `subscribe()` al orquestador (`resetCommand$`, `revealComplete$`,
`spinCommand$`, `secondsToNextRound$`, `roundState$`) no se guardaban ni se
liberaban; `ngOnDestroy` no las gestionaba. Se adoptó el patrón `Subscription`
container ya usado por `countdown-timer`, `results-history-panel` y
`reveal-overlay`:

- `private subs = new Subscription()`
- cada suscripción envuelta en `this.subs.add(...)`
- `this.subs.unsubscribe()` en `ngOnDestroy`

### E — Boilerplate de mensaje de error consolidado

4 bloques inline repetían `errorMessage = '...'` + `setTimeout` +
`zone.run(() => { errorMessage=''; markForCheck() })`. Se rutearon al helper
existente `showInfoMessage(message, duration)`, que además se robusteció para
OnPush (`markForCheck` al fijar el mensaje y `zone.run` + `markForCheck` al
limpiarlo). Esto también mejora los ~12 llamadores previos del helper.

## Hallazgo extra (código muerto)

`trackByBet()` en `home.page.ts` no estaba cableado a ningún `*ngFor` (quedó
huérfano de una lista de apuestas ya eliminada). Se reemplazó por `trackByCoin`,
que sí se usa en la lista de fichas.

## Lo que NO cambia

- Comportamiento observable de la app (mismos mensajes, mismos tiempos).
- La lógica de negocio del flujo de apuesta/giro.
- Componentes que ya gestionaban bien sus suscripciones/trackBy.

## Validación

- `ng build --configuration development` → **exit 0**. El único warning
  (`NG8113: CountdownTimerComponent is not used`) es preexistente y ajeno a
  estos cambios.
- Sin referencias rotas: `statistics` y el `trackByBet` muerto eliminados;
  `sortedHistory` ahora es propiedad; todos los `trackBy` cableados.

## Criterios de aceptación

- Los `*ngFor` de rueda, historial y fichas usan `trackBy`.
- `bet-history` es OnPush y no recalcula el orden en cada ciclo.
- `home.page` libera todas sus suscripciones al destruirse.
- El mensaje de error usa un único helper consistente (OnPush-safe).
- El build pasa sin errores nuevos.

## Archivos modificados

| Archivo | Cambios |
|---|---|
| `bet-history.component.ts` | OnPush; `sortedHistory` getter → propiedad en `ngOnChanges`; eliminado getter `statistics` muerto; `trackByEntry`/`trackByBet` |
| `bet-history.component.html` | `trackBy` en los dos `*ngFor` |
| `wheel-container.component.ts` | método `trackByIndex` |
| `wheel-container.component.html` | `trackBy: trackByIndex` en los 6 `*ngFor` |
| `home.page.ts` | `Subscription` container + `subs.add`/`unsubscribe`; `showInfoMessage` OnPush-safe; 4 bloques de error → helper; `trackByBet` muerto → `trackByCoin` |
| `home.page.html` | `trackBy: trackByCoin` en fichas |

## Estado

Implementado
