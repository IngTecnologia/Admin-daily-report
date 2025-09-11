import React, { useState, useEffect } from 'react'
import { API_BASE_URL, INCIDENT_TYPES, EMPLOYEE_STATUSES } from '../../services/constants'

const ReportDetail = ({ report, onClose, allowEdit = false, onReportUpdated }) => {
  const [detailedReport, setDetailedReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (report && (report.ID || report.id)) {
      fetchReportDetails(report.ID || report.id)
    }
  }, [report])

  const fetchReportDetails = async (reportId) => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/admin/reportes/${reportId}`)
      if (response.ok) {
        const data = await response.json()
        setDetailedReport(data)
        setEditData(data) // Inicializar datos de edición
        setError(null)
      } else {
        throw new Error('Error cargando detalles del reporte')
      }
    } catch (err) {
      console.error('Error fetching report details:', err)
      setError(err.message)
      setDetailedReport(report) // Fallback al reporte básico
      setEditData(report)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditData(detailedReport) // Restaurar datos originales
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch(`${API_BASE_URL}/admin/reportes/${detailedReport.ID || detailedReport.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          horas_diarias: parseFloat(editData.Horas_Diarias || editData.horas_diarias),
          personal_staff: parseInt(editData.Personal_Staff || editData.personal_staff),
          personal_base: parseInt(editData.Personal_Base || editData.personal_base),
          hechos_relevantes: editData.Hechos_Relevantes || editData.hechos_relevantes || '',
          incidencias: editData.incidencias || [],
          ingresos_retiros: editData.ingresos_retiros || []
        })
      })

      if (response.ok) {
        const updatedReport = await response.json()
        setDetailedReport(updatedReport)
        setEditData(updatedReport)
        setIsEditing(false)
        if (onReportUpdated) {
          onReportUpdated()
        }
        alert('Reporte actualizado exitosamente')
      } else {
        throw new Error('Error guardando los cambios')
      }
    } catch (err) {
      console.error('Error saving report:', err)
      alert(`Error guardando los cambios: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleFieldChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!report) {
    return null
  }

  if (loading) {
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
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <div>Cargando detalles del reporte...</div>
        </div>
      </div>
    )
  }

  const reportToShow = detailedReport || report

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
              ID: {reportToShow.ID || reportToShow.id} • Creado: {formatDate(reportToShow.Fecha_Creacion || reportToShow.fecha_creacion)}
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
              <DetailField label="Administrador" value={reportToShow.Administrador || reportToShow.administrador} />
              <DetailField label="Cliente/Operación" value={reportToShow.Cliente_Operacion || reportToShow.cliente_operacion} />
              <DetailField label="Estado" value={reportToShow.Estado || reportToShow.estado || 'Completado'} />
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
              {isEditing ? (
                <>
                  <EditableField 
                    label="Horas Diarias" 
                    value={editData.Horas_Diarias || editData.horas_diarias}
                    type="number"
                    step="0.5"
                    min="1"
                    max="24"
                    onChange={(value) => handleFieldChange('Horas_Diarias', value)}
                    suffix=" horas"
                  />
                  <EditableField 
                    label="Personal Staff" 
                    value={editData.Personal_Staff || editData.personal_staff || 0}
                    type="number"
                    min="0"
                    onChange={(value) => handleFieldChange('Personal_Staff', value)}
                  />
                  <EditableField 
                    label="Personal Base" 
                    value={editData.Personal_Base || editData.personal_base || 0}
                    type="number"
                    min="0"
                    onChange={(value) => handleFieldChange('Personal_Base', value)}
                  />
                  <DetailField 
                    label="Total Personal" 
                    value={(parseInt(editData.Personal_Staff || editData.personal_staff || 0)) + (parseInt(editData.Personal_Base || editData.personal_base || 0))} 
                  />
                </>
              ) : (
                <>
                  <DetailField label="Horas Diarias" value={`${reportToShow.Horas_Diarias || reportToShow.horas_diarias} horas`} />
                  <DetailField label="Personal Staff" value={reportToShow.Personal_Staff || reportToShow.personal_staff || 0} />
                  <DetailField label="Personal Base" value={reportToShow.Personal_Base || reportToShow.personal_base || 0} />
                  <DetailField 
                    label="Total Personal" 
                    value={(reportToShow.Personal_Staff || reportToShow.personal_staff || 0) + (reportToShow.Personal_Base || reportToShow.personal_base || 0)} 
                  />
                </>
              )}
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
              📋 Incidencias ({reportToShow.Cantidad_Incidencias || reportToShow.cantidad_incidencias || 0})
            </h3>
            
            {reportToShow.incidencias && reportToShow.incidencias.length > 0 ? (
              <div style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fed7aa',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                {reportToShow.incidencias.map((incidencia, index) => (
                  <div 
                    key={index}
                    style={{
                      padding: '1rem',
                      borderBottom: index < reportToShow.incidencias.length - 1 ? '1px solid #fed7aa' : 'none'
                    }}
                  >
                    {isEditing ? (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '1rem',
                        fontSize: '0.875rem'
                      }}>
                        <div>
                          <label style={{ fontWeight: '500', color: 'var(--dark-text)', display: 'block', marginBottom: '0.25rem' }}>
                            Tipo de Incidencia
                          </label>
                          <select
                            value={(editData.incidencias && editData.incidencias[index] && editData.incidencias[index].tipo) || incidencia.tipo || ''}
                            onChange={(e) => {
                              const newIncidencias = [...(editData.incidencias || reportToShow.incidencias)]
                              if (!newIncidencias[index]) newIncidencias[index] = {}
                              newIncidencias[index] = { ...newIncidencias[index], tipo: e.target.value }
                              setEditData(prev => ({ ...prev, incidencias: newIncidencias }))
                            }}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '0.875rem'
                            }}
                          >
                            <option value="">Seleccionar tipo</option>
                            {INCIDENT_TYPES.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label style={{ fontWeight: '500', color: 'var(--dark-text)', display: 'block', marginBottom: '0.25rem' }}>
                            Nombre del Empleado
                          </label>
                          <input
                            type="text"
                            value={(editData.incidencias && editData.incidencias[index] && editData.incidencias[index].nombre_empleado) || incidencia.nombre_empleado || ''}
                            onChange={(e) => {
                              const newIncidencias = [...(editData.incidencias || reportToShow.incidencias)]
                              if (!newIncidencias[index]) newIncidencias[index] = {}
                              newIncidencias[index] = { ...newIncidencias[index], nombre_empleado: e.target.value }
                              setEditData(prev => ({ ...prev, incidencias: newIncidencias }))
                            }}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '0.875rem'
                            }}
                            placeholder="Nombre completo"
                          />
                        </div>
                        
                        <div>
                          <label style={{ fontWeight: '500', color: 'var(--dark-text)', display: 'block', marginBottom: '0.25rem' }}>
                            Fecha Fin
                          </label>
                          <input
                            type="date"
                            value={(editData.incidencias && editData.incidencias[index] && editData.incidencias[index].fecha_fin) || incidencia.fecha_fin || ''}
                            onChange={(e) => {
                              const newIncidencias = [...(editData.incidencias || reportToShow.incidencias)]
                              if (!newIncidencias[index]) newIncidencias[index] = {}
                              newIncidencias[index] = { ...newIncidencias[index], fecha_fin: e.target.value }
                              setEditData(prev => ({ ...prev, incidencias: newIncidencias }))
                            }}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '0.875rem'
                            }}
                          />
                        </div>
                      </div>
                    ) : (
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
                    )}
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
              🔄 Movimientos de Personal ({reportToShow.Cantidad_Ingresos_Retiros || reportToShow.cantidad_ingresos_retiros || 0})
            </h3>
            
            {reportToShow.ingresos_retiros && reportToShow.ingresos_retiros.length > 0 ? (
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                {reportToShow.ingresos_retiros.map((movimiento, index) => (
                  <div 
                    key={index}
                    style={{
                      padding: '1rem',
                      borderBottom: index < reportToShow.ingresos_retiros.length - 1 ? '1px solid #bae6fd' : 'none'
                    }}
                  >
                    {isEditing ? (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '1rem',
                        fontSize: '0.875rem'
                      }}>
                        <div>
                          <label style={{ fontWeight: '500', color: 'var(--dark-text)', display: 'block', marginBottom: '0.25rem' }}>
                            Nombre del Empleado
                          </label>
                          <input
                            type="text"
                            value={(editData.ingresos_retiros && editData.ingresos_retiros[index] && editData.ingresos_retiros[index].nombre_empleado) || movimiento.nombre_empleado || ''}
                            onChange={(e) => {
                              const newMovimientos = [...(editData.ingresos_retiros || reportToShow.ingresos_retiros)]
                              if (!newMovimientos[index]) newMovimientos[index] = {}
                              newMovimientos[index] = { ...newMovimientos[index], nombre_empleado: e.target.value }
                              setEditData(prev => ({ ...prev, ingresos_retiros: newMovimientos }))
                            }}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '0.875rem'
                            }}
                            placeholder="Nombre completo"
                          />
                        </div>
                        
                        <div>
                          <label style={{ fontWeight: '500', color: 'var(--dark-text)', display: 'block', marginBottom: '0.25rem' }}>
                            Cargo
                          </label>
                          <input
                            type="text"
                            value={(editData.ingresos_retiros && editData.ingresos_retiros[index] && editData.ingresos_retiros[index].cargo) || movimiento.cargo || ''}
                            onChange={(e) => {
                              const newMovimientos = [...(editData.ingresos_retiros || reportToShow.ingresos_retiros)]
                              if (!newMovimientos[index]) newMovimientos[index] = {}
                              newMovimientos[index] = { ...newMovimientos[index], cargo: e.target.value }
                              setEditData(prev => ({ ...prev, ingresos_retiros: newMovimientos }))
                            }}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '0.875rem'
                            }}
                            placeholder="Cargo del empleado"
                          />
                        </div>
                        
                        <div>
                          <label style={{ fontWeight: '500', color: 'var(--dark-text)', display: 'block', marginBottom: '0.25rem' }}>
                            Estado
                          </label>
                          <select
                            value={(editData.ingresos_retiros && editData.ingresos_retiros[index] && editData.ingresos_retiros[index].estado) || movimiento.estado || ''}
                            onChange={(e) => {
                              const newMovimientos = [...(editData.ingresos_retiros || reportToShow.ingresos_retiros)]
                              if (!newMovimientos[index]) newMovimientos[index] = {}
                              newMovimientos[index] = { ...newMovimientos[index], estado: e.target.value }
                              setEditData(prev => ({ ...prev, ingresos_retiros: newMovimientos }))
                            }}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '0.875rem'
                            }}
                          >
                            <option value="">Seleccionar estado</option>
                            {EMPLOYEE_STATUSES.map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
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
                    )}
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
          {(reportToShow.Hechos_Relevantes || reportToShow.hechos_relevantes || isEditing) && (
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
              
              {isEditing ? (
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  <textarea
                    value={editData.Hechos_Relevantes || editData.hechos_relevantes || ''}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      Hechos_Relevantes: e.target.value,
                      hechos_relevantes: e.target.value
                    }))}
                    placeholder="Ingrese los hechos relevantes..."
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      lineHeight: '1.5',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--primary-red)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db'
                    }}
                  />
                </div>
              ) : (
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
                    {reportToShow.Hechos_Relevantes || reportToShow.hechos_relevantes || 'No hay hechos relevantes registrados'}
                  </p>
                </div>
              )}
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
            {allowEdit && !isEditing && (
              <button
                onClick={handleEdit}
                className="btn btn-primary"
              >
                ✏️ Editar Reporte
              </button>
            )}
            
            {isEditing && (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? '⏳ Guardando...' : '💾 Guardar Cambios'}
                </button>
              </>
            )}
            
            <button
              onClick={onClose}
              className="btn btn-secondary"
              disabled={saving}
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

const EditableField = ({ label, value, onChange, type = "text", suffix = "", ...inputProps }) => {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--dark-text)',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            padding: '0.5rem',
            flex: 1,
            maxWidth: '120px'
          }}
          {...inputProps}
        />
        {suffix && (
          <span style={{
            fontSize: '0.875rem',
            color: 'var(--neutral-gray)'
          }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

export default ReportDetail