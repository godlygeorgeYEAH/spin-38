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
  outerPosition: number | string;
  innerPosition: number | string;
  isPositioningOnly?: boolean;
  outerWheelIndex?: number;
  innerWheelIndex?: number;
}

