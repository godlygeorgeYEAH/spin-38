# Ruleta de Dupla — Planificación Bloque B: Construcción de funcionalidad nueva

> **Objetivo del bloque:** Construir el producto. Al terminar el Bloque B, la aplicación corre end-to-end: dos anillos girando en sentidos opuestos hacia un resultado dictado por el servidor, countdown visible, historial actualizado en vivo, y comunicación real con el backend de Carlos y José Gregorio. El bloque termina con el producto visualmente terminado.

---

## Fase 3A — Mock server con contrato mínimo
*(Paralela con Fase 3B)*

**Dependencias externas:** ninguna  
**Entregable:** servidor Express corriendo en `apps/mock-server` que simula un ciclo completo de ronda

### Objetivo

Proveer al equipo de frontend una fuente de datos real contra la cual probar el motor de giro. Sin este servidor, las pruebas de `spinToResult` son manuales desde la consola del browser, lo que no representa el flujo real y no escala. El mock server es también documentación ejecutable del contrato: cuando llegue el momento de integrar con Carlos, el código de referencia ya existe y elimina ambigüedades sobre el comportamiento esperado.

### Qué se construye

Un servidor Express en `apps/mock-server` que expone cuatro endpoints y gestiona el ciclo de ronda automáticamente cada X minutos:

`GET /api/round/current` — devuelve el estado actual de la ronda: identificador, estado (`idle`, `spinning`, `revealing`), y segundos restantes hasta el próximo giro.

`GET /api/round/:id/result` — devuelve el resultado de una ronda específica: el animal del anillo exterior y el animal del anillo interior. Se genera aleatoriamente a partir del pool de 38 posiciones de la ruleta americana.

`POST /api/round/:id/ack` — recibe la confirmación del frontend de que recibió la orden de giro. Responde `200 OK`. Registra la recepción en consola para facilitar debugging.

`GET /api/history` — devuelve los últimos N resultados en orden cronológico descendente.

El servidor mantiene estado en memoria (no requiere base de datos), expone un log en consola con cada transición de estado, y acepta un parámetro de configuración para ajustar la duración del ciclo (por ejemplo, 30 segundos en vez de 5 minutos).

Se levanta con `npm run mock-server` desde la raíz del monorepo.

---

## Fase 3B — Doble anillo con números placeholder
*(Paralela con Fase 3A)*

**Estimación:** 2–3 días  
**Dependencias externas:** ninguna  
**Entregable:** `WheelContainerComponent` mostrando los 38 números de la ruleta americana en ambos anillos, girando en sentidos opuestos hacia un resultado externo

### Objetivo

Hacer funcionar el motor portado del Bloque A como el cliente lo describió: dos anillos concéntricos girando en sentidos opuestos, cada uno deteniéndose en una posición distinta dictada por `spinToResult`. Los segmentos muestran los 38 números de la ruleta americana en vez de imágenes de animales placeholder repetidas. Esto cumple dos funciones: permite probar el motor con datos reales antes de tener los assets, y permite verificar visualmente que el orden de posiciones es correcto cuando llegue el mapeo de Carlos.

### Qué se construye

**Orden de posiciones.** Los 38 segmentos de cada anillo se poblan con la secuencia real de la ruleta americana: `0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1, 00, 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2`. Estos números son el `name` de cada `WheelItem`. Cuando lleguen los assets, `image` se popula y el número desaparece del render automáticamente.

**Render condicional.** El template muestra imagen cuando `item.image` existe, y texto del número cuando no. Ningún cambio de lógica necesario al sustituir los assets finales — solo se popula el campo.

**Reset a posición inicial.** Antes de cada giro, el anillo exterior se posiciona en `0` (Delfín) y el interior en `00` (Ballena). Se implementa `resetToInitialPosition()` como método público del componente, llamable desde el orquestador.

**`spinToResult` con dos objetivos.** Recibe `{ outerPosition, innerPosition }` como números de la ruleta americana, resuelve los índices correspondientes en cada anillo, y ejecuta las animaciones de ambos en paralelo con sentidos opuestos.

---

## Fase 4 — Orquestador de rondas y home final
*(Depende de: Fase 3A y Fase 3B)*

**Estimación:** 3–4 días  
**Dependencias externas:** ninguna  
**Entregable:** aplicación corriendo end-to-end contra el mock server — la rueda gira, se detiene, y el ciclo se repite solo

### Objetivo

Conectar el motor (Fase 3B) con la fuente de datos (Fase 3A) a través de un orquestador que gestiona el ciclo completo de la ronda. Al terminar esta fase hay algo demostrable al cliente: la pantalla se comporta como se ve en agencia, con rondas automáticas cada 5 minutos y la rueda girando hacia resultados reales del servidor.

### Qué se construye

**`RoundOrchestratorService`.** Servicio singleton que consume el mock server por HTTP polling adaptativo: cada 30 segundos en estado `idle`, cada 5 segundos cuando quedan menos de 60 segundos para el giro. Gestiona la máquina de estados de la ronda (`IDLE → COUNTING_DOWN → SPINNING → REVEALING → IDLE`), envía el ACK al servidor al recibir la orden de giro, y expone observables para que los componentes se suscriban sin conocer la fuente de datos.

**`home.page` final.** La página se reescribe desde el esqueleto del Bloque A como orquestador visual: monta el `WheelContainerComponent`, se suscribe al orquestador, y delega a cada componente hijo su estado correspondiente. Gestiona el ciclo de vida de la pantalla: inicialización, polling activo, y las transiciones visuales entre estados de ronda.

