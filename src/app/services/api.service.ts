import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { QueryParams } from '../interfaces/query-params.interface';
import {
  PlaceBetRequest,
  SpinRequest
} from '../interfaces/api-request.interface';
import {
  ApiResponse,
  ValidateTokenResponse,
  InitialConfigResponse,
  BalanceResponse,
  PlaceBetResponse,
  SpinResponse,
  HistoryResponse
} from '../interfaces/api-response.interface';

/**
 * Servicio centralizado para comunicación con el backend
 *
 * Responsabilidades:
 * - Almacenar el token y parámetros GET en memoria
 * - Proporcionar métodos para todas las peticiones al backend
 * - Exponer el token y params para el interceptor
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  /** URL base del backend */
  private readonly apiUrl = environment.apiUrl;

  /** Token de autenticación almacenado en memoria (NO localStorage) */
  private token: string = '';

  /** Parámetros GET capturados al iniciar */
  private queryParams: QueryParams | null = null;

  /** Subject para emitir eventos de autenticación */
  private authStatus$ = new BehaviorSubject<boolean>(false);

  /** Observable para suscribirse a cambios en el estado de autenticación */
  public authStatusObservable = this.authStatus$.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Inicializa el servicio con los parámetros GET capturados al inicio
   * Debe ser llamado por APP_INITIALIZER antes de cargar la aplicación
   *
   * @param params - Parámetros GET de la URL
   */
  public initialize(params: QueryParams): void {
    console.log('[ApiService] Inicializando con parámetros:', params);

    this.token = params.token;
    this.queryParams = params;
    this.authStatus$.next(!!this.token);

    console.log('[ApiService] Token almacenado en memoria');
  }

  /**
   * Obtiene el token actual (usado por el interceptor)
   * @returns Token de autenticación
   */
  public getToken(): string {
    return this.token;
  }

  /**
   * Obtiene todos los query params (usado por el interceptor)
   * @returns Parámetros GET
   */
  public getQueryParams(): QueryParams | null {
    return this.queryParams;
  }

  /**
   * Verifica si hay un token válido
   * @returns true si hay token
   */
  public isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Invalida el token (en caso de error 401)
   */
  public invalidateToken(): void {
    console.warn('[ApiService] Token invalidado');
    this.token = '';
    this.authStatus$.next(false);

    // Emitir evento personalizado para que la app reaccione
    window.dispatchEvent(new CustomEvent('TOKEN_INVALID'));
  }

  // ==================== MÉTODOS DE API ====================

  /**
   * Valida el token con el backend
   * @returns Observable con la respuesta de validación
   */
  public validateToken(): Observable<ApiResponse<ValidateTokenResponse>> {
    return this.http.post<ApiResponse<ValidateTokenResponse>>(
      `${this.apiUrl}/validate-token`,
      {}
    );
  }

  /**
   * Obtiene la configuración inicial del juego (fichas y multiplicadores)
   * Debe llamarse una sola vez al iniciar la aplicación
   * @returns Observable con la configuración inicial
   */
  public getInitialConfig(): Observable<ApiResponse<InitialConfigResponse>> {
    return this.http.get<ApiResponse<InitialConfigResponse>>(
      `${this.apiUrl}/initialConfig`
    );
  }

  /**
   * Obtiene el balance actual del usuario
   * @returns Observable con el balance
   */
  public getBalance(): Observable<ApiResponse<BalanceResponse>> {
    return this.http.get<ApiResponse<BalanceResponse>>(
      `${this.apiUrl}/balance`
    );
  }

  /**
   * Registra una apuesta en el backend
   * @param betData - Datos de la apuesta
   * @returns Observable con la respuesta de la apuesta
   */
  public placeBet(betData: PlaceBetRequest): Observable<ApiResponse<PlaceBetResponse>> {
    return this.http.post<ApiResponse<PlaceBetResponse>>(
      `${this.apiUrl}/bet/place`,
      betData
    );
  }

  /**
   * Ejecuta un giro de la ruleta
   * @param spinData - Datos del giro
   * @returns Observable con el resultado del giro
   */
  public spin(spinData: SpinRequest): Observable<ApiResponse<SpinResponse>> {
    return this.http.post<ApiResponse<SpinResponse>>(
      `${this.apiUrl}/spin`,
      spinData
    );
  }

  /**
   * Obtiene el historial de apuestas
   * @param page - Número de página (opcional)
   * @param limit - Límite de registros (opcional)
   * @returns Observable con el historial
   */
  public getHistory(page: number = 1, limit: number = 50): Observable<ApiResponse<HistoryResponse>> {
    return this.http.get<ApiResponse<HistoryResponse>>(
      `${this.apiUrl}/history`,
      {
        params: {
          page: page.toString(),
          limit: limit.toString()
        }
      }
    );
  }

  /**
   * Método genérico para hacer peticiones GET personalizadas
   * @param endpoint - Endpoint relativo (ej: '/custom-endpoint')
   * @param params - Parámetros de query (opcional)
   * @returns Observable con la respuesta
   */
  public get<T = any>(endpoint: string, params?: any): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(
      `${this.apiUrl}${endpoint}`,
      { params }
    );
  }

  /**
   * Método genérico para hacer peticiones POST personalizadas
   * @param endpoint - Endpoint relativo (ej: '/custom-endpoint')
   * @param body - Cuerpo de la petición
   * @returns Observable con la respuesta
   */
  public post<T = any>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(
      `${this.apiUrl}${endpoint}`,
      body
    );
  }
}
