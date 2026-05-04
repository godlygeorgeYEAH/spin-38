/**
 * Interface para los parámetros GET que vienen en la URL del iframe
 * Ejemplo: ?token=xxx&lng=esp&param1=value1
 */
export interface QueryParams {
  /** Token de autenticación (obligatorio) */
  token: string;

  /** Idioma (opcional) */
  lng?: string;

  /** Cualquier otro parámetro dinámico que venga en la URL */
  [key: string]: any;
}
