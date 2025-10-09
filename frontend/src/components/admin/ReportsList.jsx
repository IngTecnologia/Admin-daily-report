import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../services/constants'

const ReportsList = ({ onViewReport }) => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    administrador: '',
    cliente: '',
    fecha_inicio: '',
    fecha_fin: '',
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

      // Verificar si hay filtros aplicados
      const hasFilters = filters.administrador || filters.cliente || filters.fecha_inicio || filters.fecha_fin

      Object.entries(filters).forEach(([key, value]) => {
        // Solo agregar limit y page si hay filtros aplicados
        if (key === 'limit' || key === 'page') {
          if (hasFilters && value) {
            queryParams.append(key, value)
          }
        } else if (value) {
          queryParams.append(key, value)
        }
      })

      const response = await fetch(`${API_BASE_URL}/admin/reportes?${queryParams}`)

      if (!response.ok) {
        throw new Error('Error al cargar los reportes')
      }

      const data = await response.json()
      setReports(Array.isArray(data) ? data : (data.data || []))
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
      fecha_inicio: '',
      fecha_fin: '',
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
              onChange={(e) => handleFilterChange('administrador', e.target.value)}
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
              onChange={(e) => handleFilterChange('cliente', e.target.value)}
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
              onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
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
              onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
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
            onClick={() => handleFilterChange('fecha_inicio', new Date().toISOString().split('T')[0])}
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
            🗑 Limpiar filtros
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

      {/* Error */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '2rem' }}>
          ⚠ {error}
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
              key={report.ID || index}
              report={report}
              onViewReport={onViewReport}
            />
          ))}
        </div>
      )}

      {/* Paginación - Solo mostrar cuando hay filtros aplicados */}
      {(filters.administrador || filters.cliente || filters.fecha_inicio || filters.fecha_fin) && totalPages > 1 && (
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
          {new Date(report.Fecha_Creacion || Date.now()).toLocaleDateString('es-ES', { timeZone: 'America/Bogota' })}
        </div>
        <div style={{ color: 'var(--neutral-gray)', fontSize: '0.75rem' }}>
          {new Date(report.Fecha_Creacion || Date.now()).toLocaleTimeString('es-ES', { timeZone: 'America/Bogota' })}
        </div>
      </div>
      
      <div style={{ fontWeight: '500' }}>
        {report.Administrador}
      </div>
      
      <div>
        {report.Cliente_Operacion}
      </div>
      
      <div>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
          <span>⏰ {report.Horas_Diarias}h</span>
          <span>👥 {(report.Personal_Staff || 0) + (report.Personal_Base || 0)}</span>
          <span>⚠ {report.Cantidad_Incidencias || 0}</span>
          <span>🔄 {report.Cantidad_Ingresos_Retiros || 0}</span>
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