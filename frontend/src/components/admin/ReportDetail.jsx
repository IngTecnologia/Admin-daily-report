import React from 'react'

const ReportDetail = ({ report, onClose }) => {
  if (!report) {
    return null
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    })
  }

  const formatDateOnly = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      timeZone: 'America/Bogota'
    })
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '1000px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '2rem 2rem 1rem 2rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: 'var(--primary-red)',
              marginBottom: '0.5rem'
            }}>
              📋 Detalle del Reporte
            </h2>
            <p style={{
              color: 'var(--neutral-gray)',
              fontSize: '0.875rem'
            }}>
              ID: {report.ID} • Creado: {formatDate(report.Fecha_Creacion)}
            </p>
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--neutral-gray)',
              padding: '0.5rem',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '2rem' }}>
          {/* Información del administrador */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--dark-text)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              👤 Información del Administrador
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              backgroundColor: '#f9fafb',
              padding: '1.5rem',
              borderRadius: '8px'
            }}>
              <DetailField label="Administrador" value={report.Administrador} />
              <DetailField label="Cliente/Operación" value={report.Cliente_Operacion} />
              <DetailField label="Estado" value={report.Estado || 'Completado'} />
            </div>
          </div>

          {/* Información de personal */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--dark-text)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              👥 Información de Personal
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              backgroundColor: '#f0fdf4',
              padding: '1.5rem',
              borderRadius: '8px'
            }}>
              <DetailField label="Horas Diarias" value={`${report.Horas_Diarias} horas`} />
              <DetailField label="Personal Staff" value={report.Personal_Staff || 0} />
              <DetailField label="Personal Base" value={report.Personal_Base || 0} />
              <DetailField 
                label="Total Personal" 
                value={(report.Personal_Staff || 0) + (report.Personal_Base || 0)} 
              />
            </div>
          </div>

          {/* Incidencias */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--dark-text)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📋 Incidencias ({report.Cantidad_Incidencias || 0})
            </h3>
            
            {report.incidencias && report.incidencias.length > 0 ? (
              <div style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fed7aa',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                {report.incidencias.map((incidencia, index) => (
                  <div 
                    key={index}
                    style={{
                      padding: '1rem',
                      borderBottom: index < report.incidencias.length - 1 ? '1px solid #fed7aa' : 'none'
                    }}
                  >
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem',
                      fontSize: '0.875rem'
                    }}>
                      <DetailField label="Tipo" value={incidencia.tipo} />
                      <DetailField label="Empleado" value={incidencia.nombre_empleado} />
                      <DetailField label="Fecha Fin" value={formatDateOnly(incidencia.fecha_fin)} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                padding: '1.5rem',
                textAlign: 'center',
                color: 'var(--success-green)'
              }}>
                ✅ No hay incidencias reportadas
              </div>
            )}
          </div>

          {/* Movimientos de personal */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--dark-text)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🔄 Movimientos de Personal ({report.Cantidad_Ingresos_Retiros || 0})
            </h3>
            
            {report.ingresos_retiros && report.ingresos_retiros.length > 0 ? (
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                {report.ingresos_retiros.map((movimiento, index) => (
                  <div 
                    key={index}
                    style={{
                      padding: '1rem',
                      borderBottom: index < report.ingresos_retiros.length - 1 ? '1px solid #bae6fd' : 'none'
                    }}
                  >
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem',
                      fontSize: '0.875rem'
                    }}>
                      <DetailField label="Empleado" value={movimiento.nombre_empleado} />
                      <DetailField label="Cargo" value={movimiento.cargo} />
                      <DetailField 
                        label="Estado" 
                        value={movimiento.estado}
                        valueStyle={{
                          color: movimiento.estado === 'Ingreso' ? 'var(--success-green)' : 'var(--error-red)',
                          fontWeight: '500'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                padding: '1.5rem',
                textAlign: 'center',
                color: 'var(--success-green)'
              }}>
                ✅ No hay movimientos de personal reportados
              </div>
            )}
          </div>

          {/* Hechos relevantes */}
          {report.Hechos_Relevantes && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'var(--dark-text)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📝 Hechos Relevantes
              </h3>
              
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1.5rem'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  lineHeight: '1.6',
                  color: 'var(--dark-text)',
                  margin: 0
                }}>
                  {report.Hechos_Relevantes}
                </p>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const DetailField = ({ label, value, valueStyle = {} }) => {
  return (
    <div>
      <div style={{
        fontSize: '0.75rem',
        fontWeight: '500',
        color: 'var(--neutral-gray)',
        marginBottom: '0.25rem'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '0.875rem',
        fontWeight: '500',
        color: 'var(--dark-text)',
        ...valueStyle
      }}>
        {value || 'No especificado'}
      </div>
    </div>
  )
}

export default ReportDetail