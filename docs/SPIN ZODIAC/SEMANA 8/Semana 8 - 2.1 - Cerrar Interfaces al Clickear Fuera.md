# Mejora 2.1 - Cerrar Interfaces al Clickear Fuera

**Fecha:** 11 de Diciembre, 2025
**Prioridad:** Alta
**Estado:** ✅ Completado
**Categoría:** Mejora de UX

---

## Descripción

Se agregó la capacidad de cerrar cualquier modal/interfaz abierta haciendo clic fuera de ella (en el overlay).

### Interfaces Modificadas

1. **Tutorial del Juego** (FAQ)
2. **Historial de Apuestas**
3. **Configuraciones** (ya implementado)
4. **Overlay de Resultados** (ya implementado)

---

## Implementación Técnica

### Patrón Utilizado

```html
<div class="modal-overlay" (click)="onClose()">
  <div class="modal-content" (click)="$event.stopPropagation()">
    <!-- Contenido del modal -->
  </div>
</div>
```

**Funcionamiento:**
- `(click)="onClose()"` en el overlay captura clicks fuera del modal
- `(click)="$event.stopPropagation()"` en el contenido evita propagación
- Click dentro del modal → No se cierra
- Click fuera (overlay) → Se ejecuta `onClose()`

---

## Archivos Modificados

### 1. Tutorial del Juego (FAQ)

**Archivo:** `src/app/components/game-tutorial/game-tutorial.component.html`

**Líneas:** 1-2

```html
<div class="tutorial-modal-overlay" *ngIf="isOpen" (click)="onClose()">
  <div class="tutorial-modal scale-in-hor-right" (click)="$event.stopPropagation()">
```

---

### 2. Historial de Apuestas

**Archivo:** `src/app/components/bet-history/bet-history.component.html`

**Líneas:** 1-2

```html
<div class="history-modal-overlay" *ngIf="isOpen" (click)="onClose()">
  <div class="history-modal scale-in-hor-right" (click)="$event.stopPropagation()">
```

---

## Criterios de Aceptación

- [x] Click fuera cierra interfaces correctamente
- [x] No interfiere con elementos internos del modal
- [x] Funciona en dispositivos táctiles
- [x] No cierra si se hace clic dentro del modal
- [x] Consistencia entre todos los modales
- [x] Sin errores de compilación TypeScript