---

## Fase 5 — Componentes de UI auxiliar
*(Paralelizable con Fase 4)*

**Estimación:** 3 días  
**Dependencias externas:** ninguna  
**Entregable:** countdown, panel de historial y placeholder de jackpot funcionando y alimentados por el orquestador

### Objetivo

Completar la pantalla con los elementos informativos que rodean la rueda. Cada componente es independiente, consume del orquestador, y puede construirse en paralelo al home final si hay capacidad de equipo.

### Qué se construye

**`CountdownTimerComponent`.** Muestra el tiempo restante hasta el próximo sorteo en formato `mm:ss`. Se suscribe a `secondsToNextRound$` del orquestador. Emite un evento visible al llegar a cero que puede usarse para disparar una animación de anticipación en la rueda.

**`ResultsHistoryPanelComponent`.** Muestra los últimos 5–6 resultados como duplas de posiciones (números en esta etapa, imágenes cuando lleguen los assets). Se actualiza automáticamente después de cada ronda revelada. Consume `recentHistory$` del orquestador.

**`JackpotDisplayComponent`.** Placeholder visual con el hueco arquitectural reservado para el acumulado. Muestra `—` o `$0` en v1. El componente existe y está integrado en el layout para que en una iteración futura solo haga falta conectar el dato, sin tocar estructura.

---

## Fase 6 — Integración con backend real
*(Depende de: contrato formal validado por Carlos y José Gregorio)*

**Estimación:** 3–4 días  
**Dependencias externas:** contrato formal aprobado, backend de Carlos disponible para pruebas  
**Entregable:** aplicación corriendo contra el backend real en ambiente de pruebas

### Objetivo

Reemplazar el mock server por el backend real de Carlos y José Gregorio. El frontend no sabe que cambió la fuente de datos — solo cambia `apiUrl` en el `environment`. Esta fase existe para absorber las diferencias que siempre aparecen entre un contrato definido y una implementación real, y resolverlas antes de ir a producción.

### Qué se hace

Se apunta `environment.apiUrl` al servidor real. Se prueba el flujo completo: polling, recepción de orden de giro, ACK, resultado, historial. Se ajustan los formatos de respuesta donde el backend de Carlos difiera del contrato del mock. Se valida el comportamiento ante latencia real de red, que en las agencias puede ser variable.

El mock server se conserva activo en el repo como herramienta de desarrollo offline y testing de edge cases.

---

## Fase 7 — Concepto visual y assets finales
*(Depende de: concepto aprobado por Luis, assets de animales del diseñador)*

**Dependencias externas:** propuesta visual elegida, assets de los 38 animales  
**Entregable:** aplicación visualmente terminada con el estilo "acero aniquilado" y los animales del animalito venezolano

### Objetivo

Vestir el producto funcionalmente completo con la identidad visual definitiva. Esta fase no toca lógica — solo sustituye placeholders por assets reales y aplica los design tokens del concepto aprobado.

### Qué se hace

**Sustitución de placeholders.** Los 38 números en los segmentos se reemplazan por las imágenes de los animales venezolanos. Al tratarse de render condicional implementado desde la Fase 3B, la sustitución es un reemplazo de assets sin cambios de código.

**Design tokens.** Se aplica la paleta metálica "acero aniquilado" en `theme/variables.scss`: gradientes de los segmentos, colores de borde, tipografía, fondo. Se reemplazan los gradientes rojos y dorados heredados de Spin Zodiac.

**Assets de rueda.** Se sustituye el borde decorativo y cualquier elemento gráfico de la rueda que haya llegado del diseñador.

---

## Fase 8 — Resilencia y polish
*(Depende de: Fase 7)*

**Dependencias externas:** ninguna  
**Entregable:** aplicación lista para operar en condiciones reales de agencia

### Objetivo

Preparar la aplicación para el entorno real de las agencias: conexiones inestables, cortes de luz, hardware variable, y pantallas en modo kiosko sin supervisión técnica. Esta fase no agrega funcionalidad visible — agrega robustez.

### Qué se hace

**Manejo de desconexión.** Si el servidor no responde en N intentos consecutivos, la pantalla muestra un estado de "reconectando" sin crashear. Al recuperar conexión, resincroniza el estado de la ronda automáticamente. La última ronda mostrada se conserva en pantalla durante la interrupción.

**Modo kiosko.** Auto-fullscreen al cargar, zoom deshabilitado, navegación fuera de la app bloqueada. La pantalla nunca debería mostrar el browser por accidente.

**Testing en hardware real.** Prueba en las resoluciones y dispositivos target de las agencias. Ajuste de performance tiers si el hardware promedio requiere reducir efectos visuales para mantener animaciones fluidas.

---



## Criterio de salida del Bloque B

El Bloque B se considera completo cuando:

- La aplicación corre contra el backend real de Carlos y José Gregorio sin intervención del mock server.
- Dos rondas consecutivas completan el ciclo `IDLE → SPINNING → REVEALING → IDLE` sin errores.
- El countdown, el historial y el display de jackpot muestran datos reales del servidor.
- Los 38 animales del animalito venezolano aparecen correctamente en los segmentos de ambos anillos.
- El estilo visual corresponde al concepto aprobado por Luis cliente.
- La aplicación se recupera sola tras una desconexión de red de al menos 60 segundos.
- La aplicación corre en modo kiosko en el hardware target sin intervención técnica.