import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../services/constants'
import { adaptReportsListData } from '../../services/dataAdapter'

const ReportsList = ({ onViewReport }) => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    administrador: '',
    cliente: '',
    fechaInicio: '',
    fechaFin: '',
    page: 1,
    limit: 20
  })
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchReports()
  }, [filters])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })

      const response = await fetch(`${API_BASE_URL}/admin/reportes?${queryParams}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar los reportes')
      }
      
      const data = await response.json()
      const adaptedData = adaptReportsListData(data.reports || data)
      setReports(adaptedData)
      setTotalPages(data.totalPages || 1)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching reports:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to first page when filtering
    }))
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const clearFilters = () => {
    setFilters({
      administrador: '',
      cliente: '',
      fechaInicio: '',
      fechaFin: '',
      page: 1,
      limit: 20
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    })
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ 
        fontSize: '1.75rem', 
        fontWeight: '700', 
        color: 'var(--primary-red)',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        📋 Lista de Reportes
      </h2>

      {/* Filtros */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: 'var(--dark-text)',
          marginBottom: '1rem'
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
            <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
              Administrador
            </label>
            <input
              type="text"
              value={filters.administrador}
              onChange={(e) => handleFilterChange('administrador', e.target.value)}
              placeholder="Nombre del administrador..."
              className="form-input"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
              Cliente/Operación
            </label>
            <input
              type="text"
              value={filters.cliente}
              onChange={(e) => handleFilterChange('cliente', e.target.value)}
              placeholder="Cliente o operación..."
              className="form-input"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
              Fecha Inicio
            </label>
            <input
              type="date"
              value={filters.fechaInicio}
              onChange={(e) => handleFilterChange('fechaInicio', e.target.value)}
              className="form-input"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
              Fecha Fin
            </label>
            <input
              type="date"
              value={filters.fechaFin}
              onChange={(e) => handleFilterChange('fechaFin', e.target.value)}
              className="form-input"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={clearFilters}
            className="btn btn-secondary"
          >
            🗑️ Limpiar Filtros
          </button>
          
          <button
            onClick={fetchReports}
            className="btn btn-primary"
          >
            🔍 Buscar
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '2rem' }}>
          ⚠️ {error}
          <button 
            onClick={fetchReports}
            style={{
              marginLeft: '1rem',
              padding: '0.25rem 0.5rem',
              background: 'transparent',
              border: '1px solid currentColor',
              borderRadius: '4px',
              color: 'inherit',
              cursor: 'pointer'
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Lista de reportes */}
      {reports.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            No se encontraron reportes
          </h3>
          <p style={{ color: 'var(--neutral-gray)' }}>
            Intente ajustar los filtros o crear un nuevo reporte
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {/* Encabezado de tabla */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
            gap: '1rem',
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--dark-text)'
          }}>
            <div>Fecha</div>
            <div>Administrador</div>
            <div>Cliente/Operación</div>
            <div>Resumen</div>
            <div>Acciones</div>
          </div>

          {/* Filas de datos */}
          {reports.map((report, index) => (
            <ReportRow 
              key={report.id || index}
              report={report}
              onViewReport={onViewReport}
            />
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={{
          marginTop: '2rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <button
            onClick={() => handlePageChange(filters.page - 1)}
            disabled={filters.page <= 1}
            className="btn btn-secondary"
            style={{ opacity: filters.page <= 1 ? 0.5 : 1 }}
          >
            ← Anterior
          </button>
          
          <span style={{ 
            padding: '0.75rem 1rem',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '0.875rem'
          }}>
            Página {filters.page} de {totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(filters.page + 1)}
            disabled={filters.page >= totalPages}
            className="btn btn-secondary"
            style={{ opacity: filters.page >= totalPages ? 0.5 : 1 }}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}

const ReportRow = ({ report, onViewReport }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
      gap: '1rem',
      padding: '1rem',
      borderBottom: '1px solid #e5e7eb',
      fontSize: '0.875rem',
      transition: 'background-color 0.2s'
    }}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
      
      <div>
        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
          {new Date(report.fecha_creacion || Date.now()).toLocaleDateString('es-ES', { timeZone: 'America/Bogota' })}
        </div>
        <div style={{ color: 'var(--neutral-gray)', fontSize: '0.75rem' }}>
          {new Date(report.fecha_creacion || Date.now()).toLocaleTimeString('es-ES', { timeZone: 'America/Bogota' })}
        </div>
      </div>
      
      <div style={{ fontWeight: '500' }}>
        {report.administrador}
      </div>
      
      <div>
        {report.cliente_operacion}
      </div>
      
      <div>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
          <span>⏰ {report.horas_diarias}h</span>
          <span>👥 {(report.personal_staff || 0) + (report.personal_base || 0)}</span>
          <span>⚠️ {report.cantidad_incidencias || 0}</span>
          <span>🔄 {report.cantidad_ingresos_retiros || 0}</span>
        </div>
      </div>
      
      <div>
        <button
          onClick={() => onViewReport(report)}
          className="btn btn-primary"
          style={{ 
            padding: '0.5rem 1rem',
            fontSize: '0.875rem'
          }}
        >
          👁️ Ver
        </button>
      </div>
    </div>
  )
}

export default ReportsList