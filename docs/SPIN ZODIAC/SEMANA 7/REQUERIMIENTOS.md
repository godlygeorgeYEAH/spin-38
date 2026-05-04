# REQUERIMIENTOS - SEMANA 7
## Proyecto Ruleta Zodiaco Chino

**Fecha:** 4 de Diciembre de 2025
**Proyecto:** Ruleta Zodiaco Chino
**Framework:** Angular 20.0 + Ionic 8.0
**Tipo:** Implementaciones, correcciones de bugs y deprecaciones
**Rama Base:** Feature/animaciones
**Rama de Trabajo:** claude/week-7-requirements-01XvfP2y3mDj55WpU74e6Ffq

---

## 2. MEJORAS VISUALES

### 2.1 Mostrar Imagen de Animal Ganador en Elemento de Apuesta Ganada

**Prioridad:** Alta
**Estado:** Pendiente
**Categoría:** Mejora Visual / UX

**Descripción:**
Mostrar la imagen del animal ganador en el elemento visual que muestra el resultado de una apuesta ganada.

**Criterios de Aceptación:**
- [x] La imagen del animal ganador se muestra cuando hay una apuesta ganada
- [x] La imagen es proporcional y visualmente atractiva
- [x] Se mantiene el diseño actual del overlay de resultados
- [x] Funciona correctamente en diferentes tamaños de pantalla

---

### 2.2 Nombres de Animales en la Rueda

**Prioridad:** Media
**Estado:** Pendiente
**Categoría:** Mejora Visual / UX

**Descripción:**
Agregar los nombres de los animales del zodiaco chino en la rueda, junto a sus imágenes, para mejorar la claridad y usabilidad.

**Criterios de Aceptación:**
- [x] Los nombres de animales se muestran en la rueda
- [x] Los textos son legibles en todos los tamaños de pantalla
- [x] El posicionamiento es correcto y no interfiere con las imágenes
- [x] Los nombres rotan correctamente con la rueda
- [x] Se mantiene el rendimiento de la animación

---

## 3. NUEVAS FUNCIONALIDADES

### 3.1 Panel de Historial de Apuestas (Con Botón como el FAQ)

**Prioridad:** Alta
**Estado:** Pendiente
**Categoría:** Nueva Funcionalidad / UX

**Descripción:**
Implementar un panel de historial de apuestas que se active con un botón similar al del FAQ. Los usuarios podrán ver sus apuestas anteriores, resultados y estadísticas.

**Criterios de Aceptación:**
- [x] Botón de historial visible y accesible
- [x] Panel se abre y cierra correctamente
- [x] Se muestran las apuestas anteriores con información completa
- [x] Diseño responsive y coherente con la aplicación
- [x] Datos se persisten correctamente
- [x] Funciona en diferentes dispositivos

**Datos a Mostrar:**
- Fecha y hora de la apuesta
- Animal apostado
- Cantidad apostada
- Resultado (ganó/perdió)
- Ganancia obtenida (si aplica)

---

### 3.2 Sistema Admin

**Prioridad:** Alta
**Estado:** Pendiente
**Categoría:** Nueva Funcionalidad / Administración

**Descripción:**
Implementar un nuevo sistema de administración que reemplace al sistema antiguo. Este sistema permitirá gestionar las configuraciones del juego, visualizar estadísticas y controlar aspectos administrativos.

**Criterios de Aceptación:**
- [x] Sistema de login funcional y seguro
- [x] Panel de administración accesible solo para admins
- [x] Todas las funcionalidades principales implementadas
- [x] Interfaz responsive y fácil de usar
- [x] Datos se guardan correctamente
- [x] Seguridad implementada adecuadamente

---

### 3.3 Sistema de Creación de Monedas (Cambiar el Valor de las Fichas)

**Prioridad:** Media
**Estado:** Pendiente
**Categoría:** Nueva Funcionalidad / Configuración

**Descripción:**
Implementar un sistema que permita crear y configurar diferentes denominaciones de fichas/monedas para las apuestas. Los administradores podrán definir los valores disponibles para los jugadores.

**Criterios de Aceptación:**
- [x] Se pueden crear fichas con diferentes valores
- [x] Las fichas se persisten correctamente
- [x] La configuración se refleja en el juego
- [x] Validaciones funcionan correctamente
- [x] Interfaz intuitiva y clara
- [x] Compatible con el sistema de apuestas actual

**Valores Predeterminados Sugeridos:**
- 10
- 25
- 50
- 100
- 500
- 1000

---

### 3.4 Sistema de Gestión de Balance

**Prioridad:** Alta
**Estado:** Pendiente
**Categoría:** Nueva Funcionalidad / Core

**Descripción:**
Implementar un sistema robusto que maneje automáticamente las actualizaciones de balance durante el juego. El sistema debe gestionar apuestas y ganancias de forma automática y confiable.

**Criterios de Aceptación:**
- [x] Balance se actualiza automáticamente después de cada apuesta
- [x] Balance se actualiza correctamente al ganar
- [x] No permite apuestas sin fondos suficientes
- [x] No hay inconsistencias en el balance
- [x] UI refleja el balance actual en todo momento
- [x] Funciona correctamente en casos edge (sin conexión, errores, etc.)

**Tipos de Transacción:**
```typescript
enum TransactionType {
  BET = 'bet',           // Apuesta realizada
  WIN = 'win',           // Ganancia obtenida
  LOSS = 'loss',         // Pérdida
}
```
// responsive en proceso
---

### 3.5 Implementación de Assets

**Prioridad:** Media
**Estado:** Pendiente
**Categoría:** Recursos / Optimización

**Descripción:**
Organizar, optimizar e implementar todos los assets del proyecto (imágenes, iconos, sonidos, etc.) de manera estructurada y eficiente.

