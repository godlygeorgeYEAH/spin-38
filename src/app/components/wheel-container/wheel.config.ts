// ============================================================
// WHEEL CONFIG
// ============================================================
// Para cambiar el tamaño visual de la rueda: editar los valores
// de `diameter` en WHEEL_BREAKPOINTS o WHEEL_DEFAULT_DIAMETER.
//
// Para cambiar las proporciones internas del SVG: editar WHEEL_SVG.
//
// No se define --wheel-diameter en ningún otro archivo CSS/SCSS.
// El componente aplica la variable en runtime según el viewport.
// ============================================================

// ------------------------------------------------------------
// PROPORCIONES INTERNAS DEL SVG
// ------------------------------------------------------------

export interface WheelSvgConfig {
  /** Canvas total del SVG. Debe ser mayor que outerRingRatio * viewboxRadius. */
  viewboxRadius: number;
  /** Rueda exterior (segmentos de animales). ⚠️ DEBE ser < 1.0 */
  outerRingRatio: number;  
  /** Rueda interior (segmentos de números). Debe ser < outerRingRatio. */
  innerRingRatio: number;
  /** Margen mínimo entre anillo exterior e interior (fracción del viewBox radius). */
  innerRingGapRatio: number;
  /** Posición radial de las imágenes de animales (0.0 – 1.0). */
  animalPositionRatio: number;
  /** Posición radial de los números (0.0 – animalPositionRatio). */
  numberPositionRatio: number;
  /** Tamaño de las imágenes de animales relativo al viewboxRadius. */
  animalImageSizeRatio: number;
  /** Posición del texto curvado relativa al anillo exterior. */
  animalTextPositionRatio: number;
  /** Tamaño del texto de números en la rueda exterior (unidades SVG). */
  outerNumberFontSize: number;
  /** Tamaño del texto de números en la rueda interior (unidades SVG). */
  innerNumberFontSize: number;
}

export const WHEEL_SVG: WheelSvgConfig = {
  viewboxRadius:           300,
  outerRingRatio:          0.900,  // ⚠️ DEBE ser < 1.0 (si no, el SVG se corta)
  innerRingRatio:          0.550,
  innerRingGapRatio:       0.020,  // Margen entre anillo exterior e interior
  animalPositionRatio:     0.600, // esto cambia los numeros no los animales
  numberPositionRatio:     0.450,
  animalImageSizeRatio:    0.299,
  animalTextPositionRatio: 0.88,
  outerNumberFontSize:     24,     // unidades SVG (escalan con el viewBox)
  innerNumberFontSize:     16,     // unidades SVG (escalan con el viewBox)
};

// ------------------------------------------------------------
// BREAKPOINTS DE DIÁMETRO VISUAL (CSS --wheel-diameter)
// ------------------------------------------------------------
// Orden: los breakpoints se evalúan en secuencia y el ÚLTIMO
// que coincida con el viewport activo es el que se aplica,
// exactamente igual que las media queries en CSS.
//
// Regla: poner primero los breakpoints más generales,
//        después los más específicos (éstos sobreescriben).
// ------------------------------------------------------------

export interface WheelBreakpoint {
  /** Media query exacta, tal como se usaría en CSS. */
  mediaQuery: string;
  /** Valor de --wheel-diameter: px o vh. */
  diameter: string;
}

/** Valor por defecto cuando ningún breakpoint coincide. */
export const WHEEL_DEFAULT_DIAMETER = '800px';

/**
 * Breakpoints en orden de cascada (último que coincide gana).
 *
 * Fuente original:
 *   Breakpoints 1-9  → responsive-variables.scss
 *   Breakpoints 10-14 → home.page.css (overrides específicos de dispositivo)
 */
export const WHEEL_BREAKPOINTS: WheelBreakpoint[] = [
  // --- responsive-variables.scss ---

  // // Breakpoint 2: Mobile Standard (360–415px, altura 617–780px)
  // {
  //   mediaQuery: '(min-width: 360px) and (max-width: 415px) and (min-height: 617px) and (max-height: 780px)',
  //   diameter: '49vh',
  // },
  // // Breakpoint 2B: iPhone 12/13/14 (388–393px, altura ≥ 840px)
  // {
  //   mediaQuery: '(min-width: 388px) and (max-width: 393px) and (min-height: 840px)',
  //   diameter: '43vh',
  // },
  // // Breakpoint 2C: Samsung S21 (360–363px, altura 798–803px)
  // {
  //   mediaQuery: '(min-width: 360px) and (max-width: 363px) and (min-height: 798px) and (max-height: 803px)',
  //   diameter: '49vh',
  // },
  // // Breakpoint 3: Mobile Large (414–599px)
  // {
  //   mediaQuery: '(min-width: 414px) and (max-width: 599px)',
  //   diameter: '52vh',
  // },
  // // Breakpoint 3B: iPhone Pro Max (426–432px, altura ≥ 920px)
  // {
  //   mediaQuery: '(min-width: 426px) and (max-width: 432px) and (min-height: 920px)',
  //   diameter: '53vh',
  // },
  // // Breakpoint 4: Tablet (600–1023px)
  // {
  //   mediaQuery: '(min-width: 600px) and (max-width: 1023px)',
  //   diameter: '57vh',
  // },
  // // Breakpoint 5: Desktop (1024–1799px)
  // {
  //   mediaQuery: '(min-width: 1024px) and (max-width: 1799px)',
  //   diameter: '85vh',
  // },
  // // Breakpoint 6: Large Desktop (≥ 1800px)
  // {
  //   mediaQuery: '(min-width: 1800px)',
  //   diameter: '650px',
  // },
  // // Breakpoint 7: Redmi Note 14 (1216–1224px, altura 2708–2716px)
  // {
  //   mediaQuery: '(min-width: 1216px) and (max-width: 1224px) and (min-height: 2708px) and (max-height: 2716px)',
  //   diameter: '1080px',
  // },

  // --- home.page.css (dispositivos específicos, mayor prioridad) ---

  // // Samsung Galaxy S20+/S21+/Note 20 (720×1612px)
  // {
  //   mediaQuery: '(min-width: 720px) and (max-width: 720px) and (min-height: 1612px) and (max-height: 1612px)',
  //   diameter: '550px',
  // },
  // // HD Laptops (1366–1400px, altura 700–800px)
  // {
  //   mediaQuery: '(min-width: 1366px) and (max-width: 1400px) and (min-height: 700px) and (max-height: 800px)',
  //   diameter: '500px',
  // },
  // HD+ Laptops / 1600×900 (1580–1680px, altura 880–920px)
  {
    mediaQuery: '(min-width: 1580px) and (max-width: 1680px) and (min-height: 880px) and (max-height: 920px)',
    diameter: '520px',
  },
    // Large Desktop (≥ 1800px)
  {
     mediaQuery: '(min-width: 1800px)',
     diameter: '600px',
  },
  // 2K/QHD (2540–2600px, altura 1400–1480px)
  {
    mediaQuery: '(min-width: 2540px) and (max-width: 2600px) and (min-height: 1400px) and (max-height: 1480px)',
    diameter: '600px',
  },
  // 4K/UHD (≥ 3800px, altura ≥ 2100px)
  {
    mediaQuery: '(min-width: 3800px) and (min-height: 2100px)',
    diameter: '700px',
  },
];

