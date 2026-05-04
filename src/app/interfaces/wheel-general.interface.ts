export interface Animal {
  name: string;
  emoji: string;
  image?: string;
  description?: string;
}

export interface AnimalBet {
  id: number;
  animal: Animal;
  amount: number;
}

export interface WheelItem {
  name: string;
  image?: string;
}

export interface WheelSpinResult {
  animal: Animal;           // Animal ganador (rueda externa)
  number: number;           // Multiplicador ganador (rueda interna)
  isPositioningOnly?: boolean;
  // Información detallada para logging
  outerWheelIndex?: number; // Índice donde cayó la rueda externa (0-11)
  innerWheelIndex?: number; // Índice donde cayó la rueda interna (0-11)
  innerWheelAnimal?: Animal; // Animal donde cayó el multiplicador (rueda interna)
}

