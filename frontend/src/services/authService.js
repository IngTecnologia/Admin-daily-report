/**
 * Servicio de autenticación con soporte para modo legacy
 * Intenta usar backend primero, si falla usa autenticación local
 */
import { API_BASE_URL } from './constants';
import { validateCredentials } from '../config/users';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';
const USE_LEGACY_AUTH = false; // Backend PostgreSQL activo

class AuthService {
  constructor() {
    this.baseUrl = API_BASE_URL.replace('/api/v1', ''); // Quitar el prefijo para auth
  }

  /**
   * Login de usuario
   * @param {string} username - Email o username
   * @param {string} password - Contraseña
   * @returns {Promise<Object>} Usuario autenticado
   */
  async login(username, password) {
    // Modo legacy: usar validación local
    if (USE_LEGACY_AUTH) {
      return this.loginLegacy(username, password);
    }

    // Modo backend: usar API
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al iniciar sesión');
      }

      const data = await response.json();

      // Guardar tokens y usuario en localStorage
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      // Configurar token para futuras requests
      this.setAuthHeader(data.access_token);

      return data.user;
    } catch (error) {
      console.error('Backend login failed, trying legacy mode:', error);
      // Fallback a modo legacy
      return this.loginLegacy(username, password);
    }
  }

  /**
   * Login legacy usando validación local
   * @param {string} username - Email o username
   * @param {string} password - Contraseña
   * @returns {Promise<Object>} Usuario autenticado
   */
  async loginLegacy(username, password) {
    try {
      const user = validateCredentials(username, password);

      if (!user) {
        throw new Error('Usuario o contraseña incorrectos');
      }

      // Generar un token simple para modo legacy
      const legacyToken = btoa(JSON.stringify({ username, timestamp: Date.now() }));

      // Guardar en localStorage
      localStorage.setItem(TOKEN_KEY, legacyToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      // Configurar token
      this.setAuthHeader(legacyToken);

      return user;
    } catch (error) {
      console.error('Legacy login error:', error);
      throw error;
    }
  }

  /**
   * Logout del usuario
   */
  async logout() {
    try {
      const token = this.getToken();
      if (token) {
        // Notificar al backend
        await fetch(`${this.baseUrl}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Limpiar localStorage
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      // Limpiar header de autorización
      this.clearAuthHeader();
    }
  }

  /**
   * Obtener usuario actual
   * @returns {Object|null} Usuario actual o null
   */
  getCurrentUser() {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Obtener token de acceso
   * @returns {string|null} Token o null
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Obtener refresh token
   * @returns {string|null} Refresh token o null
   */
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Verificar si el usuario está autenticado
   * @returns {boolean} True si está autenticado
   */
  isAuthenticated() {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  /**
   * Verificar si el usuario es admin
   * @returns {boolean} True si es admin
   */
  isAdmin() {
    const user = this.getCurrentUser();
    return user && (user.role === 'admin' || user.role === 'supervisor' || user.role === 'admin_user');
  }

  /**
   * Renovar token de acceso
   * @returns {Promise<string>} Nuevo token
   */
  async refreshToken() {
    // Modo legacy: generar nuevo token local
    if (USE_LEGACY_AUTH) {
      const user = this.getCurrentUser();
      if (!user) {
        throw new Error('No user session available');
      }

      // Generar nuevo token con timestamp actualizado
      const newToken = btoa(JSON.stringify({
        username: user.username,
        timestamp: Date.now()
      }));

      localStorage.setItem(TOKEN_KEY, newToken);
      this.setAuthHeader(newToken);

      return newToken;
    }

    // Modo backend: usar API de refresh
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();

      // Actualizar tokens
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);

      // Configurar nuevo token
      this.setAuthHeader(data.access_token);

      return data.access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Si falla el refresh, hacer logout
      await this.logout();
      throw error;
    }
  }

  /**
   * Cambiar contraseña
   * @param {string} currentPassword - Contraseña actual
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<void>}
   */
  async changePassword(currentPassword, newPassword) {
    const token = this.getToken();

    if (!token) {
      throw new Error('No está autenticado');
    }

    const response = await fetch(`${this.baseUrl}/api/v1/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al cambiar contraseña');
    }

    return response.json();
  }

  /**
   * Verificar si el token es válido
   * @returns {Promise<boolean>} True si es válido
   */
  async verifyToken() {
    const token = this.getToken();

    if (!token) {
      return false;
    }

    // Modo legacy: solo verificar que exista el token y el usuario
    if (USE_LEGACY_AUTH) {
      const user = this.getCurrentUser();
      return !!(token && user);
    }

    // Modo backend: verificar con API
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.ok;
    } catch {
      // Fallback a verificación legacy
      const user = this.getCurrentUser();
      return !!(token && user);
    }
  }

  /**
   * Configurar header de autorización para axios/fetch
   * @param {string} token - Token JWT
   */
  setAuthHeader(token) {
    // Para axios (si se usa)
    if (window.axios) {
      window.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Para fetch, se debe incluir manualmente en cada request
    // Guardamos el token para uso global
    window.authToken = token;
  }

  /**
   * Limpiar header de autorización
   */
  clearAuthHeader() {
    if (window.axios) {
      delete window.axios.defaults.headers.common['Authorization'];
    }
    delete window.authToken;
  }

  /**
   * Interceptor para agregar token a todas las requests
   * @param {RequestInit} config - Configuración de fetch
   * @returns {RequestInit} Configuración con token
   */
  addAuthToRequest(config = {}) {
    const token = this.getToken();

    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      };
    }

    return config;
  }

  /**
   * Manejar errores de autenticación
   * @param {Response} response - Respuesta del servidor
   */
  async handleAuthError(response) {
    if (response.status === 401) {
      // Token expirado, intentar refresh
      try {
        await this.refreshToken();
        return true; // Reintentar request
      } catch {
        // Refresh falló, hacer logout
        await this.logout();
        window.location.href = '/login';
        return false;
      }
    }
    return false;
  }
}

// Exportar instancia única
const authService = new AuthService();

// Configurar token inicial si existe
const token = authService.getToken();
if (token) {
  authService.setAuthHeader(token);
}

export default authService;

// Exportar funciones helpers
export const login = (username, password) => authService.login(username, password);
export const logout = () => authService.logout();
export const getCurrentUser = () => authService.getCurrentUser();
export const isAuthenticated = () => authService.isAuthenticated();
export const isAdmin = () => authService.isAdmin();
export const getToken = () => authService.getToken();
export const changePassword = (current, newPass) => authService.changePassword(current, newPass);