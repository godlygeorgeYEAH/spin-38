# Semana 6 - 2.1 - Restaurar Hover en Imágenes de Animales

**Fecha:** 2 de Diciembre de 2025
**Tipo:** Corrección Crítica
**Referencia:** CONFIRMACIONES_TECNICAS_REQUERIDAS.md - Hallazgo 2.1

---

## Problema

`pointer-events: none` bloqueaba todas las interacciones del mouse en `.animal-image`, causando que el selector `:hover` nunca se ejecutara.

## Solución

Eliminada propiedad `pointer-events: none` de la línea 252.

**Archivo:** `src/app/components/wheel-container/wheel-container.component.css:252`

```diff
.animal-image {
  filter: drop-shadow(0 0 5px rgba(0,0,0,0.8)) drop-shadow(2px 2px 4px rgba(0,0,0,0.6)) brightness(1.1) contrast(1.2);
  transition: all 0.4s cubic-bezier(0.25,0.46,0.45,0.94);
- pointer-events: none;
  image-rendering: -webkit-optimize-contrast;
  backface-visibility: hidden;
  transform: translateZ(0);
}
```

## Resultado

✅ Hover funcional con efectos visuales:
- `scale(1.15)` + `rotate(2deg)`
- Sombra y brillo mejorados

✅ Interactividad restaurada en imágenes de animales de la rueda

---

**Commit:** `8618b5a`
