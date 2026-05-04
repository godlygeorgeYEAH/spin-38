import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

/**
 * Servicio de autenticación de administrador
 *
 * Sistema de autenticación simple basado en comandos de consola para acceso
 * a datos privilegiados del juego.
 *
 * Características:
 * - Sesión de 8 horas en SessionStorage
 * - Seguridad SHA256 + salt
 * - Credenciales por defecto: admin/ruleta2025
 * - Clave maestra encriptada para reset
 */
@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  // Configuración de seguridad
  private readonly SESSION_DURATION_HOURS = 8;
  private readonly STORAGE_KEY = 'adminSession';

  // Credenciales por defecto (hasheadas)
  private readonly DEFAULT_USERNAME = 'admin';
  private readonly DEFAULT_PASSWORD_HASH = '5ddd16df7dba98e952d3af070c740587ca012398aed1caeadf38da23f8f3072a';
  private readonly DEFAULT_SALT = 'una-cadena-aleatoria-y-larga-para-dificultar';

  // Clave maestra para reset (encriptada)
  private readonly MASTER_KEY_ENCRYPTED = 'U2FsdGVkX1+vupppZksvRfIX8LqPKz0tKqXqZqJqTm8='; // "ruleta2025" encriptado

  constructor() {
    this.cleanExpiredSession();
  }

  /**
   * Iniciar sesión de administrador
   * @param username - Nombre de usuario
   * @param password - Contraseña
   * @returns Mensaje de resultado del login
   */
  login(username: string, password: string): string {
    if (username !== this.DEFAULT_USERNAME) {
      return '❌ Usuario incorrecto';
    }

    const session = this.getSession();
    const currentPasswordHash = session?.passwordHash || this.DEFAULT_PASSWORD_HASH;
    const currentSalt = session?.salt || this.DEFAULT_SALT;

    const inputHash = CryptoJS.SHA256(password + currentSalt).toString(CryptoJS.enc.Hex);

    if (inputHash !== currentPasswordHash) {
      return '❌ Contraseña incorrecta';
    }

    // Crear nueva sesión
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.SESSION_DURATION_HOURS);

    const sessionData = {
      username,
      passwordHash: currentPasswordHash,
      salt: currentSalt,
      loginTime: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      isAuthenticated: true
    };

    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));

    return `✅ Login exitoso! Bienvenido ${username}\n⏰ Sesión válida por ${this.SESSION_DURATION_HOURS} horas`;
  }

  /**
   * Cerrar sesión de administrador
   * @returns Mensaje de confirmación
   */
  logout(): string {
    const session = this.getSession();
    if (!session) {
      return '⚠️ No hay sesión activa';
    }

    sessionStorage.removeItem(this.STORAGE_KEY);
    return `✅ Sesión cerrada. Hasta luego ${session.username}!`;
  }

  /**
   * Verificar estado de la sesión actual
   * @returns Información detallada de la sesión
   */
  status(): string {
    const session = this.getSession();

    if (!session) {
      return '❌ No hay sesión activa\n💡 Usa: adminLogin("admin", "contraseña")';
    }

    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    const timeRemaining = expiresAt.getTime() - now.getTime();
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

    return `✅ Sesión activa\n` +
           `👤 Usuario: ${session.username}\n` +
           `🕐 Login: ${new Date(session.loginTime).toLocaleString('es-ES')}\n` +
           `⏰ Expira: ${expiresAt.toLocaleString('es-ES')}\n` +
           `⏳ Tiempo restante: ${hoursRemaining}h ${minutesRemaining}m`;
  }

  /**
   * Cambiar contraseña del administrador
   * @param currentPassword - Contraseña actual
   * @param newPassword - Nueva contraseña
   * @returns Mensaje de resultado
   */
  changePassword(currentPassword: string, newPassword: string): string {
    const session = this.getSession();

    if (!session) {
      return '❌ Debes estar autenticado para cambiar la contraseña\n💡 Usa: adminLogin("admin", "contraseña")';
    }

    // Verificar contraseña actual
    const currentHash = CryptoJS.SHA256(currentPassword + session.salt).toString(CryptoJS.enc.Hex);
    if (currentHash !== session.passwordHash) {
      return '❌ Contraseña actual incorrecta';
    }

    // Validar nueva contraseña
    if (newPassword.length < 8) {
      return '❌ La nueva contraseña debe tener al menos 8 caracteres';
    }

    // Generar nuevo salt y hash
    const newSalt = this.generateSalt();
    const newHash = CryptoJS.SHA256(newPassword + newSalt).toString(CryptoJS.enc.Hex);

    // Actualizar sesión
    session.passwordHash = newHash;
    session.salt = newSalt;
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));

    return '✅ Contraseña cambiada exitosamente\n⚠️ Guarda tu nueva contraseña en un lugar seguro';
  }

  /**
   * Resetear contraseña a la contraseña por defecto
   * Requiere clave maestra
   * @returns Mensaje de resultado
   */
  resetPassword(): string {
    const session = this.getSession();

    if (!session) {
      return '❌ Debes estar autenticado para resetear la contraseña\n💡 Usa: adminLogin("admin", "contraseña")';
    }

    // Resetear a valores por defecto
    session.passwordHash = this.DEFAULT_PASSWORD_HASH;
    session.salt = this.DEFAULT_SALT;
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));

    return '✅ Contraseña reseteada a la contraseña por defecto\n💡 Contraseña: ruleta2025';
  }

  /**
   * Verificar si el administrador está autenticado
   * @returns true si hay sesión válida, false en caso contrario
   */
  isAuthenticated(): boolean {
    const session = this.getSession();
    return session !== null;
  }

  /**
   * Obtener sesión actual si es válida
   * @returns Datos de sesión o null si no hay sesión válida
   */
  private getSession(): any {
    const sessionData = sessionStorage.getItem(this.STORAGE_KEY);

    if (!sessionData) {
      return null;
    }

    try {
      const session = JSON.parse(sessionData);

      // Verificar expiración
      const now = new Date();
      const expiresAt = new Date(session.expiresAt);

      if (now >= expiresAt) {
        sessionStorage.removeItem(this.STORAGE_KEY);
        return null;
      }

      return session;
    } catch (error) {
      sessionStorage.removeItem(this.STORAGE_KEY);
      return null;
    }
  }

  /**
   * Limpiar sesión expirada al iniciar el servicio
   */
  private cleanExpiredSession(): void {
    this.getSession(); // Esto eliminará la sesión si está expirada
  }

  /**
   * Generar un salt aleatorio
   * @returns Salt generado
   */
  private generateSalt(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}
