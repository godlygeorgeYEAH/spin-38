# Fase 3B — Doble anillo con números placeholder

**Bloque:** B
**Dependencias:** Fase 1 (motor `WheelContainerComponent` portado y limpiado)  
**Entregable:** `WheelContainerComponent` mostrando los 38 números de la ruleta americana en ambos anillos, girando en sentidos opuestos hacia un resultado externo

## Objetivo

Hacer funcionar el motor portado del Bloque A tal como el cliente lo describió: dos anillos concéntricos girando en sentidos opuestos, cada uno deteniéndose en una posición distinta dictada por `spinToResult`. Los segmentos muestran los 38 números de la ruleta americana en lugar de imágenes de animales, lo que cumple dos funciones simultáneas: permite probar el motor con datos reales antes de tener los assets definitivos, y permite verificar visualmente que el orden de posiciones es correcto cuando llegue el mapeo de Carlos y José Gregorio. Esta fase es paralela a la Fase 3A y sus resultados se unen en la Fase 4.

## Qué se construye / Qué se hace

- **Orden de posiciones real.** Los 38 segmentos de cada anillo se pueblan con la secuencia real de la ruleta americana: `0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1, 00, 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2`. Estos valores son el `name` de cada `WheelItem` en el array de datos del componente.
- **Render condicional por asset.** El template renderiza la imagen del segmento cuando `item.image` existe, y el número en texto cuando no. El mecanismo está pensado de modo que poblar el campo `image` sea suficiente para que el número desaparezca del render — ningún cambio de lógica o template es necesario al sustituir los assets finales por los animales venezolanos.
- **Reset a posición inicial.** Se implementa `resetToInitialPosition()` como método público del componente. Antes de cada giro, el anillo exterior se posiciona en `0` (reservado para el Delfín) y el interior en `00` (reservado para la Ballena). Este método es llamable directamente desde el orquestador de la Fase 4.
- **`spinToResult` con dos objetivos.** El método recibe `{ outerPosition, innerPosition }` como números de la ruleta americana, resuelve los índices correspondientes en el array de cada anillo, y ejecuta las animaciones de ambos anillos en paralelo con sentidos opuestos — el exterior gira en un sentido y el interior en el contrario.
- **Sentidos de giro.** Los dos anillos giran en sentidos opuestos entre sí. Este comportamiento está hardcodeado en la configuración del componente y no requiere que el orquestador lo especifique por llamada.

## Criterio de completitud

- El componente renderiza dos anillos concéntricos con 38 segmentos cada uno, mostrando los números de la ruleta americana en el orden correcto.
- Al inspeccionar el DOM, el orden de los segmentos coincide exactamente con la secuencia `0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1, 00, 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2`.
- Si se popula `item.image` en un segmento, ese segmento muestra imagen y oculta el texto del número, sin cambios de template.
- `resetToInitialPosition()` posiciona el anillo exterior en `0` y el interior en `00` de forma visible y verificable.
- `spinToResult({ outerPosition: X, innerPosition: Y })` gira ambos anillos simultáneamente, el exterior en un sentido y el interior en el contrario, y se detiene con `X` e `Y` en la posición de resultado.
- Al terminar la animación se emite la notificación de fin de giro que el orquestador puede escuchar.
- El componente compila sin errores y no introduce dependencias nuevas fuera de las ya presentes en el proyecto.

## Estado

Pendiente
