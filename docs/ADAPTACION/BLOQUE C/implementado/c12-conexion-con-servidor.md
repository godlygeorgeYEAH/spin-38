# C12 — Estado de Conexión con el Servidor

## Descripción

`connectionStatus$` es un observable que indica en tiempo real si la aplicación puede comunicarse con el servidor. Se alimenta del ciclo de polling interno de `RoundOrchestratorService` y se espeja en `ApiService`.

La UI **no muestra indicador visual por ahora** — la decisión de exponerlo al jugador queda pendiente para una iteración futura.

---

## Arquitectura

```
RoundOrchestratorService
  └── poll() → GET /round/current
        ├── éxito  → connectionStatus$ emite 'online'
        └── error  → connectionStatus$ emite 'offline'
              └── propaga a ApiService.setConnectionStatus()

ApiService
  └── connectionStatus$  ← espejo, alimentado por el orquestador
```

`RoundOrchestratorService` es la **fuente de verdad**: es el único servicio que hace polling continuo y puede saber si el servidor responde. `ApiService` expone el mismo observable por contrato, pero no tiene ciclo de vida propio.

---

## API pública

### `RoundOrchestratorService`

| Miembro | Tipo | Descripción |
|---|---|---|
| `start()` | `void` | Arranca el ciclo de polling (ya existía) |
| `stop()` | `void` | Detiene el ciclo de polling (ya existía) |
| `connectionStatus$` | `Observable<'online'\|'offline'>` | Estado de conexión, fuente de verdad |

### `ApiService`

| Miembro | Tipo | Descripción |
|---|---|---|
| `start()` | `void` | No-op — ApiService no tiene ciclo propio |
| `stop()` | `void` | No-op — ApiService no tiene ciclo propio |
| `connectionStatus$` | `Observable<'online'\|'offline'>` | Espejo del estado del orquestador |
| `setConnectionStatus(status)` | `void` | Setter interno; llamado por el orquestador |

---

## Comportamiento

- **Valor inicial**: `'offline'` en ambos servicios.
- **Transición a `'online'`**: en cuanto el primer poll de `/round/current` responde con éxito.
- **Transición a `'offline'`**: en el primer poll fallido (error de red, timeout, 5xx).
- **Deduplicación**: el orquestador no emite si el estado no cambia (`value === status`), evitando emisiones redundantes en cada poll.
- **Frecuencia de polling**: cada 5 s (cuando `secondsRemaining < 60`) o 30 s (resto del tiempo). Un fallo reprograma el próximo poll a 10 s.

---

## Consumo desde la UI (ejemplo futuro)

```typescript
// Inyectar el orquestador o ApiService según contexto
this.orchestrator.connectionStatus$.subscribe(status => {
  this.isOnline = status === 'online';
  this.cdr.markForCheck();
});
```

```html
<!-- Cuando se decida mostrar el indicador -->
<div class="connection-dot" [class.online]="isOnline"></div>
```

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/app/services/round-orchestrator.service.ts` | Añadido `connectionStatus$`, `setConnectionStatus()` privado; `poll()` actualiza estado en éxito y error; inyecta `ApiService` |
| `src/app/services/api.service.ts` | Añadido `connectionStatus$`, `setConnectionStatus()`, `start()`, `stop()` |

## Estado

Implementado
