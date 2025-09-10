// API Service para Admin Daily Report
// Maneja todas las llamadas HTTP al backend

import { API_BASE_URL, API_ENDPOINTS } from './constants.js'

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  }

  // Método base para hacer requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const config = {
      headers: this.headers,
      ...options,
    }

    try {
      console.log(`API Request: ${config.method || 'GET'} ${url}`)
      
      const response = await fetch(url, config)
      
      console.log(`API Response: ${response.status} - ${url}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API Error: ${response.status} - ${errorText}`)
        throw new Error(`HTTP Error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`API Request failed for ${url}:`, error)
      throw error
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' })
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }

  // Health check
  async healthCheck() {
    return this.get('/health')
  }

  // Endpoints específicos del sistema

  // Reportes
  async getReportes(filters = {}) {
    const params = new URLSearchParams(filters)
    const endpoint = `${API_ENDPOINTS.REPORTES}?${params}`
    return this.get(endpoint)
  }

  async createReporte(reporteData) {
    return this.post(API_ENDPOINTS.REPORTES, reporteData)
  }

  // Admin endpoints
  async getAdminReportes(filters = {}) {
    const params = new URLSearchParams(filters)
    const endpoint = `${API_ENDPOINTS.ADMIN_REPORTES}?${params}`
    return this.get(endpoint)
  }

  async getAnalytics(filters = {}) {
    const params = new URLSearchParams(filters)
    const endpoint = `${API_ENDPOINTS.ADMIN_ANALYTICS}?${params}`
    return this.get(endpoint)
  }

  async exportData(filters = {}) {
    const params = new URLSearchParams(filters)
    const endpoint = `${API_ENDPOINTS.ADMIN_EXPORT}?${params}`
    return this.get(endpoint)
  }

  async deleteReporte(reporteId) {
    return this.delete(`${API_ENDPOINTS.ADMIN_REPORTES}/${reporteId}`)
  }
}

// Exportar instancia singleton
export const api = new ApiService()
export default api