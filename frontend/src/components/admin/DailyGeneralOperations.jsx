import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../services/constants'

const DailyGeneralOperations = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]) // Hoy por defecto

  useEffect(() => {
    fetchDailyGeneralData()
  }, [selectedDate])

  const fetchDailyGeneralData = async () => {
    try {
      setLoading(true)
      const url = selectedDate ? 
        `${API_BASE_URL}/admin/daily-general-operations?fecha=${selectedDate}` :
        `${API_BASE_URL}/admin/daily-general-operations`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Error al cargar datos de operación general diaria')
      }
      
      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching daily general operations data:', err)
    } finally {
      setLoading(false)
    }
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
        <div className="loader">Cargando vista general diaria...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        color: '#e74c3c',
        backgroundColor: '#fdf2f2',
        border: '1px solid #f5c6cb',
        borderRadius: '8px',
        margin: '1rem'
      }}>
        <h3>Error al cargar datos</h3>
        <p>{error}</p>
        <button 
          onClick={fetchDailyGeneralData}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#3498db',
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
      {/* Header con filtro de fecha */}
      <div style={{ 
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
            Vista 1: Operación General Diaria
          </h2>
          <p style={{ margin: '0', color: '#7f8c8d', fontSize: '0.9rem' }}>
            {data.periodo_descripcion}
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="date-picker" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
            Fecha:
          </label>
          <input
            id="date-picker"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #bdc3c7',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}
          />
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
          backgroundColor: '#3498db', 
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
            Entre {data.total_reportes} operaciones
          </small>
        </div>

        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: '#27ae60', 
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
          backgroundColor: '#9b59b6', 
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
          backgroundColor: '#e67e22', 
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
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>
            Operaciones que Reportaron ({data.operaciones_reportadas.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {data.operaciones_reportadas.map((operacion, index) => (
              <span 
                key={index}
                style={{ 
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#3498db',
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
          color: '#2c3e50', 
          borderBottom: '2px solid #3498db',
          paddingBottom: '0.5rem'
        }}>
          Incidencias del Día ({data.total_incidencias})
        </h3>
        
        {data.incidencias.length === 0 ? (
          <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>
            No se registraron incidencias este día
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
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '6px',
                  borderLeft: '4px solid #f39c12'
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
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#7f8c8d' }}>
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
          color: '#2c3e50', 
          borderBottom: '2px solid #27ae60',
          paddingBottom: '0.5rem'
        }}>
          Movimientos de Personal ({data.total_movimientos})
        </h3>
        
        {data.movimientos.length === 0 ? (
          <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>
            No se registraron movimientos de personal este día
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
                  backgroundColor: '#d4edda',
                  border: '1px solid #c3e6cb',
                  borderRadius: '6px',
                  borderLeft: '4px solid #27ae60'
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
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#7f8c8d' }}>
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
          color: '#2c3e50', 
          borderBottom: '2px solid #9b59b6',
          paddingBottom: '0.5rem'
        }}>
          Hechos Relevantes ({data.hechos_relevantes.length})
        </h3>
        
        {data.hechos_relevantes.length === 0 ? (
          <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>
            No se registraron hechos relevantes este día
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
                  backgroundColor: '#e8d5ff',
                  border: '1px solid #d1aeff',
                  borderRadius: '6px',
                  borderLeft: '4px solid #9b59b6'
                }}
              >
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Hecho:</strong>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#2c3e50' }}>
                    {hecho.hecho}
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>Origen:</strong> {hecho.administrador} - {hecho.cliente_operacion}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>
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

export default DailyGeneralOperations