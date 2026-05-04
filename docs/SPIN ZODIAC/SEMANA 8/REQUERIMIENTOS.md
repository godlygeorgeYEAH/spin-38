# REQUERIMIENTOS - SEMANA 8
## Proyecto Ruleta Zodiaco Chino

**Fecha:** 10 de Diciembre de 2025
**Proyecto:** Ruleta Zodiaco Chino
**Framework:** Angular 20.0 + Ionic 8.0
**Tipo:** Mejoras visuales, UX y correcciones de bugs

---

## 1. EXPERIMENTACIÓN VISUAL

### 1.1 Experimentar con Paleta de Colores

**Prioridad:** Alta
**Estado:** Pendiente
**Categoría:** Diseño Visual / UX

**Descripción:**
Experimentar con diferentes paletas de colores para mejorar la estética y coherencia visual del juego.

**Elementos a Evaluar:**
- Aros de botones
- Panel de apuesta
- Rueda
- Colores de multiplicadores
- Bordes de interfaces

**Criterios de Aceptación:**
- [ ] Paleta de colores documentada
- [ ] Mejora la coherencia visual general
- [ ] Mantiene buena legibilidad
- [ ] Cumple con accesibilidad WCAG 2.1
- [ ] Funciona en modo claro y oscuro (si aplica)

---

## 2. INTERACCIONES Y UX

### 2.1 Cerrar Interfaces al Clickear Fuera

**Prioridad:** Alta
**Estado:** ✅ Completado
**Categoría:** Mejora de UX

**Descripción:**
Implementar funcionalidad para cerrar cualquier modal/interfaz abierta al hacer clic fuera de ella.

**Interfaces Afectadas:**
- Modales de FAQ (Tutorial)
- Panel de historial de apuestas
- Configuraciones
- Overlay de resultados

**Criterios de Aceptación:**
- [x] Click fuera cierra interfaces correctamente
- [x] No interfiere con elementos internos del modal
- [x] Animación de cierre suave
- [x] Funciona en dispositivos táctiles
- [x] No cierra si se hace clic en elementos dentro del modal

**Documentación:** `docs/SEMANA 8/Semana 8 - 2.1 - Cerrar Interfaces al Clickear Fuera.md`

---

### 2.2 Mejorar Visibilidad de FAQ

**Prioridad:** Media
**Estado:** ✅ Completado
**Categoría:** Responsive / UX

**Descripción:**
Mejorar la visibilidad y accesibilidad del FAQ en diferentes resoluciones de pantalla. El modal era muy estrecho (60% de ancho) en móviles, ahora usa 92-95% del viewport.

**Mejoras Implementadas:**
- Ancho optimizado: Desktop 800px, Tablets 95vw, Móviles 92-94vw
- +55% más ancho promedio en dispositivos móviles
- Media query adicional para móviles muy pequeños (≤393px)
- Padding y espaciado optimizado para cada resolución

**Criterios de Aceptación:**
- [x] FAQ legible en móviles (360px - 393px)
- [x] FAQ legible en tablets (768px - 1024px)
- [x] FAQ legible en desktop (1366px+)
- [x] Botón de FAQ siempre visible
- [x] Contenido no se corta en ninguna resolución
- [x] Scroll funciona correctamente

**Archivos Modificados:**
- `game-tutorial.component.css:24, 390-393, 442-446, 484-520`

**Documentación:** `docs/SEMANA 8/Semana 8 - 2.2 - Mejorar Visibilidad FAQ.md`

---

### 2.3 Sonido de Clicketeo

**Prioridad:** Media
**Estado:** ✅ Completado
**Categoría:** Audio / UX

**Descripción:**
Implementar sonido de clicketeo durante el giro de la rueda para mejorar feedback auditivo.

**Criterios de Aceptación:**
- [x] Sonido se reproduce durante el giro automático y ajuste manual
- [x] Velocidad del sonido se sincroniza con velocidad de rueda
- [x] Opción para silenciar/activar mediante botón UI
- [x] Formato de audio optimizado (MP3)
- [x] No afecta el rendimiento (requestAnimationFrame optimizado)
- [x] Volumen apropiado (30% por defecto)
- [x] Funciona en dispositivos móviles y desktop

**Documentación:** [Semana 8 - 2.3 - Sonido de Clicketeo.md](./Semana%208%20-%202.3%20-%20Sonido%20de%20Clicketeo.md)

---

### 2.4 Ajustar Posición de Textos

**Prioridad:** Media
**Estado:** ✅ Completado
**Categoría:** Mejora Visual

**Descripción:**
Ajustar la posición vertical de textos principales usando `translateY()`.

**Textos Ajustados:**
- `.animal-name-text` - Nombre del animal
- `.bet-value` - Valor de apuesta
- `.balance-value` - Saldo del jugador
- `.pill-value` - Valores en badges

**Criterios de Aceptación:**
- [x] Textos correctamente alineados verticalmente
- [x] Cambios aplican a todas las versiones responsive
- [x] Sin superposición con otros elementos
- [x] Legibles en todas las resoluciones

