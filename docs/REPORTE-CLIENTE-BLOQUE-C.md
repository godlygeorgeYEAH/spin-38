# Reporte de Desarrollo — Bloque C
## Spin Zodiac · Ruleta Espectadora

**Fecha:** 19 de junio de 2026

---

## Resumen ejecutivo

Este reporte documenta el conjunto de mejoras, correcciones y funcionalidades implementadas durante el Bloque C del proyecto. El trabajo se concentró en cuatro áreas principales:

1. **Robustez y sincronía con el servidor** — el cliente ahora se mantiene en sincronía con el servidor en todos los escenarios de reconexión y cambio de pestaña.
2. **Limpieza de código heredado** — se eliminaron más de 3.500 líneas de código correspondiente al sistema de apuestas original, reduciendo la complejidad del proyecto significativamente.
3. **Mejoras visuales y de rendimiento** — animación del puntero, contenedores decorativos, colores por tema y breakpoints para TV.
4. **Herramientas de administración** — panel de administración por consola del navegador con autenticación segura y comandos de operación.

---

## Estado por tarea

| Tarea | Título | Estado |
|---|---|---|
| C5 | Sincronía servidor-app | ✅ Implementado |
| C6 | Experimento: eliminar fondo de animales | ✅ Implementado |
| C7 | Colores de anillos según tema activo | ✅ Implementado |
| C8 | Refinación de elementos visuales | ✅ Implementado |
| C9 | Limpieza de código muerto (Partes 1 y 2) | ✅ Implementado |
| C10 | Eficiencia: detección de cambios | ✅ Implementado |
| C11 | Panel admin v1 | ✅ Implementado |
| C12 | Estado de conexión con el servidor | ✅ Implementado |
| C13 | Fix: animación del puntero | ✅ Implementado |
| C14 | Contenedores decorativos en animación de resultado | ✅ Implementado |
| C15 | Fix: limpieza de warnings y errores de consola | ✅ Implementado |
| C16 | Breakpoints para TV conectada por HDMI | ✅ Implementado |
| C17 | Panel admin v2 (actualización) | ✅ Implementado |

---

## Detalle por tarea

---

### C5 — Sincronía servidor-app ✅

Se realizó una auditoría completa del ciclo de polling y la máquina de estados del orquestador. Se identificaron y resolvieron todos los escenarios donde el cliente podía desincronizarse con el servidor.

**Escenarios cubiertos:**

- **Arranque en mitad de un giro:** si el cliente se conecta mientras el servidor ya está girando, calcula el tiempo restante usando el campo `spinStartedAt` del servidor y anima exactamente lo que falta, en lugar de iniciar el giro desde el principio.
- **Protección contra polling congelado:** si la animación de giro no notifica su finalización (por excepción o destrucción del componente), un timeout de seguridad de 5 segundos fuerza la continuación del ciclo.
- **Reintentos de ACK:** el mensaje de confirmación al servidor se reintenta hasta 3 veces con backoff exponencial (2s, 4s) en caso de fallo de red.
- **Duración de fases desde el servidor:** las duraciones de los períodos `revealing` e `idle` se leen del servidor en lugar de estar hardcodeadas en el cliente. Esto permite ajustarlas sin actualizar la app.
- **Resincronización al volver de pestaña oculta:** cuando el usuario vuelve a la pestaña, se dispara un poll inmediato. Si el servidor ya avanzó a otra fase, el cliente se adapta al estado del servidor en lugar de seguir con timers locales desactualizados.

---

### C6 — Experimento visual: eliminación de fondo de animales ✅

Se evaluó el aspecto visual de la rueda sin los fondos de color de los segmentos del anillo interior y sin el aro decorativo que los rodea. El experimento se realizó en vivo para revisión del cliente.

---

### C7 — Colores de anillos de resultado según tema activo ✅

Los círculos que enmarcan los animales en la animación de resultado ahora muestran el color del tema visual activo de la rueda (`Clasica`, `Caribe`, `Selva`), en lugar de colores fijos.

- El anillo izquierdo (rueda externa) usa el color primario del tema activo de la rueda externa.
- El anillo derecho (rueda interna) usa el color primario del tema activo de la rueda interna.
- El cambio aplica tanto al fondo como al glow (halo luminoso) de cada círculo.
- Si el tema no se pasa, se mantienen los colores anteriores como fallback (sin regresión).

---

### C8 — Refinación de elementos visuales ✅

Ajustes visuales aplicados:

