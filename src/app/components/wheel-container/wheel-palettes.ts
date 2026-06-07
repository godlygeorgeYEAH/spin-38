interface ColorStop { offset: string; color: string; }
interface ColorGradient { stops: ColorStop[]; }

export interface WheelPalette {
  outerWheelColors: ColorGradient[];
  innerWheelColors: ColorGradient[];
}

export const WHEEL_PALETTES = {

  Clasica: {
    outerWheelColors: [
      { stops: [{ offset: '60%', color: '#2097FC' }, { offset: '100%', color: '#1167C0' }] },
      { stops: [{ offset: '60%', color: '#2711A3' }, { offset: '100%', color: '#180B6B' }] },
    ],
    innerWheelColors: [
      { stops: [{ offset: '60%', color: '#FFD890' }, { offset: '100%', color: '#C48A10' }] },
      { stops: [{ offset: '60%', color: '#86EBF5' }, { offset: '100%', color: '#1DA8BC' }] },
    ],
  },

  Caribe: {
    outerWheelColors: [
      { stops: [{ offset: '60%', color: '#103EA8' }, { offset: '100%', color: '#061E60' }] },
      { stops: [{ offset: '60%', color: '#2C7CE0' }, { offset: '100%', color: '#1455B0' }] },
    ],
    innerWheelColors: [
      { stops: [{ offset: '60%', color: '#0E8FAA' }, { offset: '100%', color: '#054F62' }] },
      { stops: [{ offset: '60%', color: '#42DCEE' }, { offset: '100%', color: '#1AAEC6' }] },
    ],
  },

  Selva: {
    outerWheelColors: [
      { stops: [{ offset: '60%', color: '#0A5C38' }, { offset: '100%', color: '#042E18' }] },
      { stops: [{ offset: '60%', color: '#1EC468' }, { offset: '100%', color: '#0E8A40' }] },
    ],
    innerWheelColors: [
      { stops: [{ offset: '60%', color: '#103EA8' }, { offset: '100%', color: '#061E60' }] },
      { stops: [{ offset: '60%', color: '#2C7CE0' }, { offset: '100%', color: '#1455B0' }] },
    ],
  },

} satisfies Record<string, WheelPalette>;

export type PaletteName = keyof typeof WHEEL_PALETTES;

/** Paleta activa. Cambiar este valor para alternar entre paletas. */
export const ACTIVE_PALETTE: PaletteName = 'Selva';
