# Guía de Uso - Sistema de Variables Responsivas

**Propósito:** Aprender a aplicar responsiveness para nuevas resoluciones usando nuestro sistema de variables.

---

## 📖 Conceptos Básicos

### ¿Cómo funciona el sistema?

1. **Variables base (mobile-first)** en `variables.scss`
2. **Overrides por breakpoint** en `responsive-variables.scss`
3. **Componentes usan `var()`** para acceder variables

### Flujo de valores

```
Mobile Small (320px) → usa valor base de variables.scss
    ↓
Mobile Standard (360px) → override en responsive-variables.scss
    ↓
Tablet (768px) → override en responsive-variables.scss
    ↓
Desktop (1024px) → override en responsive-variables.scss
```

---

## 🎯 Caso de Uso 1: Agregar Soporte para Nueva Resolución

### Escenario
Necesitas agregar soporte para **Samsung Galaxy S24** (1080×2340, 360×780 CSS).

### Paso 1: Identificar Breakpoint
```
1080×2340 físico → 360×780 CSS (con DPR 3.0)
```
Ancho CSS: **360px** → Ya cubierto por **Mobile Standard (360-413px)** ✅

**Resultado:** No necesitas hacer nada, el dispositivo ya está soportado.

---

### Escenario 2: Dispositivo Fuera de Rango

Necesitas agregar soporte para **Samsung Galaxy Fold** (1768×2208, 884×1104 CSS) abierto.

### Paso 1: Identificar Breakpoint
```
Ancho CSS: 884px → Cae en Tablet (600-1023px)
```

### Paso 2: ¿Necesitas ajustes específicos?

**Opción A:** Usar valores de Tablet existentes (recomendado)
- No hagas nada, el breakpoint Tablet ya cubre este rango

**Opción B:** Crear breakpoint específico para plegables

**Archivo:** `src/theme/responsive-variables.scss`

```scss
/* ANTES: Solo tienes breakpoints estándar */
@media (min-width: 600px) and (max-width: 1023px) {
  :root {
    --logo-size: 170px;
    --wheel-diameter: 550px;
    /* ... */
  }
}

/* DESPUÉS: Agregar breakpoint específico para plegables */
@media (min-width: 840px) and (max-width: 920px) {
  :root {
    --logo-size: 190px;          /* Ligeramente más grande */
    --wheel-diameter: 620px;     /* Ajustado para plegables */
    --betting-panel-width: 520px;
    --balance-font-size: 1.7rem;
    /* ... solo las variables que necesites ajustar */
  }
}
```

### Paso 3: Testing
```bash
npm run build
ionic serve
# Probar en DevTools con 884×1104
```

**✅ Listo!** Todos los componentes se adaptan automáticamente porque usan `var()`.

---

## 🎯 Caso de Uso 2: Ajustar Tamaño de un Elemento

### Escenario
El logo se ve muy pequeño en tablets y quieres hacerlo más grande.

### Paso 1: Identificar la Variable
**Archivo:** `src/theme/variables.scss`
```scss
--logo-size: 90px; /* Base mobile */
```

### Paso 2: Modificar Override de Tablet
**Archivo:** `src/theme/responsive-variables.scss`

```scss
/* ANTES */
@media (min-width: 600px) and (max-width: 1023px) {
  :root {
    --logo-size: 170px;  /* Original */
  }
}

/* DESPUÉS */
@media (min-width: 600px) and (max-width: 1023px) {
  :root {
    --logo-size: 200px;  /* Aumentado +30px */
  }
}
```

### Paso 3: Testing
```bash
npm run build
ionic serve
# Probar en DevTools con ancho 768px (iPad)
```

**✅ Listo!** El logo ahora es más grande en tablets, sin tocar ningún componente CSS.

---

## 🎯 Caso de Uso 3: Agregar Nueva Variable para Nuevo Elemento

### Escenario
Creaste un nuevo componente `.notification-badge` que necesita ser responsivo.

### Paso 1: Agregar Variable Base
**Archivo:** `src/theme/variables.scss`

```scss
/* Agregar en la sección apropiada */
// Notifications
--notification-badge-size: 24px;      /* Mobile base */
--notification-badge-font-size: 0.7rem;
```

### Paso 2: Agregar Overrides por Breakpoint
**Archivo:** `src/theme/responsive-variables.scss`

