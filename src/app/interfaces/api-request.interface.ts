/**
 * Interfaces para las peticiones al backend
 */

/**
 * Datos para realizar una apuesta
 */
export interface PlaceBetRequest {
  /** Lista de apuestas realizadas */
  bets: BetItem[];

  /** Monto total de la apuesta */
  totalAmount: number;
}

/**
 * Item individual de apuesta
 */
export interface BetItem {
  /** Nombre del animal apostado */
  animal: string;

  /** Monto apostado a ese animal */
  amount: number;

  /** Índice numérico del animal (1-12) */
  index: number;
}

/**
 * Datos para ejecutar un giro
 */
export interface SpinRequest {
  /** ID de la apuesta asociada al giro */
  betId: string;
}