**Documentación:** [Semana 8 - 2.4 - Ajustar Posicion de Textos.md](./Semana%208%20-%202.4%20-%20Ajustar%20Posicion%20de%20Textos.md)

---

## 3. ASSETS Y OPTIMIZACIÓN

### 3.1 Implementar Auras en Formato WebM

**Prioridad:** Media
**Estado:** ✅ Completado
**Categoría:** Assets / Optimización

**Descripción:**
Se implementó un video WebM con canal alfa (transparencia) que muestra luces animadas girando alrededor de la rueda de la fortuna.

**Tareas:**
- Convertir videos de auras a formato WebM
- Probar rendimiento vs formato actual
- Implementar fallback para navegadores sin soporte
- Optimizar tamaño de archivo

**Criterios de Aceptación:**
- [x] Video WebM con transparencia implementado
- [x] Luces giran alrededor de la rueda
- [x] Fondo completamente transparente
- [x] No interfiere con interacciones de la rueda
- [x] Reproducción automática en loop
- [x] Compatible con todos los navegadores modernos
- [x] Sin impacto en rendimiento

**Documentación:** [Semana 8 - 3.1 - Auras en Formato WebM.md](./Semana%208%20-%203.1%20-%20Auras%20en%20Formato%20WebM.md)

---

### 3.2 Ajustar Fondos Responsive

**Prioridad:** Alta
**Estado:** Pendiente
**Categoría:** Responsive / Visual

**Descripción:**
Ajustar los fondos para que se visualicen correctamente en todas las resoluciones.

**Criterios de Aceptación:**
- [ ] Fondos cubren toda la pantalla
- [ ] Sin distorsión en ninguna resolución
- [ ] Optimizados para diferentes aspect ratios
- [ ] Carga eficiente (lazy loading si es necesario)
- [ ] Funciona en móviles (360px+)
- [ ] Funciona en desktop (hasta 4K)

---

### 3.3 Mejorar Resolución de Animales en Móviles

**Prioridad:** Alta
**Estado:** ✅ Completado
**Categoría:** Optimización Visual / Responsive

**Descripción:**
Se corrigió la pixelación de las imágenes de animales en dispositivos móviles cambiando la propiedad `image-rendering` de `pixelated`/`crisp-edges` a `auto`.

**Solución Implementada:**
- Tablets (≤768px): `image-rendering: -webkit-optimize-contrast; auto;`
- Móviles (≤480px): `image-rendering: -webkit-optimize-contrast; auto;`
- Permite aprovechar imágenes MINGORE de alta resolución (~1MB)

**Criterios de Aceptación:**
- [x] Imágenes nítidas en pantallas móviles
- [x] Sin pixelación visible
- [x] Aprovecha imágenes de alta resolución existentes
- [x] Compatible con WebKit (Safari, Chrome móvil)
- [x] No afecta rendimiento

**Archivos Modificados:**
- `wheel-container.component.css:381-382, 416-417`

**Documentación:** [Semana 8 - 3.3 - Mejorar Resolucion Animales Moviles.md](./Semana%208%20-%203.3%20-%20Mejorar%20Resolucion%20Animales%20Moviles.md)

---

## 4. MEJORAS AL ELEMENTO DE VICTORIA

### 4.1 Mejorar Overlay de Victoria

**Prioridad:** Alta
**Estado:** ✅ Completado
**Categoría:** UX / Visual

**Descripción:**
Mejorar el overlay de victoria con mejor presentación de información y controles.

**Mejoras Requeridas:**

1. **Imagen del Animal Completa:**
   - Mostrar imagen completa del animal ganador (sin recortes)
   - Tamaño apropiado y visualmente atractivo

2. **Multiplicador sobre Imagen:**
   - Multiplicador seleccionado debe aparecer sobre la imagen del animal
   - Posicionamiento: esquina superior derecha o como badge
   - Debe ser claramente visible

3. **Texto Descriptivo:**
   - Agregar texto descriptivo del animal
   - Formato simple y fácil de leer
   - Incluir nombre del animal
   - Incluir cantidad ganada

4. **Botón de Cierre Manual:**
   - Agregar botón X o "Cerrar" visible
   - Permitir cerrar manualmente el overlay
   - Ícono claro y accesible

5. **Temporizador de Cierre Automático:**
   - Aumentar tiempo de cierre automático de ~5s a 30s
   - Mostrar indicador visual del tiempo restante (opcional)
   - Permitir cancelar el temporizador con el botón manual

**Criterios de Aceptación:**
- [ ] Imagen del animal se muestra completa
- [ ] Multiplicador visible sobre la imagen
- [ ] Texto descriptivo claro y legible
- [ ] Botón de cierre manual funcional
- [ ] Cierre automático después de 30 segundos
- [ ] Botón de cierre manual tiene prioridad
- [ ] Animación de apertura/cierre suave
- [ ] Responsive en todas las resoluciones

