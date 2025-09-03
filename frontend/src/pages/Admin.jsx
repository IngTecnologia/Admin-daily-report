import React from 'react'
import { Link } from 'react-router-dom'

const Admin = () => {
  return (
    <div style={{ minHeight: 'calc(100vh - 80px)', padding: '2rem 0' }}>
      <div className="form-container">
        <div className="form-card">
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            {/* Icono */}
            <div style={{ 
              fontSize: '4rem', 
              marginBottom: '1.5rem'
            }}>
              ='
            </div>

            {/* Título */}
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              color: 'var(--primary-blue)',
              marginBottom: '1rem'
            }}>
              Panel de Administración
            </h1>

            {/* Subtítulo */}
            <p style={{ 
              fontSize: '1.25rem', 
              color: 'var(--neutral-gray)',
              marginBottom: '2rem'
            }}>
              Gestione y analice los reportes diarios del sistema
            </p>

            {/* Estado de desarrollo */}
            <div style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fed7aa',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '2rem',
              textAlign: 'left',
              maxWidth: '600px',
              margin: '0 auto 2rem auto'
            }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600',
                color: 'var(--warning-yellow)',
                marginBottom: '1rem'
              }}>
                =§ En Desarrollo
              </h3>

              <div style={{ 
                fontSize: '0.95rem',
                color: 'var(--dark-text)',
                lineHeight: '1.6'
              }}>
                <p style={{ marginBottom: '1rem' }}>
                  El panel de administración está actualmente en desarrollo. 
                  Las siguientes funcionalidades estarán disponibles próximamente:
                </p>

                <ul style={{ 
                  marginLeft: '1.5rem',
                  marginBottom: '1rem'
                }}>
                  <li style={{ marginBottom: '0.5rem' }}>
                    =Ê Dashboard con métricas y gráficos
                  </li>
                  <li style={{ marginBottom: '0.5rem' }}>
                    =Ë Lista filtrable de todos los reportes
                  </li>
                  <li style={{ marginBottom: '0.5rem' }}>
                    = Búsqueda avanzada por administrador y operación
                  </li>
                  <li style={{ marginBottom: '0.5rem' }}>
                    =È Análisis de tendencias y estadísticas
                  </li>
                  <li style={{ marginBottom: '0.5rem' }}>
                    =å Exportación de datos en Excel/CSV
                  </li>
                  <li style={{ marginBottom: '0.5rem' }}>
                    =ñ Vista detallada de cada reporte
                  </li>
                </ul>

                <p style={{ 
                  fontWeight: '500',
                  color: 'var(--warning-yellow)'
                }}>
                  Por ahora, puede continuar creando reportes diarios normalmente.
                </p>
              </div>
            </div>

            {/* Estadísticas simuladas */}
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '2rem',
              maxWidth: '600px',
              margin: '0 auto 2rem auto'
            }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600',
                color: 'var(--primary-blue)',
                marginBottom: '1rem'
              }}>
                =Ê Vista Previa del Dashboard
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem',
                fontSize: '0.95rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', color: 'var(--success-green)' }}>0</div>
                  <div style={{ color: 'var(--neutral-gray)' }}>Reportes Hoy</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', color: 'var(--primary-blue)' }}>0</div>
                  <div style={{ color: 'var(--neutral-gray)' }}>Total Reportes</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', color: 'var(--warning-yellow)' }}>0</div>
                  <div style={{ color: 'var(--neutral-gray)' }}>Incidencias</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', color: 'var(--accent-orange)' }}>11</div>
                  <div style={{ color: 'var(--neutral-gray)' }}>Administradores</div>
                </div>
              </div>
            </div>

            {/* Acciones */}
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
                =Ý Crear Nuevo Reporte
              </Link>

              <button
                className="btn btn-secondary"
                disabled
                style={{ 
                  opacity: 0.6,
                  cursor: 'not-allowed'
                }}
                title="Próximamente disponible"
              >
                =Ê Ver Reportes (Próximamente)
              </button>
            </div>

            {/* Información adicional */}
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: 'var(--success-green)',
              maxWidth: '500px',
              margin: '2rem auto 0 auto'
            }}>
               <strong>Estado del Sistema:</strong> El formulario de reportes está completamente funcional. 
              El área admin se completará en la siguiente fase del desarrollo.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Admin