# Fase 6 — Integración con backend real

**Bloque:** B
**Estimación:** 3–4 días
**Dependencias:** Fase 4 y Fase 5 completadas. Contrato formal validado y aprobado por Carlos y José Gregorio. Backend de Carlos disponible en un ambiente de pruebas accesible.
**Entregable:** Aplicación corriendo contra el backend real de Carlos y José Gregorio en ambiente de pruebas, sin intervención del mock server.

## Objetivo

Reemplazar el mock server por el backend real de Carlos y José Gregorio. El diseño del orquestador —apuntando a `environment.apiUrl` como única fuente de verdad— hace que el frontend no sepa que cambió la fuente de datos. Esta fase existe porque siempre hay diferencias entre un contrato definido en papel y una implementación real: campos que se llaman distinto, formatos de fecha distintos, latencias que el mock no simuló, comportamientos de error que el servidor real maneja diferente. El propósito es absorber esas diferencias aquí, con tiempo, antes de ir a producción.

## Qué se construye / Qué se hace

- **Cambio de `environment.apiUrl`.** Se apunta la variable de entorno al servidor real de Carlos. El resto del código no cambia si el contrato se cumple.
- **Prueba del flujo completo extremo a extremo** contra el backend real:
  - Polling de estado de ronda (`GET /api/round/current`).
  - Recepción de la orden de giro y envío de ACK (`POST /api/round/:id/ack`).
  - Obtención del resultado (`GET /api/round/:id/result`).
  - Actualización del historial (`GET /api/history`).
- **Ajuste de formatos de respuesta.** Si el backend de Carlos difiere del contrato del mock en nombres de campos, tipos de datos, o estructura de objetos, se ajusta la capa de mapeo en el servicio de datos sin tocar los observables públicos del orquestador ni los componentes.
- **Validación ante latencia real de red.** En las agencias la conexión puede ser variable. Se prueba el comportamiento del polling adaptativo, el timeout del ACK, y la resincronización del estado ante respuestas lentas o perdidas.
- **Conservación del mock server.** El servidor mock se mantiene activo en el repo como herramienta de desarrollo offline, para pruebas de edge cases, y como referencia del contrato en caso de disputas o regresiones.

## Criterio de completitud

- La aplicación corre contra el backend real de Carlos sin errores en consola durante un ciclo completo de ronda (`IDLE → COUNTING_DOWN → SPINNING → REVEALING → IDLE`).
- `environment.apiUrl` apunta al servidor real y no al mock.
- Dos rondas consecutivas completan el ciclo sin errores ni intervención manual.
- El countdown muestra valores coherentes con el tiempo real del servidor, no valores estimados localmente.
- El panel de historial se actualiza con los resultados reales de cada ronda completada.
- El ACK se envía y el servidor lo registra correctamente.
- El comportamiento ante latencia alta (>1 segundo de respuesta) no crashea la aplicación ni congela la UI.
- `npm run mock-server` sigue funcionando de forma independiente para uso en desarrollo offline.

## Estado

Pendiente
