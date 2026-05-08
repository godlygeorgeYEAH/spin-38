# Fase 2 — Limpieza de `home.page` y servicios auxiliares

**Bloque:** A
**Estimación:** 2 días
**Dependencias:** Fase 1 (motor `WheelContainerComponent` portado y limpiado del repo nuevo)
**Entregable:** `home.page` reducido a un esqueleto de ~100–150 líneas, con todos los componentes y servicios irrelevantes del modelo Spin Zodiac eliminados del repo.

## Objetivo

Eliminar del home y del árbol de dependencias todo lo que corresponde al modelo de juego de Spin Zodiac y no tiene lugar en Ruleta de Dupla. `home.page.ts` pasa de 2047 líneas a un esqueleto de aproximadamente 100–150 líneas que solo monta el `WheelContainerComponent` portado en la Fase 1 y gestiona el ciclo de vida básico. El objetivo no es construir la funcionalidad nueva del home — eso sucede en el Bloque B — sino dejarlo vacío y compilando, listo para recibir los componentes nuevos sin que haya código muerto que genere confusión o conflictos.

## Qué se construye / Qué se hace

- **Reducción de `home.page.ts`.** Las 2047 líneas del archivo original se reducen a un esqueleto de ~100–150 líneas. Lo que queda es: carga del componente, inicialización básica, montaje de `WheelContainerComponent` con datos placeholder, y ciclo de vida mínimo. Sin lógica de apuestas, sin panel de balance, sin overlay de resultado, sin botones de compartir.

- **Eliminación de componentes.**
  - `BetHistoryComponent` — el historial personal de apuestas del jugador no existe en un display pasivo de agencia.
  - `GameTutorialComponent` — el tutorial interactivo paso a paso no aplica al modelo.
  - `GameSettingsComponent` — la configuración de partida del jugador no tiene lugar en una pantalla que no acepta interacción.
  - Se eliminan junto con sus archivos de estilos, templates y tests.

- **Eliminación de servicios.**
  - `TutorialService` — manejaba el flujo del tutorial interactivo; eliminado junto con el componente.
  - `AdminAuthService` — implementaba autenticación de administrador con hash/salt via `crypto-js`. No tiene función en este contexto.
  - `crypto-js` se elimina de las dependencias del proyecto (`package.json`).

- **Conservación y evaluación de servicios.**
  - `PerformanceDetectorService` se conserva y porta: los tiers de rendimiento siguen siendo relevantes para adaptar la experiencia al hardware variable de las agencias.
  - `AudioService` se evalúa durante la fase: si se decide mantener audio de revelación de resultado, se porta; si no, se elimina también.

- **Eliminación de pipes.**
  - `FindBetPipe` se elimina. Es específico del sistema de apuestas y no tiene uso en el modelo nuevo.

- **Limpieza de assets.**
  - Se eliminan las carpetas `assets/images/fichas/`, `assets/images/multiplicadores/`, `assets/images/contenedores/` y `assets/images/botones/` — todos los assets del sistema de apuestas que no van a aparecer en ninguna pantalla de Ruleta de Dupla.
  - Los 12 animales del zodiaco chino se reemplazan por imágenes placeholder hasta que lleguen los 38 animales del animalito venezolano.

## Criterio de completitud

- `home.page.ts` tiene entre 100 y 150 líneas y no contiene ninguna referencia a fichas, balance, apuestas, tutorial, historial personal, overlay de resultado, ni botones de compartir.
- `BetHistoryComponent`, `GameTutorialComponent` y `GameSettingsComponent` no existen en el repo (ni sus archivos de estilos, templates ni tests).
- `TutorialService` y `AdminAuthService` no existen en el repo.
- `crypto-js` no aparece en `package.json` ni en `package-lock.json`.
- `FindBetPipe` no existe en el repo.
- Las carpetas `assets/images/fichas/`, `assets/images/multiplicadores/`, `assets/images/contenedores/` y `assets/images/botones/` no existen.
- Los 12 animales del zodiaco han sido reemplazados por imágenes placeholder en `assets/images/animales/`.
- `PerformanceDetectorService` está presente y funcional en el repo.
- La decisión sobre `AudioService` está tomada y ejecutada (portado o eliminado).
- La aplicación compila y corre sin errores en modo desarrollo.
- `home.page` monta `WheelContainerComponent` con datos placeholder y no muestra errores en consola.

## Estado

Pendiente
