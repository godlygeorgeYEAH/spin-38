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
  innerAnimal: Animal;      // Animal ganador (rueda interna)
  isPositioningOnly?: boolean;
  outerWheelIndex?: number;
  innerWheelIndex?: number;
}