- **Animales con apariencia similar:** se revisaron y corrigieron los casos de la culebra/iguana y el delfín/ballena dentro de la rueda.
- **Círculo del animal resultante:** el círculo de fondo del animal ganador muestra el color del tema activo (alineado con C7).
- **Nombre del animal:** el nombre del animal resultante se muestra debajo de su imagen en la animación de resultado.

---

### C9 — Limpieza de código muerto (Partes 1 y 2) ✅

Se realizaron dos pasadas de limpieza del código que quedó obsoleto tras la adaptación del proyecto de un juego de apuestas a una ruleta espectadora.

**Parte 1 — ~360 líneas eliminadas:**
- Todo el subsistema de confetti y detección de victoria (movido al servidor).
- Sistema de contraseña legacy, métodos de audio sin uso, métodos genéricos de API sin llamadores.
- Métodos sin referencia en `home.page`, servicios de performance y autenticación.

**Parte 2 — ~3.230 líneas eliminadas:**
- Subsistema completo de apuestas y balance: flujo `placeBet → spin → getBalance`, panel de fichas, overlay de resultado de apuesta, historial de apuestas, compartir victoria.
- Seis endpoints de API que ya no corresponden a la funcionalidad real (`/api/bet/place`, `/api/spin`, `/api/balance`, `/api/history`, `/api/initialConfig`, `/api/validate-token`).
- Componente `bet-history`, pipe `find-bet`, cuatro interfaces de API.
- ~1.060 líneas de CSS asociadas a los elementos eliminados.

**Resultado:** el código activo refleja únicamente la funcionalidad real (ruleta espectadora con orquestador de rondas). El build pasa sin errores. Cero cambios de comportamiento sobre las funciones vivas.

---

### C10 — Eficiencia: detección de cambios y suscripciones ✅

Correcciones de rendimiento y gestión de memoria detectadas tras la limpieza de C9.

- **`trackBy` en listas renderizadas:** sin este identificador, Angular destruye y recrea el DOM en cada ciclo de detección de cambios. Se añadió a los 6 bucles `*ngFor` de la rueda (gradientes, segmentos, animales) y otros.
- **Historial de apuestas en modo `OnPush`:** el getter que ordenaba el historial se recalculaba en cada ciclo; se convirtió en propiedad que solo se actualiza cuando los datos cambian.
- **Suscripciones sin liberar:** cinco suscripciones al orquestador en `home.page` no se cerraban al destruirse el componente, representando un riesgo de fuga de memoria. Se corrigió con el patrón estándar `Subscription` container.
- **Helper de mensajes de error consolidado:** cuatro bloques repetidos de código de error se unificaron en un único helper robusto.

---

### C11 — Panel Admin v1 ✅

Sistema de administración operado desde la consola del navegador (`F12 → Console`), sin interfaz visual. Protegido por autenticación SHA256 + salt con sesión de 8 horas.

**Comandos disponibles:**

| Categoría | Comandos |
|---|---|
| Autenticación | `adminLogin`, `adminLogout`, `adminStatus`, `adminChangePassword`, `adminResetPassword` |
| Fichas | `adminGetCoinValues`, `adminSetCoinValues`, `adminResetCoinValues` |
| Balance | `adminGetBalance`, `adminSetBalance`, `adminAddBalance`, `adminResetBalance` |
| Transacciones | `adminGetTransactions`, `adminClearTransactions` |
| Ruedas | `adminGetWheelDurations`, `adminSetOuterWheelDuration`, `adminSetInnerWheelDuration`, `adminResetWheelDurations` |
| Rendimiento | `adminGetPerformanceProfile`, `adminSetPerformanceTier` |
| Control de ronda | `adminSpinManual`, `adminPingServer` |

**Credenciales por defecto:** `admin` / `ruleta2025`

**Seguridad:** la contraseña nunca se almacena en texto plano; la sesión se destruye al cerrar la pestaña.

---

### C12 — Estado de conexión con el servidor ✅

Se implementó `connectionStatus$`, un observable en tiempo real que indica si la aplicación puede comunicarse con el servidor. Se alimenta del ciclo de polling del orquestador y se expone también desde `ApiService`.

**Comportamiento:**
- Valor inicial: `'offline'`.
- Pasa a `'online'` en cuanto el primer poll responde exitosamente.
- Pasa a `'offline'` en el primer error de red, timeout o respuesta 5xx.
- No emite si el estado no cambió (evita emisiones redundantes en cada poll).

La UI no muestra indicador visual por ahora — la decisión de exponerlo al usuario queda para una iteración futura.

---

### C13 — Fix: animación del puntero durante el giro ✅

**Problema:** el puntero (ancla) no mostraba rebote visible durante la fase rápida del giro. Solo se veía al final, cuando la rueda ya iba lenta.

