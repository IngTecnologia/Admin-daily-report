import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../common/Loading'

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isLoading, user, hasAdminAccess } = useAuth()

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <Loading />
        <p style={{ color: 'var(--neutral-gray)' }}>
          Verificando sesión...
        </p>
      </div>
    )
  }

  // Si no está autenticado, no renderizar nada (App.jsx manejará el redirect)
  if (!isAuthenticated) {
    return null
  }

  // Si se requiere acceso admin pero el usuario no lo tiene
  if (requireAdmin && !hasAdminAccess()) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div className="form-card" style={{ maxWidth: '500px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
          <h2 style={{ 
            color: 'var(--error-red)', 
            marginBottom: '1rem',
            fontSize: '1.5rem'
          }}>
            Acceso Denegado
          </h2>
          <p style={{ 
            color: 'var(--neutral-gray)',
            marginBottom: '1.5rem',
            lineHeight: '1.6'
          }}>
            No tienes permisos para acceder al panel de administración.
            <br />
            Tu rol actual: <strong>{user?.role === 'form_user' ? 'Usuario de Formulario' : user?.role}</strong>
          </p>
          
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0', 
            borderRadius: '6px',
            padding: '1rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            textAlign: 'left'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
              ✅ Qué puedes hacer:
            </div>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: 0,
              color: 'var(--neutral-gray)'
            }}>
              <li>📝 Llenar y enviar reportes diarios</li>
              <li>✅ Ver confirmaciones de envío</li>
              <li>👤 Gestionar tu perfil de usuario</li>
            </ul>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="btn btn-primary"
          >
            🏠 Ir al Formulario
          </button>
        </div>
      </div>
    )
  }

  // Si todo está bien, renderizar los children
  return children
}

export default ProtectedRoute