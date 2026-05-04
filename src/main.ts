import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { APP_INITIALIZER } from '@angular/core';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { ApiService } from './app/services/api.service';
import { authInterceptor } from './app/services/auth.interceptor';
import { QueryParams } from './app/interfaces/query-params.interface';

/**
 * Factory function para APP_INITIALIZER
 * Se ejecuta ANTES de que Angular cargue la aplicación
 * Captura los parámetros GET de la URL y los pasa al ApiService
 */
function initializeApp(apiService: ApiService) {
  return () => {
    console.log('[APP_INITIALIZER] Iniciando captura de parámetros GET...');

    // Capturar query params de la URL usando window.location
    const urlParams = new URLSearchParams(window.location.search);

    // Convertir URLSearchParams a objeto
    const params: QueryParams = {
      token: urlParams.get('token') || '',
      lng: urlParams.get('lng') || undefined
    };

    // Capturar todos los demás parámetros dinámicos
    urlParams.forEach((value, key) => {
      if (key !== 'token' && key !== 'lng') {
        params[key] = value;
      }
    });

    console.log('[APP_INITIALIZER] Parámetros capturados:', params);

    // Validar que el token exista
    if (!params.token) {
      console.error('[APP_INITIALIZER] ⚠️ ADVERTENCIA: No se encontró token en la URL');
      console.error('[APP_INITIALIZER] La aplicación puede no funcionar correctamente sin token');

      // Opcional: Bloquear la carga de la app si no hay token
      // throw new Error('Token requerido en la URL');
    }

    // Inicializar el ApiService con los parámetros
    apiService.initialize(params);

    console.log('[APP_INITIALIZER] ✅ Inicialización completada');

    // Opcional: Retornar una promesa para validar el token con el backend
    // return apiService.validateToken().toPromise();
  };
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),

    // Configurar HttpClient con el interceptor de autenticación
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),

    // APP_INITIALIZER: Se ejecuta antes de cargar la app
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [ApiService],
      multi: true
    }
  ],
});

// Ionic icons are handled automatically in this version
