import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Interceptor HTTP que añade automáticamente el token y parámetros GET
 * a todas las peticiones salientes
 *
 * Características:
 * - Añade header X-Auth-Token con el token capturado al inicio
 * - Añade todos los query params iniciales como headers adicionales
 * - Maneja errores 401 (Unauthorized) invalidando el token
 * - Se ejecuta automáticamente en TODAS las peticiones HTTP
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiService = inject(ApiService);

  // Obtener token y params del ApiService
  const token = apiService.getToken();
  const queryParams = apiService.getQueryParams();

  // Si no hay token, dejar pasar la petición sin modificar
  if (!token) {
    console.warn('[AuthInterceptor] No hay token disponible');
    return next(req);
  }

  // Clonar la petición y añadir headers
  let modifiedReq = req.clone({
    setHeaders: {
      'X-Auth-Token': token
    }
  });

  // Añadir query params como headers adicionales (opcional)
  // Esto permite enviar parámetros como lng, userId, etc.
  if (queryParams) {
    const additionalHeaders: { [key: string]: string } = {};

    // Añadir lng si existe
    if (queryParams.lng) {
      additionalHeaders['X-Language'] = queryParams.lng;
    }

    // Añadir otros parámetros personalizados si existen
    // (excluir 'token' porque ya se envía como X-Auth-Token)
    Object.keys(queryParams).forEach(key => {
      if (key !== 'token' && key !== 'lng' && queryParams[key]) {
        additionalHeaders[`X-Param-${key}`] = String(queryParams[key]);
      }
    });

    // Clonar nuevamente con los headers adicionales
    if (Object.keys(additionalHeaders).length > 0) {
      modifiedReq = modifiedReq.clone({
        setHeaders: additionalHeaders
      });
    }
  }

  console.log('[AuthInterceptor] Petición interceptada:', {
    url: modifiedReq.url,
    method: modifiedReq.method,
    headers: {
      'X-Auth-Token': token,
      ...modifiedReq.headers.keys().reduce((acc, key) => {
        if (key.startsWith('X-')) {
          acc[key] = modifiedReq.headers.get(key);
        }
        return acc;
      }, {} as { [key: string]: string | null })
    }
  });

  // Enviar la petición modificada y manejar errores
  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el backend retorna 401 (Unauthorized), invalidar el token
      if (error.status === 401) {
        console.error('[AuthInterceptor] Error 401 - Token inválido o expirado');
        apiService.invalidateToken();

        // Opcional: Mostrar un mensaje al usuario
        // Puedes emitir un evento o usar un servicio de notificaciones
        alert('Tu sesión ha expirado. Por favor, recarga la página.');
      }

      // Propagar el error
      return throwError(() => error);
    })
  );
};