```scss
/* Mobile Standard (360-413px) */
@media (min-width: 360px) and (max-width: 413px) {
  :root {
    --notification-badge-size: 28px;
    --notification-badge-font-size: 0.75rem;
  }
}

/* Mobile Large (414-599px) */
@media (min-width: 414px) and (max-width: 599px) {
  :root {
    --notification-badge-size: 32px;
    --notification-badge-font-size: 0.85rem;
  }
}

/* Tablet (600-1023px) */
@media (min-width: 600px) and (max-width: 1023px) {
  :root {
    --notification-badge-size: 40px;
    --notification-badge-font-size: 1rem;
  }
}

/* Desktop (1024-1799px) */
@media (min-width: 1024px) and (max-width: 1799px) {
  :root {
    --notification-badge-size: 48px;
    --notification-badge-font-size: 1.2rem;
  }
}

/* Large Desktop (1800px+) */
@media (min-width: 1800px) {
  :root {
    --notification-badge-size: 56px;
    --notification-badge-font-size: 1.4rem;
  }
}

/* Redmi Note 14 Pro */
@media (min-width: 1216px) and (max-width: 1224px) and (min-height: 2708px) and (max-height: 2716px) {
  :root {
    --notification-badge-size: 64px;
    --notification-badge-font-size: 1.6rem;
  }
}
```

### Paso 3: Usar Variables en tu Componente
**Archivo:** `src/app/home/home.page.css` (o tu componente)

