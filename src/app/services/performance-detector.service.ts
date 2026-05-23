import { Injectable } from '@angular/core';

export enum DevicePerformanceTier {
  HIGH = 'high',      // Dispositivos potentes (desktop, tablets premium, flagships)
  MEDIUM = 'medium',  // Gama media (mayoría de smartphones modernos)
  LOW = 'low'         // Gama baja (dispositivos antiguos o débiles)
}

export interface PerformanceProfile {
  tier: DevicePerformanceTier;
  dropShadowsEnabled: boolean;  // Sombras en elementos
  confettiParticles: number;    // Cantidad de partículas de confetti
  videoBackground: boolean;     // Video de fondo o imagen estática
  backdropBlur: boolean;        // Backdrop-filter blur
  animationQuality: 'high' | 'medium' | 'low';
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceDetectorService {
  private deviceTier: DevicePerformanceTier = DevicePerformanceTier.MEDIUM;
  private profile: PerformanceProfile;

  constructor() {
    this.deviceTier = this.detectDeviceTier();
    this.profile = this.getProfileForTier(this.deviceTier);
    console.log(`📊 Dispositivo detectado: ${this.deviceTier.toUpperCase()}`);
    console.log('📊 Perfil de rendimiento:', this.profile);
  }

  /**
   * Detecta el nivel de rendimiento del dispositivo
   */
  private detectDeviceTier(): DevicePerformanceTier {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();

    // 1. Detectar dispositivos móviles
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

    // 2. Obtener información de hardware (si está disponible)
    const hardwareConcurrency = navigator.hardwareConcurrency || 2;
    const deviceMemory = (navigator as any).deviceMemory || 4; // GB (API experimental)

    // 3. Detectar GPU (aproximado)
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    let gpuTier = 'unknown';

    if (gl) {
      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();

        // GPUs de gama alta
        if (renderer.includes('nvidia') || renderer.includes('adreno 6') || renderer.includes('adreno 7') ||
            renderer.includes('apple a15') || renderer.includes('apple a16') || renderer.includes('apple a17') ||
            renderer.includes('mali-g7') || renderer.includes('mali-g8')) {
          gpuTier = 'high';
        }
        // GPUs de gama media
        else if (renderer.includes('adreno 5') || renderer.includes('adreno 4') ||
                 renderer.includes('mali-g5') || renderer.includes('mali-g6') ||
                 renderer.includes('apple a12') || renderer.includes('apple a13') || renderer.includes('apple a14')) {
          gpuTier = 'medium';
        }
        // GPUs de gama baja
        else {
          gpuTier = 'low';
        }
      }
    }

    // 4. Detectar dispositivos específicos conocidos por ser lentos
    const isLowEndDevice =
      userAgent.includes('android 4') ||
      userAgent.includes('android 5') ||
      userAgent.includes('android 6') ||
      /redmi 5|redmi 6|redmi 7|redmi 8|redmi 9a|galaxy j|galaxy a0|galaxy a1|moto e|moto g4|moto g5/.test(userAgent);

    // 5. Desktop siempre HIGH (asumiendo que tiene mejor hardware)
    if (!isMobile) {
      // Desktop: verificar CPU cores
      if (hardwareConcurrency >= 8) {
        return DevicePerformanceTier.HIGH;
      } else if (hardwareConcurrency >= 4) {
        return DevicePerformanceTier.MEDIUM;
      } else {
        return DevicePerformanceTier.LOW;
      }
    }

    // 6. Móvil: combinar todos los factores
    if (isLowEndDevice) {
      return DevicePerformanceTier.LOW;
    }

    // Usar GPU tier si está disponible
    if (gpuTier === 'high' && hardwareConcurrency >= 6 && deviceMemory >= 4) {
      return DevicePerformanceTier.HIGH;
    } else if (gpuTier === 'low' || hardwareConcurrency <= 4 || deviceMemory < 3) {
      return DevicePerformanceTier.LOW;
    }

    // Por defecto: MEDIUM (safe choice)
    return DevicePerformanceTier.MEDIUM;
  }

  /**
   * Obtiene el perfil de rendimiento para un tier específico
   */
  private getProfileForTier(tier: DevicePerformanceTier): PerformanceProfile {
    switch (tier) {
      case DevicePerformanceTier.HIGH:
        return {
          tier: DevicePerformanceTier.HIGH,
          dropShadowsEnabled: true,
          confettiParticles: 60,
          videoBackground: true,
          backdropBlur: true,
          animationQuality: 'high'
        };

      case DevicePerformanceTier.MEDIUM:
        return {
          tier: DevicePerformanceTier.MEDIUM,
          dropShadowsEnabled: true,    // Sombras simples OK
          confettiParticles: 30,       // Mitad de confetti
          videoBackground: false,      // Imagen estática
          backdropBlur: false,         // Sin backdrop-filter
          animationQuality: 'medium'
        };

      case DevicePerformanceTier.LOW:
        return {
          tier: DevicePerformanceTier.LOW,
          dropShadowsEnabled: false,   // Sin sombras
          confettiParticles: 15,       // Mínimo confetti
          videoBackground: false,
          backdropBlur: false,
          animationQuality: 'low'
        };
    }
  }

  /**
   * Obtiene el perfil de rendimiento actual
   */
  public getPerformanceProfile(): PerformanceProfile {
    return this.profile;
  }

  /**
   * Obtiene el tier del dispositivo
   */
  public getDeviceTier(): DevicePerformanceTier {
    return this.deviceTier;
  }

  /**
   * Permite forzar un tier manualmente (para testing o override de usuario)
   */
  public setDeviceTier(tier: DevicePerformanceTier): void {
    this.deviceTier = tier;
    this.profile = this.getProfileForTier(tier);
    console.log(`📊 Tier cambiado manualmente a: ${tier.toUpperCase()}`);
    console.log('📊 Nuevo perfil:', this.profile);
  }

  /**
   * Verifica si una característica específica está habilitada
   */
  public isFeatureEnabled(feature: keyof PerformanceProfile): boolean {
    const value = this.profile[feature];
    return typeof value === 'boolean' ? value : (typeof value === 'number' ? value > 0 : true);
  }
}
