/**
 * Interfaces para las respuestas del backend
 */

/**
 * Respuesta base con estructura común
 */
export interface ApiResponse<T = any> {
  /** Indica si la operación fue exitosa */
  success: boolean;

  /** Mensaje descriptivo */
  message?: string;

  /** Datos de la respuesta */
  data?: T;

  /** Código de error si aplica */
  errorCode?: string;
}

/**
 * Respuesta de validación de token
 */
export interface ValidateTokenResponse {
  /** Indica si el token es válido */
  valid: boolean;

  /** ID del usuario */
  userId?: string;

  /** Información adicional del usuario */
  userInfo?: {
    username: string;
    balance: number;
    [key: string]: any;
  };
}

/**
 * Respuesta de configuración inicial del juego
 */
export interface InitialConfigResponse {
  /** Valores de denominación de fichas disponibles (6 valores) */
  coinValues: number[];

  /** Valores de multiplicadores para la rueda interna (6 valores, cada uno aparece 2 veces) */
  multipliers: number[];
}

/**
 * Respuesta de balance
 */
export interface BalanceResponse {
  /** Balance actual del usuario */
  balance: number;

  /** Moneda */
  currency?: string;
}

/**
 * Respuesta de apuesta realizada
 */
export interface PlaceBetResponse {
  /** ID único de la apuesta */
  betId: string;

  /** Timestamp de la apuesta */
  timestamp: string;

  /** Balance después de la apuesta */
  balanceAfter: number;
}

/**
 * Respuesta de resultado de giro
 */
export interface SpinResponse {
  /** Animal ganador */
  winningAnimal: string;

  /** Multiplicador ganador */
  winningMultiplier: number;

  /** Monto ganado */
  winAmount: number;

  /** Balance después del giro */
  balanceAfter: number;

  /** Indica si hubo ganancia */
  isWin: boolean;
}

/**
 * Respuesta de historial
 */
export interface HistoryResponse {
  /** Lista de registros del historial */
  records: HistoryRecord[];

  /** Total de registros */
  total: number;

  /** Página actual */
  page: number;
}

/**
 * Registro individual del historial
 */
export interface HistoryRecord {
  /** ID de la apuesta */
  betId: string;

  /** Timestamp */
  timestamp: string;

  /** Monto apostado */
  betAmount: number;

  /** Animal ganador */
  winningAnimal: string;

  /** Multiplicador */
  multiplier: number;

  /** Monto ganado */
  winAmount: number;

  /** Indica si ganó */
  isWin: boolean;
}
