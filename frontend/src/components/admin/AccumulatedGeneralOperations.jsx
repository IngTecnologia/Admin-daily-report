import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../services/constants'

const AccumulatedGeneralOperations = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Calcular fechas por defecto (última semana: lunes a hoy)
  const getDefaultDates = () => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = domingo, 1 = lunes, etc.
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const monday = new Date(today)
    monday.setDate(today.getDate() - daysToMonday)
    
    return {
      inicio: monday.toISOString().split('T')[0],
      fin: today.toISOString().split('T')[0]
    }
  }
  
  const defaultDates = getDefaultDates()
  const [fechaInicio, setFechaInicio] = useState(defaultDates.inicio)
  const [fechaFin, setFechaFin] = useState(defaultDates.fin)

  useEffect(() => {
    fetchAccumulatedGeneralData()
  }, [fechaInicio, fechaFin])

  const fetchAccumulatedGeneralData = async () => {
    try {
      setLoading(true)
      const url = `${API_BASE_URL}/admin/accumulated-general-operations?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Error al cargar datos de operación general acumulada')
      }
      
      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching accumulated general operations data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLastWeekFilter = () => {
    const newDates = getDefaultDates()
    setFechaInicio(newDates.inicio)
    setFechaFin(newDates.fin)
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr)
    return date.toLocaleString('es-ES')
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <div className="loader">Cargando vista general acumulada...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        color: 'var(--error-red)',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        margin: '1rem'
      }}>
        <h3>Error al cargar datos</h3>
        <p>{error}</p>
        <button 
          onClick={fetchAccumulatedGeneralData}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--primary-red)',
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

  if (!data) {
    return <div>No hay datos disponibles</div>
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header con filtros de fecha */}
      <div style={{ 
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-red)' }}>
            Vista 3: Operación General Acumulado
          </h2>
          <p style={{ margin: '0', color: 'var(--neutral-gray)', fontSize: '0.9rem' }}>
            {data.periodo_descripcion}
          </p>
        </div>
        
        {/* Filtros de fecha */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleLastWeekFilter}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--accent-orange)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            📅 Última Semana
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="fecha-inicio" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
              Desde:
            </label>
            <input
              id="fecha-inicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="fecha-fin" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
              Hasta:
            </label>
            <input
              id="fecha-fin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
            />
          </div>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: 'var(--primary-red)', 
          color: 'white', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>
            {data.promedio_horas_diarias}
          </h3>
          <p style={{ margin: '0', fontSize: '0.9rem' }}>
            Promedio Horas Diarias
          </p>
          <small style={{ fontSize: '0.8rem', opacity: '0.9' }}>
            Entre {data.total_reportes} reportes del período
          </small>
        </div>

        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: 'var(--success-green)', 
          color: 'white', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>
            {data.total_personal_staff}
          </h3>
          <p style={{ margin: '0', fontSize: '0.9rem' }}>
            Total Personal Staff
          </p>
          <small style={{ fontSize: '0.8rem', opacity: '0.9' }}>
            Suma de todas las operaciones
          </small>
        </div>

        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: 'var(--accent-orange)', 
          color: 'white', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>
            {data.total_personal_base}
          </h3>
          <p style={{ margin: '0', fontSize: '0.9rem' }}>
            Total Personal Base
          </p>
          <small style={{ fontSize: '0.8rem', opacity: '0.9' }}>
            Suma de todas las operaciones
          </small>
        </div>

        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: 'var(--secondary-red)', 
          color: 'white', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>
            {data.total_reportes}
          </h3>
          <p style={{ margin: '0', fontSize: '0.9rem' }}>
            Total Reportes
          </p>
          <small style={{ fontSize: '0.8rem', opacity: '0.9' }}>
            Operaciones que reportaron
          </small>
        </div>
      </div>

      {/* Operaciones que reportaron */}
      {data.operaciones_reportadas.length > 0 && (
        <div style={{ 
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: 'var(--light-gray)',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--dark-text)' }}>
            Operaciones que Reportaron ({data.operaciones_reportadas.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {data.operaciones_reportadas.map((operacion, index) => (
              <span 
                key={index}
                style={{ 
                  padding: '0.25rem 0.75rem',
                  backgroundColor: 'var(--primary-red)',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '0.8rem'
                }}
              >
                {operacion}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sección de Incidencias */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ 
          margin: '0 0 1rem 0', 
          color: 'var(--dark-text)', 
          borderBottom: '2px solid var(--warning-yellow)',
          paddingBottom: '0.5rem'
        }}>
          Incidencias del Período ({data.total_incidencias})
        </h3>
        
        {data.incidencias.length === 0 ? (
          <p style={{ color: 'var(--neutral-gray)', fontStyle: 'italic' }}>
            No se registraron incidencias en este período
          </p>
        ) : (
          <div style={{ 
            display: 'grid', 
            gap: '1rem'
          }}>
            {data.incidencias.map((incidencia, index) => (
              <div 
                key={index}
                style={{ 
                  padding: '1rem',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fed7aa',
                  borderRadius: '6px',
                  borderLeft: '4px solid var(--warning-yellow)'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <strong>Tipo:</strong> {incidencia.tipo || 'No especificado'}
                  </div>
                  <div>
                    <strong>Empleado:</strong> {incidencia.nombre_empleado || 'No especificado'}
                  </div>
                  <div>
                    <strong>Fecha Fin:</strong> {incidencia.fecha_fin || 'No especificada'}
                  </div>
                  <div>
                    <strong>Origen:</strong> {incidencia.administrador} - {incidencia.cliente_operacion}
                  </div>
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--neutral-gray)' }}>
                  Registrado: {formatDateTime(incidencia.fecha_registro)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección de Movimientos */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ 
          margin: '0 0 1rem 0', 
          color: 'var(--dark-text)', 
          borderBottom: '2px solid var(--success-green)',
          paddingBottom: '0.5rem'
        }}>
          Movimientos de Personal ({data.total_movimientos})
        </h3>
        
        {data.movimientos.length === 0 ? (
          <p style={{ color: 'var(--neutral-gray)', fontStyle: 'italic' }}>
            No se registraron movimientos de personal en este período
          </p>
        ) : (
          <div style={{ 
            display: 'grid', 
            gap: '1rem'
          }}>
            {data.movimientos.map((movimiento, index) => (
              <div 
                key={index}
                style={{ 
                  padding: '1rem',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '6px',
                  borderLeft: '4px solid var(--success-green)'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <strong>Empleado:</strong> {movimiento.nombre_empleado || 'No especificado'}
                  </div>
                  <div>
                    <strong>Cargo:</strong> {movimiento.cargo || 'No especificado'}
                  </div>
                  <div>
                    <strong>Estado:</strong> {movimiento.estado || 'No especificado'}
                  </div>
                  <div>
                    <strong>Origen:</strong> {movimiento.administrador} - {movimiento.cliente_operacion}
                  </div>
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--neutral-gray)' }}>
                  Registrado: {formatDateTime(movimiento.fecha_registro)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección de Hechos Relevantes */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ 
          margin: '0 0 1rem 0', 
          color: 'var(--dark-text)', 
          borderBottom: '2px solid var(--accent-orange)',
          paddingBottom: '0.5rem'
        }}>
          Hechos Relevantes ({data.hechos_relevantes.length})
        </h3>
        
        {data.hechos_relevantes.length === 0 ? (
          <p style={{ color: 'var(--neutral-gray)', fontStyle: 'italic' }}>
            No se registraron hechos relevantes en este período
          </p>
        ) : (
          <div style={{ 
            display: 'grid', 
            gap: '1rem'
          }}>
            {data.hechos_relevantes.map((hecho, index) => (
              <div 
                key={index}
                style={{ 
                  padding: '1rem',
                  backgroundColor: '#fff3e0',
                  border: '1px solid #fed7aa',
                  borderRadius: '6px',
                  borderLeft: '4px solid var(--accent-orange)'
                }}
              >
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Hecho:</strong>
                  <p style={{ margin: '0.5rem 0 0 0', color: 'var(--dark-text)' }}>
                    {hecho.hecho}
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>Origen:</strong> {hecho.administrador} - {hecho.cliente_operacion}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--neutral-gray)' }}>
                    {formatDateTime(hecho.fecha_registro)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AccumulatedGeneralOperations