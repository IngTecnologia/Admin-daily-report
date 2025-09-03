import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const Header = () => {
  const location = useLocation()
  const isAdminSection = location.pathname.startsWith('/admin')

  return (
    <header className="app-header">
      <div className="header-content">
        <Link to="/" className="logo">
          =Ê Admin Daily Report
        </Link>
        
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {!isAdminSection && (
            <Link 
              to="/"
              style={{
                textDecoration: 'none',
                color: 'var(--primary-blue)',
                fontWeight: '500'
              }}
            >
              Nuevo Reporte
            </Link>
          )}
          
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
            =' Admin Panel
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Header