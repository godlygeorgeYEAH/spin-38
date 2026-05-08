# Fase 3A — Mock server con contrato mínimo

**Bloque:** B  
**Estimación:** Paralela con Fase 3B (sin estimación independiente)  
**Dependencias:** Fase 0 (estructura de monorepo con `apps/mock-server` creada)  
**Entregable:** Servidor Express corriendo en `apps/mock-server` que simula un ciclo completo de ronda, levantado con `npm run mock-server`

## Objetivo

Proveer al equipo de frontend una fuente de datos real contra la cual probar el motor de giro. Sin este servidor, las pruebas de `spinToResult` son manuales desde la consola del browser, lo que no representa el flujo real y no escala. El mock server es también documentación ejecutable del contrato: cuando llegue el momento de integrar con Carlos y José Gregorio, el código de referencia ya existe y elimina ambigüedades sobre el comportamiento esperado. Cada endpoint define con precisión qué devuelve el servidor y en qué formato, antes de que ese servidor exista.

## Qué se construye / Qué se hace

- Servidor Express ubicado en `apps/mock-server`, levantable con `npm run mock-server` desde la raíz del monorepo.
- Cuatro endpoints HTTP que cubren el ciclo completo de una ronda:
  - `GET /api/round/current` — devuelve el estado actual de la ronda: identificador, estado (`idle`, `spinning`, `revealing`), y segundos restantes hasta el próximo giro.
  - `GET /api/round/:id/result` — devuelve el resultado de una ronda específica: la posición del anillo exterior y la posición del anillo interior, generadas aleatoriamente a partir del pool de 38 posiciones de la ruleta americana.
  - `POST /api/round/:id/ack` — recibe la confirmación del frontend de que recibió la orden de giro. Responde `200 OK` y registra la recepción en consola para facilitar debugging.
  - `GET /api/history` — devuelve los últimos N resultados en orden cronológico descendente.
- Gestión automática del ciclo de ronda: el servidor avanza los estados (`idle → spinning → revealing → idle`) cada X minutos sin intervención manual.
- Estado en memoria (sin base de datos): toda la información de ronda activa e historial vive en variables del proceso.
- Log en consola de cada transición de estado para visibilidad del ciclo durante desarrollo.
- Parámetro de configuración (variable de entorno o argumento de arranque) para ajustar la duración del ciclo — por ejemplo, 30 segundos en vez de 5 minutos, para acelerar pruebas locales.

## Criterio de completitud

- `npm run mock-server` levanta el servidor sin errores desde la raíz del monorepo.
- `GET /api/round/current` responde con un objeto que incluye `id`, `state` y `secondsRemaining`.
- `GET /api/round/:id/result` responde con las posiciones del anillo exterior e interior como valores de la secuencia de 38.
- `POST /api/round/:id/ack` responde `200 OK` y el log de consola muestra la recepción.
- `GET /api/history` responde con un array de resultados pasados en orden cronológico descendente.
- El servidor avanza los estados de ronda automáticamente sin intervención manual.
- El ciclo funciona con la duración acortada configurada por parámetro (ej. 30 segundos).
- El frontend de Fase 3B puede apuntar al mock server y recibir respuestas coherentes en cada endpoint.

## Estado

Pendiente
