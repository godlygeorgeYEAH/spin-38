# Ruleta de Dupla — Planificación Bloque A: Preparación y demolición controlada

> **Objetivo del bloque:** Establecer la base limpia del proyecto. Al terminar el Bloque A, el equipo tiene un repo funcional con el motor de la ruleta portado, todo el código irrelevante eliminado, y la estructura lista para recibir funcionalidad nueva sin deuda técnica heredada de Spin Zodiac.

---

## Fase 0 — Setup del repo nuevo

**Estimación:** medio día  
**Dependencias externas:** ninguna  
**Entregable:** repo inicializado, estructura definida, primer commit limpio

### Objetivo

Crear el proyecto desde cero. No se parte del repo de Spin Zodiac — el código se va a portar selectivamente en fases posteriores. El propósito de esta fase es que el equipo tenga un punto de partida limpio con las herramientas correctas y la estructura acordada, sin que nadie empiece a trabajar sobre suposiciones distintas sobre cómo está organizado el proyecto.

### Qué se hace

**Inicialización del proyecto.** Se crea el repo con Angular 20 + Ionic 8 + Capacitor 7, usando las mismas versiones que el proyecto original para evitar incompatibilidades al portar código en fases posteriores.

**Estructura de monorepo.** El repo se organiza con dos aplicaciones bajo `apps/`:

```
/ruleta-dupla
  /apps
    /frontend       ← La aplicación Angular + Ionic
    /mock-server    ← Servidor Express (se construye en Fase 6)
  /docs
    contrato-backend.md   ← Se redacta cuando llegue el momento
```

**Configuración del entorno.** Se configuran eslint, prettier y tsconfig con las mismas reglas del proyecto original. Se define el `environment.ts` con el campo `apiUrl` apuntando a `localhost` para desarrollo, listo para ser cambiado cuando el mock server esté vivo.

**Estructura de assets.** Se crea la jerarquía de carpetas en `assets/` (`images/animales/`, `images/rueda/`, `audio/`, etc.) con archivos `.gitkeep` como placeholder. Esto permite que el diseñador o el cliente puedan dropear los assets finales en cualquier momento sin tocar estructura.

**Scripts de desarrollo.** Se definen los scripts en `package.json` equivalentes a los del proyecto original: `start`, `build`, `serve:prod` y `start:network` para exposición en red local (necesario para testing en las TVs de las agencias).

---

## Fase 1 — Portar y limpiar el motor de la ruleta

**Estimación:** 3–4 días  
**Dependencias externas:** ninguna  
**Entregable:** `WheelContainerComponent` funcional en el repo nuevo, con 38 segmentos, sin controles de jugador

### Objetivo

Traer al repo nuevo el único componente de Spin Zodiac que realmente vale: el motor SVG de la ruleta. El componente tiene lógica trigonométrica, animación con easing cubic-bezier, soporte de performance tiers y Safari fixes que tomaron tiempo construir y no tiene sentido reescribir desde cero. Sin embargo, viene con una cantidad importante de funcionalidad que no aplica al modelo de Ruleta de Dupla y que hay que eliminar antes de que se convierta en deuda técnica.

Al terminar esta fase, el componente debe poder recibir un resultado externo, girar hasta él, y notificar que terminó — nada más.

### Qué se conserva

El motor SVG completo: cálculos trigonométricos para paths de segmentos, posicionamiento de imágenes y texto en los anillos, viewBox paramétrico con sistema de ratios documentado. La arquitectura de dos anillos concéntricos en el mismo SVG (`outerWheel` y `innerWheel` como grupos independientes). El sistema de animación con `applySpinAnimation`, `forceStopAnimation` y `monitorWheelRotation`. Los performance tiers que adaptan la experiencia al hardware del dispositivo. El puntero superior con su animación de rebote. El método `spinToResult`, que recibe un resultado externo y gira la rueda hasta él.

### Qué se elimina

