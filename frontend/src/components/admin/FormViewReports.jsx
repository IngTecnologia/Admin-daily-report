import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../services/constants'

const FormViewReports = ({ onViewReport }) => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    administrador: '',
    fecha_inicio: '',
    fecha_fin: '',
    cliente: '',
    page: 1,
    limit: 50
  })

  const fetchReports = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== '') {
          queryParams.append(key, filters[key])
        }
      })

      const response = await fetch(`${API_BASE_URL}/admin/reportes?${queryParams}`)
      if (response.ok) {
        const data = await response.json()
        setReports(Array.isArray(data) ? data : (data.data || []))
        setError(null)
      } else {
        throw new Error('Error cargando reportes')
      }
    } catch (err) {
      console.error('Error fetching reports:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [filters])

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }))
  }

  const getTodayReports = () => {
    const today = new Date().toISOString().split('T')[0]
    return reports.filter(report => {
      const reportDate = new Date(report.Fecha_Creacion).toISOString().split('T')[0]
      return reportDate === today
    })
  }

  const groupReportsByAdmin = (reportsList) => {
    const grouped = {}
    reportsList.forEach(report => {
      const admin = report.Administrador
      if (!grouped[admin]) {
        grouped[admin] = []
      }
      grouped[admin].push(report)
    })
    return grouped
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <div>Cargando reportes...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '1rem',
        color: 'var(--error-red)'
      }}>
        ❌ {error}
        <button 
          onClick={fetchReports}
          style={{
            marginLeft: '1rem',
            padding: '0.5rem 1rem',
            background: 'var(--error-red)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  const filteredReports = reports
  const groupedReports = groupReportsByAdmin(filteredReports)

  return (
    <div>
      {/* Filtros */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ 
          marginBottom: '1rem', 
          color: 'var(--primary-red)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🔍 Filtros de Búsqueda
        </h3>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              fontSize: '0.875rem'
            }}>
              Administrador
            </label>
            <select
              value={filters.administrador}
              onChange={(e) => updateFilter('administrador', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            >
              <option value="">Todos los administradores</option>
              {[...new Set(reports.map(r => r.Administrador))].map(admin => (
                <option key={admin} value={admin}>{admin}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              fontSize: '0.875rem'
            }}>
              Cliente/Operación
            </label>
            <select
              value={filters.cliente}
              onChange={(e) => updateFilter('cliente', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            >
              <option value="">Todas las operaciones</option>
              {[...new Set(reports.map(r => r.Cliente_Operacion))].map(cliente => (
                <option key={cliente} value={cliente}>{cliente}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              fontSize: '0.875rem'
            }}>
              Fecha desde
            </label>
            <input
              type="date"
              value={filters.fecha_inicio}
              onChange={(e) => updateFilter('fecha_inicio', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              fontSize: '0.875rem'
            }}>
              Fecha hasta
            </label>
            <input
              type="date"
              value={filters.fecha_fin}
              onChange={(e) => updateFilter('fecha_fin', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => updateFilter('fecha_inicio', new Date().toISOString().split('T')[0])}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--primary-red)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            📅 Solo hoy
          </button>
          <button
            onClick={() => setFilters({ ...filters, fecha_inicio: '', fecha_fin: '', administrador: '', cliente: '' })}
            style={{
              padding: '0.5rem 1rem',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            🗑️ Limpiar filtros
          </button>
          <span style={{ 
            marginLeft: 'auto', 
            fontSize: '0.875rem', 
            color: 'var(--neutral-gray)' 
          }}>
            {reports.length} reportes encontrados
          </span>
        </div>
      </div>

      {/* Vista tipo formulario con datos del día */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        border: '1px solid #e5e7eb',
        marginBottom: '2rem'
      }}>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          color: 'var(--primary-red)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          📋 Reportes - Vista Formulario
        </h2>

        {Object.keys(groupedReports).length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            color: 'var(--neutral-gray)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <h3>No hay reportes para mostrar</h3>
            <p>No se encontraron reportes con los filtros seleccionados</p>
          </div>
        ) : (
          Object.entries(groupedReports).map(([admin, adminReports]) => (
            <AdminReportSection
              key={admin}
              admin={admin}
              reports={adminReports}
              onViewReport={onViewReport}
            />
          ))
        )}
      </div>
    </div>
  )
}

const AdminReportSection = ({ admin, reports, onViewReport }) => {
  const [expanded, setExpanded] = useState(true)

  // Calcular totales del administrador
  const totalHoras = reports.reduce((sum, r) => sum + (r.Horas_Diarias || 0), 0)
  const totalPersonalStaff = reports.reduce((sum, r) => sum + (r.Personal_Staff || 0), 0)
  const totalPersonalBase = reports.reduce((sum, r) => sum + (r.Personal_Base || 0), 0)
  const totalIncidencias = reports.reduce((sum, r) => sum + (r.Cantidad_Incidencias || 0), 0)
  const totalMovimientos = reports.reduce((sum, r) => sum + (r.Cantidad_Ingresos_Retiros || 0), 0)

  // Obtener cliente/operación (suponiendo que es consistente para cada admin)
  const clienteOperacion = reports[0]?.Cliente_Operacion || 'N/A'

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      marginBottom: '1.5rem',
      overflow: 'hidden'
    }}>
      {/* Header del administrador */}
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{
          backgroundColor: 'var(--primary-red)',
          color: 'white',
          padding: '1rem 1.5rem',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none'
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
            👤 {admin}
          </h3>
          <p style={{ margin: '0.25rem 0 0 0', opacity: 0.9, fontSize: '0.875rem' }}>
            {clienteOperacion} • {reports.length} reporte(s)
          </p>
        </div>
        <div style={{ 
          fontSize: '1.25rem',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }}>
          ▼
        </div>
      </div>

      {expanded && (
        <div style={{ backgroundColor: 'white' }}>
          {/* Sección de información de personal */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #f3f4f6'
          }}>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--dark-text)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              👥 Información de Personal (Totales)
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem'
            }}>
              <InfoCard label="Horas Diarias" value={`${totalHoras}h`} icon="🕐" />
              <InfoCard label="Personal Staff" value={totalPersonalStaff} icon="👔" />
              <InfoCard label="Personal Base" value={totalPersonalBase} icon="👷" />
              <InfoCard label="Total Personal" value={totalPersonalStaff + totalPersonalBase} icon="👥" />
            </div>
          </div>

          {/* Sección de incidencias */}
          {totalIncidencias > 0 && (
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #f3f4f6',
              backgroundColor: '#fffbeb'
            }}>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: 'var(--dark-text)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📋 Incidencias ({totalIncidencias})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {reports.map(report => (
                  report.incidencias && report.incidencias.map((incidencia, idx) => (
                    <IncidenciaItem 
                      key={`${report.ID}-${idx}`} 
                      incidencia={incidencia} 
                      reportId={report.ID} 
                      reportDate={report.Fecha_Creacion}
                    />
                  ))
                ))}
              </div>
            </div>
          )}

          {/* Sección de movimientos */}
          {totalMovimientos > 0 && (
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #f3f4f6',
              backgroundColor: '#f0f9ff'
            }}>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: 'var(--dark-text)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🔄 Movimientos de Personal ({totalMovimientos})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {reports.map(report => (
                  report.ingresos_retiros && report.ingresos_retiros.map((movimiento, idx) => (
                    <MovimientoItem 
                      key={`${report.ID}-${idx}`} 
                      movimiento={movimiento} 
                      reportId={report.ID} 
                      reportDate={report.Fecha_Creacion}
                    />
                  ))
                ))}
              </div>
            </div>
          )}

          {/* Lista de reportes individuales */}
          <div style={{ padding: '1.5rem' }}>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--dark-text)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📄 Reportes Individuales ({reports.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {reports.map(report => (
                <ReportItem key={report.ID} report={report} onViewReport={onViewReport} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const InfoCard = ({ label, value, icon }) => (
  <div style={{
    backgroundColor: '#f8f9fa',
    padding: '1rem',
    borderRadius: '6px',
    textAlign: 'center',
    border: '1px solid #e9ecef'
  }}>
    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
    <div style={{ fontSize: '0.875rem', color: 'var(--neutral-gray)', marginBottom: '0.25rem' }}>
      {label}
    </div>
    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--dark-text)' }}>
      {value}
    </div>
  </div>
)

const IncidenciaItem = ({ incidencia, reportId, reportDate }) => (
  <div style={{
    backgroundColor: 'white',
    border: '1px solid #fed7aa',
    borderRadius: '4px',
    padding: '0.75rem',
    fontSize: '0.875rem'
  }}>
    <div style={{ fontWeight: '500', color: 'var(--dark-text)' }}>
      {incidencia.tipo}
    </div>
    <div style={{ color: 'var(--neutral-gray)' }}>
      {incidencia.nombre_empleado} • Fin: {new Date(incidencia.fecha_fin).toLocaleDateString('es-CO')}
    </div>
    <div style={{ fontSize: '0.75rem', color: 'var(--neutral-gray)', marginTop: '0.25rem' }}>
      📅 Reportado: {new Date(reportDate).toLocaleDateString('es-CO')} • Reporte: {reportId}
    </div>
  </div>
)

const MovimientoItem = ({ movimiento, reportId, reportDate }) => (
  <div style={{
    backgroundColor: 'white',
    border: '1px solid #bae6fd',
    borderRadius: '4px',
    padding: '0.75rem',
    fontSize: '0.875rem'
  }}>
    <div style={{ 
      fontWeight: '500', 
      color: movimiento.estado === 'Ingreso' ? 'var(--success-green)' : 'var(--error-red)' 
    }}>
      {movimiento.estado === 'Ingreso' ? '✅' : '❌'} {movimiento.estado}
    </div>
    <div style={{ color: 'var(--neutral-gray)' }}>
      {movimiento.nombre_empleado} • {movimiento.cargo}
    </div>
    <div style={{ fontSize: '0.75rem', color: 'var(--neutral-gray)', marginTop: '0.25rem' }}>
      📅 Reportado: {new Date(reportDate).toLocaleDateString('es-CO')} • Reporte: {reportId}
    </div>
  </div>
)

const ReportItem = ({ report, onViewReport }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: '4px',
    padding: '0.75rem'
  }}>
    <div>
      <div style={{ fontWeight: '500', color: 'var(--dark-text)', fontSize: '0.875rem' }}>
        📄 {report.ID}
      </div>
      <div style={{ color: 'var(--neutral-gray)', fontSize: '0.75rem' }}>
        {new Date(report.Fecha_Creacion).toLocaleString('es-CO')}
      </div>
    </div>
    <button
      onClick={() => onViewReport(report)}
      style={{
        padding: '0.5rem 1rem',
        background: 'var(--primary-red)',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.75rem'
      }}
    >
      👁️ Ver detalle
    </button>
  </div>
)

export default FormViewReports