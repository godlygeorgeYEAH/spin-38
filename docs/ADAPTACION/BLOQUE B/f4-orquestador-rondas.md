# Fase 4 — Orquestador de rondas y home final

**Bloque:** B  
**Dependencias:** Fase 3A (mock server activo) y Fase 3B (`WheelContainerComponent` con 38 posiciones y doble giro)  
**Entregable:** Aplicación corriendo end-to-end contra el mock server — la rueda gira, se detiene, y el ciclo se repite automáticamente

## Objetivo

Conectar el motor visual (Fase 3B) con la fuente de datos (Fase 3A) a través de un orquestador que gestiona el ciclo completo de cada ronda. Al terminar esta fase hay algo demostrable al cliente: la pantalla se comporta como se ve en agencia, con rondas automáticas cada 5 minutos y la rueda girando hacia resultados reales del servidor. Es el momento en que las piezas del Bloque B dejan de ser componentes individuales y se convierten en un producto que corre solo.

## Qué se construye / Qué se hace

- **`RoundOrchestratorService`.** Servicio singleton que centraliza toda la lógica de coordinación entre servidor y UI:
  - Consume el mock server mediante HTTP polling adaptativo: cada 30 segundos en estado `idle`, cada 5 segundos cuando quedan menos de 60 segundos para el próximo giro. Esto reduce el tráfico de red en períodos de inactividad sin sacrificar reactividad cuando importa.
  - Gestiona la máquina de estados de la ronda con transiciones explícitas: `IDLE → COUNTING_DOWN → SPINNING → REVEALING → IDLE`.
  - Envía el ACK al servidor (`POST /api/round/:id/ack`) al recibir la orden de giro, antes de iniciar la animación.
  - Llama a `resetToInitialPosition()` en el componente de rueda antes de cada nuevo giro.
  - Invoca `spinToResult` con las posiciones del servidor y espera la notificación de fin de animación antes de avanzar a `REVEALING`.
  - Expone observables públicos para que los componentes hijos se suscriban sin conocer la fuente de datos ni la lógica de polling:
    - `roundState$` — estado actual de la máquina de estados.
    - `secondsToNextRound$` — segundos restantes, emitido cada segundo durante `COUNTING_DOWN`.
    - `recentHistory$` — últimos resultados, actualizado al entrar en `IDLE` después de cada ronda.
- **`home.page` reescrito como orquestador visual.** La página se construye desde el esqueleto dejado en el Bloque A:
  - Monta el `WheelContainerComponent` y le pasa una referencia al servicio orquestador o recibe los eventos necesarios.
  - Se suscribe al orquestador y delega a cada componente hijo su estado correspondiente.
  - Gestiona el ciclo de vida de la pantalla: inicialización, arranque del polling, transiciones visuales entre estados (por ejemplo, suavizar la entrada al estado `SPINNING` con una animación de anticipación).
  - No contiene lógica de ronda propia — toda la coordinación vive en el servicio.

## Criterio de completitud

- La aplicación arranca, inicia el polling contra el mock server, y muestra el estado `COUNTING_DOWN` con un countdown visible.
- Al llegar al momento de giro, el orquestador hace la transición a `SPINNING`, envía el ACK, y la rueda gira hacia el resultado del servidor.
- Ambos anillos se detienen en las posiciones correctas indicadas por el mock server.
- El orquestador transiciona a `REVEALING` solo después de que la animación de ambos anillos ha terminado.
- Tras `REVEALING`, el orquestador transiciona a `IDLE` y el ciclo se repite solo sin intervención manual.
- Dos ciclos consecutivos completos (`IDLE → COUNTING_DOWN → SPINNING → REVEALING → IDLE`) funcionan sin errores en consola.
- El polling reduce su frecuencia a 30 segundos en `IDLE` y la aumenta a 5 segundos cuando `secondsToNextRound$` cae por debajo de 60.
- `home.page` no contiene lógica de ronda directa — toda la coordinación está en `RoundOrchestratorService`.

## Estado

Pendiente