**Causa:** en la fase rápida, múltiples segmentos se cruzaban dentro de la misma ventana de 16ms. El mecanismo de toggle de clase CSS colapsaba: Angular (en modo `OnPush`) solo renderizaba el estado final de cada ciclo de detección, haciendo que la animación fuera imperceptible.

**Solución:** se reemplazó el toggle de clase por animación directa vía WAAPI (`element.animate()`), con un throttle de 80ms entre rebotes. WAAPI corre en el compositor del navegador, independiente del ciclo de Angular, garantizando hasta ~12 rebotes visibles por segundo durante toda la duración del giro, incluso en la fase rápida inicial.

---

### C14 — Contenedores decorativos en animación de resultado ✅

Se añadieron imágenes PNG decorativas detrás de cada círculo de animal en la animación de resultado:
- `rueda-resultado-izquierda.png` detrás del animal de la rueda externa.
- `rueda-resultado-derecha.png` detrás del animal de la rueda interna.

El tamaño y posición de cada imagen es configurable por breakpoint mediante CSS custom properties en `variables.scss` y `responsive-variables.scss`, siguiendo el patrón responsivo ya establecido en el proyecto.

---

### C15 — Fix: limpieza de warnings y errores de consola ✅

Se eliminó el ruido de consola que existía en ejecución normal:

- **404 masivos de assets:** la lista de precarga en `home.page.ts` estaba obsoleta, referenciando imágenes que ya no existen en disco. Se reconstruyó con solo los assets reales del proyecto.
- **Aviso NG0913 (imagen sobredimensionada):** warning automático de Angular por una imagen decorativa con dimensiones intrínsecas grandes. Se suprimió con `IMAGE_CONFIG`.
- **Error de SVG (`attribute height: negative value`):** en la animación del ojo de buey, un cálculo de punto flotante producía valores negativos en casos borde. Se corrigió clampando el valor a `>= 0`.
- **Código muerto con referencias inexistentes:** se eliminaron rutas a carpetas que no existen (`assets/animals/`, `multiplicadores/`, `fichas/`, etc.).

Resultado: consola limpia en ejecución normal.

---

### C16 — Breakpoints para TV conectada por HDMI ✅

Se implementaron media queries específicas para la configuración habitual del cliente: PC conectada a TV por HDMI, con Chrome en fullscreen. En ese modo el viewport CSS depende del scaling de Windows.

| Nombre | Viewport CSS | Escenario típico |
|---|---|---|
| `TV-HD` | 1366×768 | TV 32" HD con Windows al 100% |
| `TV-FHD-125` | 1536×864 | TV Full HD con Windows al 125% |
| `TV-FHD` | 1920×1080 | TV Full HD con Windows al 100% |
| `TV-QHD` | 2560×1440 | TV 4K con Windows al 150% *(caso más común en 4K)* |
| `TV-QHD-PORTRAIT` | 2560×+ portrait | Orientación vertical |
| `TV-4K` | 3840×2160 | TV 4K con Windows al 100% |

Para probar sin el TV físico: Chrome → `F12` → `Ctrl+Shift+M` → escribir las dimensiones del viewport.

---

### C17 — Panel Admin v2 (actualización) ✅

Versión actualizada del panel admin con nuevas funcionalidades y comportamiento de consola mejorado.

**Nuevos comandos:**

| Comando | Descripción |
|---|---|
| `adminSpinManual("17", "3", "DUPLA")` | Giro con posiciones específicas *y* animación de resultado |
| `adminSpinResult("DUPLA ESPECIAL")` | Giro con posiciones aleatorias y animación de resultado |
| `adminConnectionStatus()` | Observar el estado de conexión en tiempo real (retorna suscripción cancelable) |

**Mejoras de comportamiento en consola:**
- El mensaje "Sistema admin disponible" aparece una sola vez al cargar la app.
- El listado de comandos se muestra una única vez tras el primer login, dentro de un grupo colapsado. Se resetea al hacer logout.
- Si `adminLogin` se llama con sesión ya activa, retorna silenciosamente.
- Los comandos se registran en `window` una sola vez por ciclo de vida, aunque Angular recree el componente internamente.

---

## Notas para el cliente

- Los comandos del panel admin que operaban sobre el sistema de apuestas (`adminSetBalance`, `adminGetCoinValues`, etc.) están documentados en C11 como referencia histórica. Consultar C17 para la lista de comandos vigente o logearse utilizando la consola para ver la lista dentro de la app.
- El indicador visual de estado de conexión (C12) está implementado a nivel de datos. Su presentación en pantalla queda pendiente de decisión de diseño para una iteración futura.
