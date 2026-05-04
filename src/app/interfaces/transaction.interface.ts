/**
 * Tipos de transacción en el sistema de balance
 */
export enum TransactionType {
  BET = 'bet',       // Apuesta realizada
  WIN = 'win',       // Ganancia obtenida
  LOSS = 'loss'      // Pérdida (apuesta sin ganancia)
}

/**
 * Representa una transacción en el historial de balance
 */
export interface Transaction {
  id: number;                    // ID único de la transacción
  type: TransactionType;         // Tipo de transacción
  amount: number;                // Monto de la transacción
  balanceBefore: number;         // Balance antes de la transacción
  balanceAfter: number;          // Balance después de la transacción
  timestamp: Date;               // Fecha y hora de la transacción
  description?: string;          // Descripción opcional
}