```css
.notification-badge {
  width: var(--notification-badge-size);
  height: var(--notification-badge-size);
  font-size: var(--notification-badge-font-size);
  border-radius: 50%;
  background: red;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Paso 4: Testing
```bash
npm run build
ionic serve
# Probar en diferentes anchos de pantalla
```

**✅ Listo!** Tu componente ahora es completamente responsivo.

---

## 🎯 Caso de Uso 4: Dispositivo Específico (Redmi Note 14 Pro)

### Escenario
El Redmi Note 14 Pro (1220×2712) necesita ajustes específicos porque es tu gold standard.

### Breakpoint Ya Existe
**Archivo:** `src/theme/responsive-variables.scss`

```scss
/* Redmi Note 14 Pro - Portrait */
@media (min-width: 1216px) and (max-width: 1224px)
       and (min-height: 2708px) and (max-height: 2716px) {
  :root {
    --logo-size: 270px;
    --wheel-diameter: 950px;
    --betting-panel-width: 880px;
    --balance-font-size: 4.2rem;
    /* ... todas las variables necesarias */
  }
}
```

### Para Agregar Nuevo Elemento

**Paso 1:** Agregar variable en sección Redmi
```scss
@media (min-width: 1216px) and (max-width: 1224px)
       and (min-height: 2708px) and (max-height: 2716px) {
  :root {
    /* Variables existentes */
    --logo-size: 270px;

    /* Nueva variable para tu elemento */
    --notification-badge-size: 72px;  /* Extra grande en Redmi */
  }
}
```

**Paso 2:** Build y test
```bash
npm run build
# Probar en Redmi Note 14 Pro físico
```

---

## 📋 Checklist: Agregar Soporte para Nueva Resolución

- [ ] **1. Identificar resolución física y CSS**
  - Ejemplo: 1080×2340 físico → 360×780 CSS (DPR 3.0)

- [ ] **2. Determinar si breakpoint ya existe**
  - ¿Cae en Mobile Standard (360-413px)?
  - ¿Cae en Tablet (600-1023px)?
  - ¿Necesitas breakpoint específico?

- [ ] **3. Si breakpoint existe, probar primero**
  - Hacer build: `npm run build`
  - Probar en DevTools con la resolución CSS
  - Ver si los valores actuales funcionan

- [ ] **4. Si necesitas ajustes, agregar override**
  - Editar `responsive-variables.scss`
  - Agregar media query con rango específico
  - Definir solo las variables que necesites ajustar

- [ ] **5. Testing**
  - Build exitoso
  - Probar en navegador (DevTools)
  - Probar en dispositivo real (si es posible)

- [ ] **6. Documentar**
  - Agregar comentario en media query explicando el dispositivo
  - Ejemplo: `/* Samsung Galaxy Fold (884×1104 CSS) */`

---

## 🔍 Debugging: Problemas Comunes

### Problema 1: Valores no se aplican

**Síntoma:** Cambias una variable pero el elemento no cambia.

**Solución:**
1. Verifica que el componente use `var()`:
   ```css
   /* ✅ CORRECTO */
   .my-element { width: var(--my-variable); }

   /* ❌ INCORRECTO */
   .my-element { width: 100px; }
   ```

2. Limpia cache del navegador y rebuild:
   ```bash
   npm run build
   ```

3. Verifica que no haya override más específico en CSS del componente:
   ```css
   /* Esto puede sobrescribir la variable */
   @media (max-width: 768px) {
     .my-element { width: 150px !important; } /* ← Esto gana */
   }
   ```

---

### Problema 2: Media query no se activa

**Síntoma:** Los valores del breakpoint no se aplican.

**Solución:**
1. Verifica orden de media queries (deben ir de menor a mayor):
   ```scss
   /* ✅ CORRECTO: menor a mayor */
   @media (min-width: 360px) { ... }
   @media (min-width: 600px) { ... }
   @media (min-width: 1024px) { ... }

   /* ❌ INCORRECTO: orden aleatorio */
   @media (min-width: 1024px) { ... }
   @media (min-width: 360px) { ... }
   ```

2. Verifica que rangos no se solapen incorrectamente:
   ```scss
   /* ✅ CORRECTO: rangos consecutivos */
   @media (min-width: 360px) and (max-width: 599px) { ... }
   @media (min-width: 600px) and (max-width: 1023px) { ... }

   /* ❌ INCORRECTO: gap entre 599px y 600px */
   @media (min-width: 360px) and (max-width: 500px) { ... }
   @media (min-width: 600px) and (max-width: 1023px) { ... }
   ```

3. Prueba en DevTools con la resolución exacta del breakpoint.

---

### Problema 3: Valores muy grandes o muy pequeños

**Síntoma:** Elemento se ve desproporcionado en cierto dispositivo.

**Solución:**
1. Revisa la escala entre breakpoints:
   ```scss
   /* ❌ PROBLEMA: salto muy grande */
   @media (min-width: 360px) { --logo-size: 50px; }  /* Pequeño */
   @media (min-width: 1024px) { --logo-size: 500px; } /* ENORME */

   /* ✅ SOLUCIÓN: escala gradual */
   @media (min-width: 360px) { --logo-size: 110px; }
   @media (min-width: 600px) { --logo-size: 170px; }  /* +60px */
   @media (min-width: 1024px) { --logo-size: 210px; } /* +40px */
   ```

2. Usa fórmula de escala proporcional:
   ```
   Nuevo valor = Valor base × (Nueva anchura / Anchura base)

   Ejemplo:
   Valor base (360px): 110px
   Nueva anchura: 1024px

   110 × (1024 / 360) = 313px

   Ajustar a: ~200-250px (reducir un poco para estética)
   ```

---

## 📚 Referencia Rápida

### Variables Disponibles

Ver archivo completo: [variables.scss](../../src/theme/variables.scss)

**Categorías:**
- Logo: `--logo-size`
- Help buttons: `--help-button-size`, `--help-button-top`, `--help-button-right`
- Balance: `--balance-font-size`, `--balance-padding`
- Wheel: `--wheel-diameter`, `--wheel-container-padding`
- Betting: `--betting-panel-width`, `--betting-panel-height`, `--betting-chip-size`
- Animals: `--animal-name-font-size`, `--animal-image-size`
- Modals: `--modal-title-font-size`, `--result-details-font-size`, `--win-amount-font-size`
- Spacing: `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--spacing-xl`

### Breakpoints Activos

```scss
Mobile Small:    0-359px      (~10-15% usuarios)
Mobile Standard: 360-413px    (~60-70% usuarios) ⭐
Mobile Large:    414-599px    (~5-10% usuarios)
Tablet:          600-1023px   (~15-20% usuarios)
Desktop:         1024-1799px  (~5-8% usuarios)
Large Desktop:   1800px+      (~1-2% usuarios)
Redmi Note 14:   1220×2712    (Gold standard)
```

---

## ✅ Buenas Prácticas

1. **Siempre usa mobile-first**
   - Valor base = móvil más pequeño
   - Overrides = pantallas más grandes

2. **Escala gradualmente**
   - No hagas saltos grandes entre breakpoints
   - Mantén proporciones visuales

3. **Prueba en dispositivos reales**
   - DevTools es útil pero no perfecto
   - Valida en al menos 1 móvil, 1 tablet, 1 desktop

4. **Documenta breakpoints específicos**
   - Agrega comentarios explicando el dispositivo
   - Ayuda a futuros desarrolladores

5. **Usa variables existentes primero**
   - Antes de crear nueva variable, verifica si ya existe
   - Reutiliza variables cuando sea posible

---

**¿Preguntas?** Consulta [RESPONSIVE-SYSTEM.md](RESPONSIVE-SYSTEM.md) para entender el sistema completo.
