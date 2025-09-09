import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, hasAdminAccess, getSessionInfo, isSessionExpired } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [sessionInfo, setSessionInfo] = useState(null)
  const menuRef = useRef(null)
  const isAdminSection = location.pathname.startsWith('/admin')

  // Actualizar información de sesión cada minuto
  useEffect(() => {
    const updateSessionInfo = () => {
      if (user) {
        setSessionInfo(getSessionInfo())
      }
    }

    updateSessionInfo()
    const interval = setInterval(updateSessionInfo, 60000) // Cada minuto

    return () => clearInterval(interval)
  }, [user, getSessionInfo])

  // Verificar si perdió permisos de admin y está en sección admin
  useEffect(() => {
    if (isAdminSection && !hasAdminAccess()) {
      // Redirigir al home si perdió permisos de admin
      navigate('/', { replace: true })
    }
  }, [isAdminSection, hasAdminAccess, navigate])

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  // Cerrar menú cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <header className="app-header">
      <div className="header-content">
        <Link to="/" className="logo">
          📊 Reporte Diario Administrativo
        </Link>
        
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {!isAdminSection && (
            <Link 
              to="/"
              style={{
                textDecoration: 'none',
                color: 'var(--primary-red)',
                fontWeight: '500'
              }}
            >
              📝 Nuevo Reporte
            </Link>
          )}
          
          {hasAdminAccess() && (
            <Link 
              to="/admin"
              style={{
                textDecoration: 'none',
                color: isAdminSection ? 'var(--accent-orange)' : 'var(--neutral-gray)',
                fontWeight: '500',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                background: isAdminSection ? '#fff3e0' : 'transparent'
              }}
            >
              ⚙️ Panel de Administración
            </Link>
          )}

          {/* User Menu */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                background: 'none',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--dark-text)',
                fontSize: '0.875rem'
              }}
            >
              👤 {user?.fullName || user?.username}
              <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                {showUserMenu ? '▲' : '▼'}
              </span>
            </button>

            {showUserMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.25rem',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                minWidth: '200px'
              }}>
                <div style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: '0.875rem'
                }}>
                  <div style={{ fontWeight: '500', color: 'var(--dark-text)' }}>
                    {user?.fullName}
                  </div>
                  <div style={{ color: 'var(--neutral-gray)', fontSize: '0.8rem' }}>
                    {user?.area}
                  </div>
                  <div style={{ 
                    color: 'var(--primary-red)', 
                    fontSize: '0.75rem',
                    marginTop: '0.25rem'
                  }}>
                    {user?.role === 'admin_user' ? 'Administrador' : 'Usuario'}
                  </div>
                  {sessionInfo && (
                    <div style={{ 
                      color: sessionInfo.timeLeft < 30 * 60 * 1000 ? 'var(--error-red)' : 'var(--neutral-gray)', 
                      fontSize: '0.7rem',
                      marginTop: '0.25rem'
                    }}>
                      ⏰ Sesión expira: {sessionInfo.expiresAt.toLocaleTimeString('es-CO', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                      {sessionInfo.timeLeft < 30 * 60 * 1000 && (
                        <div style={{ color: 'var(--warning-yellow)', fontSize: '0.65rem' }}>
                          ⚠️ Expira pronto
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: 'var(--error-red)',
                    fontSize: '0.875rem',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  🚪 Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header