**Mockup Aproximado:**
```
┌─────────────────────────────────┐
│  ╔═════════════════════════╗  X │
│  ║                         ║    │
│  ║   [Imagen Animal]       ║    │
│  ║     Completa            ║    │
│  ║        + [X5]           ║    │
│  ║                         ║    │
│  ╚═════════════════════════╝    │
│                                  │
│    ¡GANASTE!                     │
│    Rata                          │
│    +$5,000                       │
│                                  │
│  [Botón: Cerrar (30s)]          │
└─────────────────────────────────┘
```

---

## 5. BUGS Y CORRECCIONES

### 5.1 BUG - Giro con Apuesta de $0

**Prioridad:** Crítica
**Estado:** ✅ Completado
**Categoría:** Bug / Validación

**Descripción:**
La rueda puede girar incluyendo una apuesta de $0 a un animal si existe otra apuesta con un valor correcto.

**Escenario de Reproducción:**
1. Apostar $10 a la Rata
2. Seleccionar el Buey y no apostar nada ($0)
3. Hacer clic en "Girar"
4. **Resultado:** La rueda gira con ambas apuestas (Rata $10 + Buey $0)

**Comportamiento Esperado:**
- Solo se deben considerar apuestas con valor > 0
- Las apuestas de $0 deben ser ignoradas
- Validación debe ocurrir antes de girar

**Criterios de Aceptación:**
- [x] Apuestas de $0 son filtradas antes del giro
- [x] Solo se consideran apuestas con valor > 0
- [x] Mensaje de error si todas las apuestas son $0
- [x] No permite giro si no hay apuestas válidas
- [x] UI refleja solo apuestas válidas
- [x] Build sin errores de compilación

**Archivos Modificados:**
- `home.page.ts:268-280` - Método `setCurrentEditingAnimal()`
- `home.page.ts:314-327` - Método `spinWheels()`

**Documentación:** `docs/SEMANA 8/Semana 8 - 5.1 - Bug - Apuesta cero.md`

---

## 6. TABLA RESUMEN DE TAREAS

| # | Tarea | Categoría | Prioridad | Estado |
|---|-------|-----------|-----------|--------|
| 1.1 | Experimentar paleta de colores | Visual | Alta | Pendiente |
| 2.1 | Cerrar interfaces al clickear fuera | UX | Alta | ✅ Completado |
| 2.2 | Mejorar visibilidad FAQ | Responsive | Media | ✅ Completado |
| 2.3 | Sonido de clicketeo | Audio | Media | ✅ Completado |
| 2.4 | Ajustar posición de textos | Visual | Media | ✅ Completado |
| 3.1 | Auras en formato WebM | Optimización | Media | ✅ Completado |
| 3.2 | Ajustar fondos responsive | Responsive | Alta | Pendiente |
| 3.3 | Mejorar resolución animales móviles | Optimización | Alta | ✅ Completado |
| 4.1 | Mejorar overlay de victoria | UX | Alta | ✅ Completado |
| 5.1 | BUG - Giro con apuesta $0 | Bug | Crítica | ✅ Completado |

---

## 7. DEPENDENCIAS ENTRE TAREAS

```
1.1 (Paleta de colores)
    └─> Puede afectar 4.1 (overlay victoria)
    └─> Puede afectar 2.2 (FAQ)

3.2 (Fondos responsive)
    └─> Relacionado con 3.3 (resolución animales)

4.1 (Overlay victoria)
    └─> Independiente, alta prioridad

5.1 (Bug apuesta $0)
    └─> CRÍTICO - Debe resolverse primero
```

---

## 8. CRITERIOS DE FINALIZACIÓN

La semana 8 se considerará completa cuando:

- [x] Bug crítico de apuesta $0 resuelto (5.1) ✅
- [x] Cerrar interfaces al clickear fuera implementado (2.1) ✅
- [x] Mejorar visibilidad FAQ en móviles (2.2) ✅
- [x] Sonido de clicketeo implementado (2.3) ✅
- [x] Posición de textos ajustada (2.4) ✅
- [x] Imágenes de animales optimizadas para móviles (3.3) ✅
- [x] Auras convertidas a WebM (3.1) ✅
- [x] Overlay de victoria mejorado (4.1) ✅
- [ ] Fondos responsive ajustados (3.2)
- [ ] Paleta de colores experimentada y documentada (1.1)
- [x] Documentación actualizada (5.1, 2.1, 2.2, 2.3, 2.4, 3.1, 3.3) ✅
- [ ] Testing en dispositivos reales completado

---

## 9. NOTAS TÉCNICAS

### Formato de Audio Recomendado
Para el sonido de clicketeo (2.3):
- **Formato primario:** WebM (Opus codec)
- **Fallback:** MP3
- **Duración:** <100ms
- **Bitrate:** 64kbps máximo

### Resoluciones Objetivo para Testing
- **Móviles:** 360×800, 375×812, 390×844, 393×873
- **Tablets:** 768×1024, 1024×768
- **Desktop:** 1366×768, 1920×1080, 2560×1440

### Navegadores Objetivo
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Safari iOS 14+
- Chrome Android 90+

---

**Documento generado:** 10 de Diciembre de 2025
**Autor:** Equipo de Desarrollo
**Versión:** 1.0
