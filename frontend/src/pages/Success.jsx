import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const Success = () => {
  const location = useLocation()
  const { reportData, timestamp } = location.state || {}

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 80px)', padding: '2rem 0' }}>
      <div className="form-container">
        <div className="form-card">
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ 
              fontSize: '6rem', 
              marginBottom: '1.5rem',
              animation: 'bounce 2s infinite'
            }}>
              ✅
            </div>

            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              color: 'var(--success-green)',
              marginBottom: '1rem'
            }}>
              ¡Reporte Enviado Exitosamente!
            </h1>

            <p style={{ 
              fontSize: '1.25rem', 
              color: 'var(--neutral-gray)',
              marginBottom: '2rem'
            }}>
              Su reporte diario ha sido registrado correctamente
            </p>

            {reportData && (
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
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
                  color: 'var(--primary-blue)',
                  marginBottom: '1rem'
                }}>
                  📋 Resumen del Reporte
                </h3>

                <div style={{ 
                  display: 'grid', 
                  gap: '0.75rem',
                  fontSize: '0.95rem'
                }}>
                  <div>
                    <strong>👤 Administrador:</strong> {reportData.administrador}
                  </div>
                  <div>
                    <strong>🏢 Operacion:</strong> {reportData.cliente_operacion}
                  </div>
                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <span><strong>⏰ Horas:</strong> {reportData.horas_diarias}h</span>
                    <span><strong>👔 Staff:</strong> {reportData.personal_staff}</span>
                    <span><strong>🏭 Base:</strong> {reportData.personal_base}</span>
                  </div>

                  {reportData.incidencias && reportData.incidencias.length > 0 && (
                    <div>
                      <strong>🚨 Incidencias:</strong> {reportData.incidencias.length}
                      <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                        {reportData.incidencias.map((inc, idx) => (
                          <li key={idx} style={{ marginBottom: '0.25rem' }}>
                            {inc.nombre_empleado} - {inc.tipo}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {reportData.ingresos_retiros && reportData.ingresos_retiros.length > 0 && (
                    <div>
                      <strong>🔄 Movimientos:</strong> {reportData.ingresos_retiros.length}
                      <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                        {reportData.ingresos_retiros.map((mov, idx) => (
                          <li key={idx} style={{ marginBottom: '0.25rem' }}>
                            <span style={{ 
                              color: mov.estado === 'Ingreso' ? 'var(--success-green)' : 'var(--error-red)',
                              fontWeight: '500'
                            }}>
                              {mov.estado === 'Ingreso' ? '⬆️' : '⬇️'} {mov.estado}:
                            </span>{' '}
                            {mov.nombre_empleado} ({mov.cargo})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {timestamp && (
                    <div style={{ 
                      marginTop: '1rem', 
                      paddingTop: '1rem', 
                      borderTop: '1px solid #e2e8f0',
                      color: 'var(--neutral-gray)',
                      fontSize: '0.875rem'
                    }}>
                      <strong>📅 Enviado:</strong> {formatTimestamp(timestamp)}
                    </div>
                  )}
                </div>
              </div>
            )}

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
                📝 Crear Nuevo Reporte
              </Link>

              <Link 
                to="/admin"
                className="btn btn-secondary"
                style={{ textDecoration: 'none' }}
              >
                📊 Ver Panel Admin
              </Link>
            </div>

            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              backgroundColor: '#fffbeb',
              border: '1px solid #fed7aa',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: 'var(--warning-yellow)'
            }}>
              ℹ️ <strong>Informacion:</strong> Su reporte ha sido almacenado en el sistema y esta disponible para consulta en el panel de administracion.
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-30px);
          }
          60% {
            transform: translateY(-15px);
          }
        }
      `}</style>
    </div>
  )
}

export default Success