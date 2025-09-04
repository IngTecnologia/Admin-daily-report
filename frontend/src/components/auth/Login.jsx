import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../common/Loading'
import Alert from '../common/Alert'

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  const { login, isLoading, error, clearError } = useAuth()

  useEffect(() => {
    // Limpiar errores cuando el componente se monta
    clearError()
  }, [clearError])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Limpiar error cuando el usuario empiece a escribir
    if (error) {
      clearError()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.username || !formData.password) {
      return
    }

    const result = await login(formData.username, formData.password)
    
    if (result.success) {
      // El redirect se maneja automáticamente por las rutas protegidas
      console.log('Login exitoso:', result.user)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div className="form-card" style={{ maxWidth: '450px', width: '100%' }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '2rem',
          padding: '1rem 0'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: 'var(--primary-red)',
            marginBottom: '0.5rem'
          }}>
            Iniciar Sesión
          </h1>
          <p style={{ 
            color: 'var(--neutral-gray)',
            fontSize: '1rem'
          }}>
            Sistema de Reporte Diario Administrativo
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert 
            type="error" 
            message={error}
            onClose={clearError}
          />
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ padding: '0 2rem 2rem 2rem' }}>
          <div className="form-field" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="username" className="form-label">
              Usuario
            </label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className="form-input"
              placeholder="Ingrese su usuario"
              required
              autoComplete="username"
              disabled={isLoading}
              style={{ opacity: isLoading ? 0.7 : 1 }}
            />
          </div>

          <div className="form-field" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="form-input"
                placeholder="Ingrese su contraseña"
                required
                autoComplete="current-password"
                disabled={isLoading}
                style={{ 
                  opacity: isLoading ? 0.7 : 1,
                  paddingRight: '3rem'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  color: 'var(--neutral-gray)',
                  opacity: isLoading ? 0.5 : 0.7,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => !isLoading && (e.target.style.opacity = '1')}
                onMouseLeave={(e) => !isLoading && (e.target.style.opacity = '0.7')}
              >
                {showPassword ? '●●●' : '○○○'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !formData.username || !formData.password}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.1rem',
              marginBottom: '1.5rem'
            }}
          >
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Loading />
                Iniciando sesión...
              </div>
            ) : (
              <>
                🚀 Ingresar
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  )
}

export default Login