/**
 * Evalúa todos los breakpoints contra el viewport actual y retorna
 * el diámetro correspondiente. El último que coincide gana (igual que CSS).
 */
export function getWheelDiameter(): string {
  let result = WHEEL_DEFAULT_DIAMETER;
  for (const bp of WHEEL_BREAKPOINTS) {
    if (window.matchMedia(bp.mediaQuery).matches) {
      result = bp.diameter;
    }
  }
  return result;
}

// ------------------------------------------------------------
// BREAKPOINTS DE TAMAÑO DEL BORDE (--wheel-border-size)
// ------------------------------------------------------------
// Orden: los breakpoints se evalúan en secuencia y el ÚLTIMO
// que coincida con el viewport activo es el que se aplica,
// exactamente igual que las media queries en CSS.
//
// Regla: poner primero los breakpoints más generales,
//        después los más específicos (éstos sobreescriben).
// ------------------------------------------------------------

export interface WheelBorderBreakpoint {
  /** Media query exacta, tal como se usaría en CSS. */
  mediaQuery: string;
  /** Valor de --wheel-border-size: px o vh. */
  borderSize: string;
}

/** Valor por defecto cuando ningún breakpoint coincide. */
export const WHEEL_BORDER_DEFAULT_SIZE = '50vh';

/**
 * Breakpoints en orden de cascada (último que coincide gana).
 * Valores extraídos de responsive-variables.scss.
 */
export const WHEEL_BORDER_BREAKPOINTS: WheelBorderBreakpoint[] = [
  // Breakpoint 2: Mobile Standard (360–415px, altura 617–780px)
  {
    mediaQuery: '(min-width: 360px) and (max-width: 415px) and (min-height: 617px) and (max-height: 780px)',
    borderSize: '50.3vh',
  },
  // Breakpoint 2B: iPhone 12/13/14 (388–393px, altura ≥ 840px)
  {
    mediaQuery: '(min-width: 388px) and (max-width: 393px) and (min-height: 840px)',
    borderSize: '44vh',
  },
  // Breakpoint 2C: Samsung S21 (360–363px, altura 798–803px)
  {
    mediaQuery: '(min-width: 360px) and (max-width: 363px) and (min-height: 798px) and (max-height: 803px)',
    borderSize: '50.5vh',
  },
  // Breakpoint 3: Mobile Large (414–599px)
  {
    mediaQuery: '(min-width: 414px) and (max-width: 599px)',
    borderSize: '53vh',
  },
  // Breakpoint 3B: iPhone Pro Max (426–432px, altura ≥ 920px)
  {
    mediaQuery: '(min-width: 426px) and (max-width: 432px) and (min-height: 920px)',
    borderSize: '54vh',
  },
  // Breakpoint 4: Tablet (600–1023px)
  {
    mediaQuery: '(min-width: 1800px)',
    borderSize: '50vh',  //este manipula el tamaño de la reuda externa
  },
  {
    mediaQuery: '(min-width: 600px) and (max-width: 1023px)',
    borderSize: '58.5vh',
  },
  // Breakpoint 5: Desktop (1024–1799px)
  {
    mediaQuery: '(min-width: 1024px) and (max-width: 1799px)',
    borderSize: '87vh',
  },
];

/**
 * Evalúa todos los breakpoints contra el viewport actual y retorna
 * el tamaño del borde correspondiente. El último que coincide gana (igual que CSS).
 */
export function getWheelBorderSize(): string {
  let result = WHEEL_BORDER_DEFAULT_SIZE;
  for (const bp of WHEEL_BORDER_BREAKPOINTS) {
    if (window.matchMedia(bp.mediaQuery).matches) {
      result = bp.borderSize;
    }
  }
  return result;
}
