import { Animal } from './wheel-general.interface';

/**
 * Representa una apuesta individual dentro de una ronda
 */
export interface BetEntry {
  animal: Animal;
  amount: number;
}

/**
 * Representa el resultado de una ronda de apuestas en el historial
 */
export interface BetHistory {
  id: number;                    // ID único del registro
  timestamp: Date;               // Fecha y hora de la apuesta
  bets: BetEntry[];             // Lista de apuestas realizadas
  totalBet: number;             // Total apostado en la ronda
  winningAnimal: Animal;        // Animal ganador
  winningMultiplier: number;    // Multiplicador del animal ganador
  winAmount: number;            // Cantidad ganada (0 si perdió)
  isWin: boolean;               // Si ganó o perdió
  balanceAfter: number;         // Balance después de la ronda
}