**Tareas:**

1. **Organización:**
   - Crear estructura de directorios clara
   - Mover assets a ubicaciones apropiadas
   - Renombrar archivos con nomenclatura consistente

2. **Optimización:**
   - Comprimir imágenes sin pérdida de calidad
   - Convertir a formatos modernos (WebP, SVG cuando sea posible)
   - Remover assets no utilizados

3. **Implementación:**
   - Actualizar referencias en componentes
   - Implementar preloading de assets críticos
   - Configurar lazy loading para assets grandes

4. **Documentación:**
   - Crear README en carpeta assets
   - Documentar estructura y convenciones
   - Listar todos los assets disponibles

**Criterios de Aceptación:**
- [x] Assets organizados en estructura lógica
- [x] Imágenes optimizadas (reducción de tamaño sin pérdida notable de calidad)
- [x] Todas las referencias actualizadas y funcionando
- [x] No hay assets duplicados
- [x] Documentación de estructura completada
- [x] Tiempos de carga mejorados

**Estructura Propuesta:**
```
src/assets/
├── images/
│   ├── animals/
│   │   ├── rat.svg
│   │   ├── ox.svg
│   │   └── ...
│   ├── ui/
│   │   ├── wheel-bg.png
│   │   ├── pointer.svg
│   │   └── ...
│   └── backgrounds/
│       └── main-bg.jpg
├── icons/
│   ├── favicon.ico
│   └── ...
└── sounds/ (futuro)
```

---

### 3.6 Giro Independiente de Ruedas Interna y Externa

**Prioridad:** Alta
**Estado:** Completado
**Categoría:** Funcionalidad Core / Corrección de Implementación

**Descripción:**
Implementar el giro independiente de ambas ruedas (externa e interna) para garantizar la aleatoriedad correcta del juego. Esta funcionalidad debió estar implementada desde el inicio pero fue detectada durante la revisión de la semana 7.

**Funcionalidad Implementada:**
- Generación de dos índices aleatorios independientes para cada rueda
- Rueda externa determina el animal ganador
- Rueda interna determina el multiplicador independientemente
- Información detallada de ambas ruedas disponible para logging y debugging

**Archivos Modificados:**
- `src/app/interfaces/wheel-general.interface.ts` - Interfaz extendida con campos de debugging
- `src/app/components/wheel-container/wheel-container.component.ts` - Lógica de giro independiente

**Criterios de Aceptación:**
- [x] La rueda interna cae en posiciones aleatorias independientes de la rueda externa
- [x] Cada rueda gira a su propio índice calculado aleatoriamente
- [x] La información de ambas ruedas está disponible en el resultado
- [x] No hay errores de compilación
- [x] Funcionalidad existente no afectada

---

## 4. DEPRECACIONES

### 4.1 DEPRECATE - Apuesta Mínima Automática

**Prioridad:** Media
**Estado:** Pendiente
**Categoría:** Deprecación / Limpieza de Código

**Descripción:**
Deprecar y remover el sistema de apuesta mínima automática.


---

### 4.2 DEPRECATE - Sistema de Admin Antiguo

**Prioridad:** Alta
**Estado:** Pendiente
**Categoría:** Deprecación / Limpieza de Código

**Descripción:**
Remover el sistema de administración antiguo una vez que el nuevo sistema admin (4.2) esté completamente implementado y probado.

**Dependencia:**
Esta tarea depende de la finalización de **3.2 Sistema Admin**

---

## 5. TABLA RESUMEN DE TAREAS

| # | Tarea | Categoría | Prioridad | Estado |
|---|-------|-----------|-----------|--------|
| 2.1 | Imagen de animal ganador | Visual | Alta | Pendiente |
| 2.2 | Nombres en rueda | Visual | Media | Pendiente |
| 3.1 | Panel historial apuestas | Funcionalidad | Alta | Pendiente |
| 3.2 | Sistema admin | Funcionalidad | Alta | Pendiente |
| 3.3 | Sistema de monedas | Funcionalidad | Media | Pendiente |
| 3.4 | Gestión de balance | Funcionalidad | Alta | Pendiente |
| 3.5 | Implementación assets | Recursos | Media | Pendiente |
| 3.6 | Giro independiente ruedas | Funcionalidad Core | Alta | Completado |
| 4.1 | Deprecar apuesta mínima | Deprecación | Media | Pendiente |
| 4.2 | Deprecar admin antiguo | Deprecación | Alta | Pendiente |

---

## 6. DEPENDENCIAS ENTRE TAREAS

```
3.4 (Gestión balance)
    └─> Requerido para 3.3 (sistema monedas)
    └─> Requerido para 3.1 (historial apuestas)

3.2 (Sistema admin)
    └─> Debe completarse antes de 4.2 (deprecar admin antiguo)

3.3 (Sistema monedas)
    └─> Depende de 3.4 (gestión balance)

3.6 (Giro independiente ruedas)
    └─> ✅ Completado
```

---

## 7. CRITERIOS DE FINALIZACIÓN

La semana 7 se considerará completa cuando:

- [x] Mejoras visuales implementadas (2.1, 2.2)
- [x] Sistema de balance funcional y probado (3.4)
- [x] Sistema de monedas implementado (3.3)
- [x] Panel de historial funcional (3.1)
- [x] Nuevo sistema admin operativo (3.2)
- [x] Giro independiente de ruedas implementado (3.6) ✅
- [x] Sistema admin antiguo removido (4.2)
- [x] Apuesta mínima automática deprecada (4.1)
- [x] Assets organizados y optimizados (3.5)
- [x] Todos los tests pasando
- [x] Documentación actualizada
- [x] Code review completado
- [x] Deploy en ambiente de testing exitoso

---