El yin-yang central con el botón GIRAR y sus ondas de pulso. Todo el sistema de giro manual: drag con mouse y touch, cálculo de inercia, detección de velocidad. Los clicks sobre segmentos para selección de animales. El método `spinAndGetResult`, que genera el resultado con `Math.random()` localmente — en Ruleta de Dupla el resultado siempre viene del servidor. El confetti. La lógica de selección visual de animales (highlight de segmentos). El tutorial stage que afectaba animaciones del componente.

### Qué se modifica

`segmentsCount` deja de ser una constante hardcodeada en 12 y pasa a ser un `@Input()`, configurado en 38 para este proyecto. El anillo interno deja de mostrar multiplicadores numéricos (`numbers[]`) y pasa a aceptar un segundo array de animales igual al exterior — esto es lo que permite que ambos anillos muestren los 38 animales del animalito venezolano tal como lo pide el cliente. `spinToResult` se extiende para recibir **dos** animales objetivo en vez de uno: uno para el anillo exterior y otro para el interior. Los sentidos de giro de los dos anillos se invierten entre sí.

---

## Fase 2 — Limpieza de `home.page` y servicios auxiliares

**Estimación:** 2 días  
**Dependencias externas:** ninguna  
**Entregable:** `home.page` reducido a esqueleto, componentes y servicios irrelevantes eliminados del repo

### Objetivo

Eliminar del home y del árbol de dependencias todo lo que corresponde al modelo de juego de Spin Zodiac y no tiene lugar en Ruleta de Dupla. `home.page.ts` pasa de 2047 líneas a un esqueleto de aproximadamente 100–150 líneas que solo monta el `WheelContainerComponent` portado en la Fase anterior y gestiona el ciclo de vida básico. El objetivo no es construir la funcionalidad nueva del home — eso sucede en el Bloque B — sino dejarlo vacío y compilando, listo para recibir los componentes nuevos.

### Componentes que se eliminan del repo

`BetHistoryComponent`, `GameTutorialComponent`, `GameSettingsComponent`. Estos tres componentes no tienen ninguna función en un display pasivo de agencia. Se eliminan junto con sus archivos de estilos, templates y tests.

### Servicios que se eliminan del repo

`TutorialService` y `AdminAuthService`. El primero manejaba el flujo del tutorial interactivo paso a paso. El segundo implementaba un sistema de autenticación de administrador con hash/salt via crypto-js — innecesario en este contexto. `crypto-js` se elimina también de las dependencias del proyecto.

### Servicios que se conservan y portan

`PerformanceDetectorService`, dado que los tiers de rendimiento siguen siendo relevantes para adaptar la experiencia al hardware variable de las agencias. `AudioService`, a evaluar durante la fase: si se decide mantener audio de revelación de resultado, se porta; si no, se elimina también.

### Qué queda en `home.page` al terminar

Una página que carga, muestra el loading screen mientras inicializa, monta el `WheelContainerComponent` sin inputs reales todavía (puede usar datos placeholder), y compila sin errores. Sin panel de apuestas, sin fichas, sin balance, sin historial personal, sin tutorial, sin overlay de resultado, sin botones de compartir.

### Pipes y utilidades

El pipe `FindBetPipe` se elimina. Es específico del sistema de apuestas y no tiene uso en el modelo nuevo.

### Assets

Se eliminan del proyecto las carpetas `assets/images/fichas/`, `assets/images/multiplicadores/`, `assets/images/contenedores/` y `assets/images/botones/` — todos los assets visuales del sistema de apuestas que no van a aparecer en ninguna pantalla de Ruleta de Dupla. Los assets de animales actuales (los 12 del zodiaco chino) se reemplazan por placeholders hasta que lleguen los 38 animales del animalito venezolano.

---

## Criterio de salida del Bloque A

El Bloque A se considera completo cuando:

- El repo compila y corre sin errores en modo desarrollo.
- `WheelContainerComponent` renderiza una ruleta de dos anillos con 38 segmentos cada uno usando imágenes placeholder.
- `home.page` monta el componente y no contiene ninguna referencia a fichas, balance, tutorial, historial personal ni sistema de apuestas.
- No existe ningún archivo de componente, servicio, pipe o interface que pertenezca exclusivamente al modelo de Spin Zodiac.
- El repo está listo para recibir commits del Bloque B sin conflictos de estructura.