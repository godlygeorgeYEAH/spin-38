export interface Animal {
  position: string;
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
  position: string;
  image?: string;
}

export interface WheelSpinResult {
  outerPosition: number | string;
  innerPosition: number | string;
  isPositioningOnly?: boolean;
  outerWheelIndex?: number;
  innerWheelIndex?: number;
}

