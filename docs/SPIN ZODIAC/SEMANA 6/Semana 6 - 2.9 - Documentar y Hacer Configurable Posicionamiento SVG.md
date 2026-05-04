# Semana 6 - 2.9 - Documentar y Hacer Configurable Posicionamiento SVG

**Fecha:** 3 de Diciembre de 2025
**Tipo:** Refactorización (Énfasis en Configurabilidad)
**Referencia:** REQUERIMIENTOS.md - Hallazgo 2.9

---

## Problema

Valores hardcoded sin documentación ni relación clara con el viewBox:
```typescript
const radius = 160;  // ¿Por qué 160? ¿Cómo se relaciona con la rueda?
const radius = 100;  // ¿Y esto?
const x = radius * Math.cos(angleRad - Math.PI / 2);  // ¿Por qué -π/2?
```

**Impacto:** Imposible ajustar tamaño de rueda sin ingeniería reversa.

## Solución

**Archivo:** `src/app/components/wheel-container/wheel-container.component.ts`

### 1. Sistema de Configuración (líneas 76-130)

```typescript
// CONFIGURACIÓN DE POSICIONAMIENTO SVG
private readonly SVG_VIEWBOX_RADIUS = 210;  // viewBox="420x420" → radio 210

// Ratios configurables
private readonly ANIMAL_POSITION_RATIO = 0.762;  // 76.2% del radio
private readonly NUMBER_POSITION_RATIO = 0.476;  // 47.6% del radio
private readonly ANGLE_OFFSET_FOR_TOP = Math.PI / 2;  // 0° apunta arriba

// Radios calculados dinámicamente
private get animalRadius(): number {
  return this.SVG_VIEWBOX_RADIUS * this.ANIMAL_POSITION_RATIO;  // = 160
}

private get numberRadius(): number {
  return this.SVG_VIEWBOX_RADIUS * this.NUMBER_POSITION_RATIO;  // = 100
}
```

### 2. Documentación Completa en Español

- ✅ JSDoc explicando fórmulas matemáticas: `x = radio × cos(ángulo)`
- ✅ Comentarios inline en cada paso del cálculo
- ✅ Instrucciones de ajuste: cómo modificar posiciones
- ✅ Ejemplos de uso y casos de borde

### 3. Cómo Ajustar Ahora

```typescript
// Para mover animales hacia afuera:
ANIMAL_POSITION_RATIO = 0.85  // 85% del radio (más cerca del borde)

// Para mover números hacia el centro:
NUMBER_POSITION_RATIO = 0.30  // 30% del radio (más cerca del centro)

// Los radios se recalculan automáticamente vía getters
```

## Resultado

✅ **Código autodocumentado** - Fórmulas matemáticas explicadas
✅ **Radios configurables** - Cambiar ratios, no tocar trigonometría
✅ **Cálculo dinámico** - Getters eliminan valores hardcoded
✅ **Fácil mantenimiento** - Cambiar tamaño rueda sin romper posicionamiento

**Antes:** Necesitas ingeniería reversa para cambiar tamaño
**Ahora:** Ajustas 2 ratios y todo se recalcula automáticamente

---

**Commit:** `1605465`
