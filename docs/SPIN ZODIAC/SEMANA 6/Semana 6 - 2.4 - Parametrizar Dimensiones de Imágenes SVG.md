# Semana 6 - 2.4 - Parametrizar Dimensiones de Imágenes SVG

**Fecha:** 3 de Diciembre de 2025
**Tipo:** Refactorización (Eliminación de Valores Hardcoded)
**Referencia:** REQUERIMIENTOS.md - Hallazgo 2.4

---

## Problema

Dimensiones de imágenes de animales hardcoded directamente en el template HTML:
```html
<image [attr.href]="getAnimalImage(item.name)"
       x="-25" y="-25" width="50" height="50"  <!-- ⚠️ Valores fijos -->
       class="wheel-animal-image" />
```

**Impacto:**
- ❌ Las imágenes no escalan proporcionalmente al cambiar tamaño de rueda
- ❌ Dificulta ajustes responsivos
- ❌ Inconsistente con el sistema de ratios del resto del código

## Solución

### 1. Nuevas Constantes Configurables

**Archivo:** `src/app/components/wheel-container/wheel-container.component.ts` (líneas 132-161)

```typescript
/**
 * Ratio para el tamaño de las imágenes de animales en la rueda.
 * Las imágenes tienen un tamaño de 23.8% del radio del viewBox.
 * Valor base: 50 unidades SVG / 210 radio = 0.238
 */
private readonly ANIMAL_IMAGE_SIZE_RATIO = 0.238;

/**
 * Tamaño calculado de las imágenes de animales (en unidades SVG).
 * Se calcula como un porcentaje del radio del viewBox para mantener
 * proporciones consistentes cuando cambie el tamaño de la rueda.
 */
public get animalImageSize(): number {
  return this.SVG_VIEWBOX_RADIUS * this.ANIMAL_IMAGE_SIZE_RATIO;  // = 50
}

/**
 * Offset calculado para centrar las imágenes de animales.
 * El offset es negativo y equivale a la mitad del tamaño de la imagen.
 * Ejemplo: Si animalImageSize = 50, offset = -25
 */
public get animalImageOffset(): number {
  return -this.animalImageSize / 2;  // = -25
}
```

### 2. Template HTML Refactorizado

**Archivo:** `src/app/components/wheel-container/wheel-container.component.html` (líneas 57-65)

**Antes:**
```html
<image [attr.href]="getAnimalImage(item.name)"
       x="-25" y="-25" width="50" height="50"
       class="wheel-animal-image" />
```

**Después:**
```html
<image [attr.href]="getAnimalImage(item.name)"
       [attr.x]="animalImageOffset"
       [attr.y]="animalImageOffset"
       [attr.width]="animalImageSize"
       [attr.height]="animalImageSize"
       class="wheel-animal-image" />
```

### 3. Cómo Ajustar Ahora

```typescript
// Para imágenes más grandes (sin solapamiento):
ANIMAL_IMAGE_SIZE_RATIO = 0.35  // 35% del radio → ~73px

// Para imágenes más pequeñas:
ANIMAL_IMAGE_SIZE_RATIO = 0.15  // 15% del radio → ~31px

// El offset se recalcula automáticamente para mantener centrado
```

## Ventajas del Nuevo Sistema

✅ **Escalabilidad automática** - Imágenes crecen/decrecen con la rueda
✅ **Proporciones consistentes** - Mantiene ratios en todos los tamaños
✅ **Código autodocumentado** - Fórmulas y cálculos explicados
✅ **Fácil mantenimiento** - Cambiar un ratio ajusta todo
✅ **Alineado con arquitectura** - Sigue el patrón de `ANIMAL_POSITION_RATIO` y `NUMBER_POSITION_RATIO`

## Comparación

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| Tamaño imagen | `50` (hardcoded) | `SVG_VIEWBOX_RADIUS × 0.238` (calculado) |
| Offset X/Y | `-25` (hardcoded) | `-animalImageSize / 2` (centrado automático) |
| Escalabilidad | ❌ Manual | ✅ Automática |
| Mantenibilidad | ❌ Difícil | ✅ Simple (cambiar 1 ratio) |
| Documentación | ❌ Ninguna | ✅ JSDoc completo |

## Resultado

**Requerimiento 2.4:** ✅ **100% COMPLETADO**

- ✅ Eliminados todos los valores hardcoded de dimensiones de imágenes SVG
- ✅ Sistema de ratios escalable implementado
- ✅ Documentación completa agregada
- ✅ Consistencia con el sistema de posicionamiento existente

**Antes:** Cambiar tamaño de rueda requería ajustar 6+ valores manualmente
**Ahora:** Cambiar `SVG_VIEWBOX_RADIUS` ajusta todo automáticamente

---

**Commits relacionados:**
- Fix 2.9: Documentación de posicionamiento SVG (`1605465`)
- Fix 2.10: Reorganización de variables CSS (`6bda87d`)
- Fix 2.4: Parametrización de dimensiones de imágenes (este fix)
