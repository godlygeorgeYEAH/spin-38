# Fase 8 — Resiliencia y polish

**Dependencias:** Fase 7 completada. Acceso al hardware target de las agencias para pruebas presenciales.
**Entregable:** Aplicación lista para operar en condiciones reales de agencia: sin supervisión técnica, con reconexión automática, y en modo kiosko.

## Objetivo

Preparar la aplicación para el entorno real de las agencias: conexiones inestables, cortes de luz, hardware variable, y pantallas en modo kiosko que nadie va a estar monitoreando técnicamente. Esta fase no agrega funcionalidad visible para el usuario — agrega robustez. El producto funcionalmente terminado de las fases anteriores puede fallar silenciosamente en las agencias si no se trabajan estos aspectos. El objetivo es que la pantalla nunca muestre un estado roto y que vuelva sola sin necesidad de que alguien reinicie el dispositivo.

## Qué se construye / Qué se hace

- **Manejo de desconexión de red.**
  - Si el servidor no responde en N intentos consecutivos de polling, la pantalla entra en un estado de "reconectando" visible para el usuario de la agencia, sin crashear ni quedar congelada en un estado inconsistente.
  - Al recuperar la conexión, la aplicación resincroniza el estado de la ronda automáticamente contra el servidor, sin necesitar recarga manual.
  - La última ronda mostrada se conserva en pantalla durante toda la interrupción, para que la pantalla nunca quede en blanco.

- **Modo kiosko.**
  - La aplicación entra en fullscreen automáticamente al cargar, sin intervención del usuario.
  - El zoom está deshabilitado para que la UI no se deforme por gestos accidentales.
  - La navegación fuera de la app está bloqueada: la pantalla nunca debería mostrar la barra del browser, el desktop, ni ninguna otra aplicación por error de interacción.

- **Testing en hardware real de las agencias.**
  - Prueba de la aplicación en las resoluciones y dispositivos target que se usan en las agencias.
  - Identificación de problemas de performance en hardware con capacidades limitadas.
  - Ajuste de performance tiers si el hardware promedio requiere reducir efectos visuales para mantener las animaciones de los anillos fluidas y sin caídas de frame rate.

## Criterio de completitud

- La aplicación muestra un estado de "reconectando" visible cuando el servidor no responde, sin crashear ni congelarse.
- Al recuperar la conexión, la aplicación resincroniza el estado de la ronda sin recarga manual.
- La última ronda mostrada permanece en pantalla durante una interrupción de red de al menos 60 segundos.
- La aplicación entra en fullscreen automáticamente al cargar en el hardware target de las agencias.
- El zoom está deshabilitado y la navegación fuera de la app está bloqueada.
- La aplicación corre sin intervención técnica durante al menos un ciclo de ronda completo en el hardware real de las agencias.
- Las animaciones de los anillos son fluidas en el hardware target sin caídas de frame rate perceptibles.
- No se observan estados rotos ni pantallas en blanco tras una desconexión y posterior reconexión de red.

## Estado

Pendiente
