import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div style={{ minHeight: 'calc(100vh - 80px)', padding: '2rem 0' }}>
      <div className="form-container">
        <div className="form-card">
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ 
              fontSize: '8rem', 
              marginBottom: '1.5rem',
              opacity: '0.7'
            }}>
              🔍
            </div>

            <h1 style={{ 
              fontSize: '3rem', 
              fontWeight: '700', 
              color: 'var(--neutral-gray)',
              marginBottom: '0.5rem'
            }}>
              404
            </h1>

            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600',
              color: 'var(--dark-text)',
              marginBottom: '1rem'
            }}>
              Página no encontrada
            </h2>

            <p style={{ 
              fontSize: '1.125rem', 
              color: 'var(--neutral-gray)',
              marginBottom: '2rem',
              maxWidth: '500px',
              margin: '0 auto 2rem auto'
            }}>
              Lo sentimos, la página que está buscando no existe o ha sido movida.
            </p>

            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '2rem',
              textAlign: 'left',
              maxWidth: '500px',
              margin: '0 auto 2rem auto'
            }}>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: '600',
                color: 'var(--primary-blue)',
                marginBottom: '1rem'
              }}>
                💡 ¿Qué puede hacer?
              </h3>

              <ul style={{ 
                listStyle: 'none', 
                padding: 0,
                margin: 0,
                fontSize: '0.95rem',
                color: 'var(--neutral-gray)'
              }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  ✅ Verificar que la URL esté escrita correctamente
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  🏠 Volver a la página principal
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  📀 Acceder al panel de administración
                </li>
                <li>
                  📝 Crear un nuevo reporte diario
                </li>
              </ul>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <Link 
                to="/"
                className="btn btn-primary"
                style={{ textDecoration: 'none' }}
              >
                🏠 Ir al Inicio
              </Link>

              <Link 
                to="/admin"
                className="btn btn-secondary"
                style={{ textDecoration: 'none' }}
              >
                📊 Panel Admin
              </Link>
            </div>

            <div style={{
              marginTop: '3rem',
              padding: '1rem',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: 'var(--primary-blue)',
              maxWidth: '400px',
              margin: '3rem auto 0 auto'
            }}>
              <strong>📞 ¿Necesita ayuda?</strong>
              <br />
              Si el problema persiste, contacte al administrador del sistema.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound