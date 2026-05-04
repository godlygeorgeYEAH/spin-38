# Semana 6 - 2.7 - Consolidar CSS Duplicado

**Fecha:** 2 de Diciembre de 2025
**Tipo:** Refactorización (Problema Sistémico)
**Referencia:** CONFIRMACIONES_TECNICAS_REQUERIDAS.md - Hallazgo 2.7 (Problema 1)

---

## Problema

`.animal-image` definido **3 veces** con lógica duplicada en diferentes ubicaciones:
- Líneas 7-22 (media query 768px)
- Líneas 42-56 (media query 480px)
- Líneas 249-267 (global base)

**Impacto:** Difícil mantenibilidad, cambios requieren editar 3 lugares, valores inconsistentes.

## Solución

Reorganizado CSS siguiendo patrón **"base global + overrides"**:

**Archivo:** `src/app/components/wheel-container/wheel-container.component.css`

### Nueva Estructura

```css
/* BASE STYLES (líneas 174-192) */
.animal-image {
  filter: drop-shadow(...);
  transition: all 0.4s;
  image-rendering: -webkit-optimize-contrast;
  backface-visibility: hidden;
  transform: translateZ(0);
}

/* RESPONSIVE OVERRIDES (líneas 306-382) */
/* Solo propiedades que cambian por breakpoint */

@media (max-width: 768px) {
  .animal-image {
    filter: drop-shadow(1px 1px 2px ...) brightness(1.05) contrast(1.1);
    image-rendering: crisp-edges;
  }
}

@media (max-width: 480px) {
  .animal-image {
    filter: drop-shadow(0.5px 0.5px 1px ...) brightness(1.02) contrast(1.05);
    image-rendering: pixelated;
  }
}
```

## Resultado

✅ **Una sola definición base** - Propiedades comunes definidas una vez
✅ **Media queries limpios** - Solo overrides de lo que cambia
✅ **Mejor mantenibilidad** - Cambios en un solo lugar
✅ **Sección claramente marcada** - "RESPONSIVE OVERRIDES" para navegación fácil
✅ **Mismo comportamiento visual** - Preservada toda funcionalidad responsive

---

**Commit:** `1a794ed`
