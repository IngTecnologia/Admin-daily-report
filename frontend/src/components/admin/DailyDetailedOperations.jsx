import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../services/constants'

const DailyDetailedOperations = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]) // Hoy por defecto

  useEffect(() => {
    fetchDailyDetailedData()
  }, [selectedDate])

  const fetchDailyDetailedData = async () => {
    try {
      setLoading(true)
      const url = selectedDate ? 
        `${API_BASE_URL}/admin/daily-detailed-operations?fecha=${selectedDate}` :
        `${API_BASE_URL}/admin/daily-detailed-operations`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Error al cargar datos de operaciones detalladas')
      }
      
      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching daily detailed operations data:', err)
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
        <div className="loader">Cargando detalle por operaciones...</div>
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
          onClick={fetchDailyDetailedData}
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
            Vista 2: Detalle Diario por Operaciones
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

      {/* Estadísticas generales */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-around',
        gap: '1rem',
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#ecf0f1',
        borderRadius: '8px',
        border: '1px solid #bdc3c7'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', color: '#2c3e50' }}>
            {data.total_operaciones}
          </h3>
          <p style={{ margin: '0', fontSize: '0.9rem', fontWeight: 'bold' }}>
            Operaciones
          </p>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', color: '#2c3e50' }}>
            {data.total_reportes}
          </h3>
          <p style={{ margin: '0', fontSize: '0.9rem', fontWeight: 'bold' }}>
            Reportes Totales
          </p>
        </div>
      </div>

      {/* Mensaje cuando no hay operaciones */}
      {data.operaciones.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          color: '#6c757d'
        }}>
          <h3>No hay operaciones para mostrar</h3>
          <p>No se registraron reportes para el día seleccionado.</p>
        </div>
      )}

      {/* Lista de operaciones */}
      {data.operaciones.map((operacion, index) => (
        <div 
          key={index}
          style={{ 
            marginBottom: '2rem',
            border: '2px solid #3498db',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          {/* Header de la operación */}
          <div style={{ 
            backgroundColor: '#3498db',
            color: 'white',
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem' }}>
                {operacion.cliente_operacion}
              </h3>
              <p style={{ margin: '0', fontSize: '0.9rem', opacity: '0.9' }}>
                Administradores: {operacion.administradores.join(', ')}
              </p>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', opacity: '0.9' }}>
                {operacion.num_reportes} reporte{operacion.num_reportes !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Contenido de la operación */}
          <div style={{ padding: '1.5rem' }}>
            {/* Estadísticas principales */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#3498db', 
                color: 'white', 
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
                  {operacion.horas_diarias}
                </h4>
                <p style={{ margin: '0', fontSize: '0.8rem' }}>
                  Horas Diarias
                </p>
                {operacion.es_promedio_horas && (
                  <small style={{ fontSize: '0.7rem', opacity: '0.8' }}>
                    (Promedio de {operacion.num_reportes} reportes)
                  </small>
                )}
              </div>

              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#27ae60', 
                color: 'white', 
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
                  {operacion.personal_staff}
                </h4>
                <p style={{ margin: '0', fontSize: '0.8rem' }}>
                  Personal Staff
                </p>
              </div>

              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#9b59b6', 
                color: 'white', 
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
                  {operacion.personal_base}
                </h4>
                <p style={{ margin: '0', fontSize: '0.8rem' }}>
                  Personal Base
                </p>
              </div>
            </div>

            {/* Contadores de elementos */}
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-around',
              gap: '1rem',
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#e67e22' }}>
                  {operacion.total_incidencias}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Incidencias</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1abc9c' }}>
                  {operacion.total_movimientos}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Movimientos</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#8e44ad' }}>
                  {operacion.total_hechos_relevantes}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Hechos Relevantes</div>
              </div>
            </div>

            {/* Incidencias */}
            {operacion.incidencias.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ 
                  margin: '0 0 1rem 0', 
                  color: '#e67e22', 
                  borderBottom: '2px solid #e67e22',
                  paddingBottom: '0.5rem'
                }}>
                  Incidencias ({operacion.total_incidencias})
                </h4>
                
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {operacion.incidencias.map((incidencia, incIndex) => (
                    <div 
                      key={incIndex}
                      style={{ 
                        padding: '0.75rem',
                        backgroundColor: '#fff3cd',
                        border: '1px solid #ffeaa7',
                        borderRadius: '4px',
                        borderLeft: '4px solid #f39c12',
                        fontSize: '0.9rem'
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div><strong>Tipo:</strong> {incidencia.tipo || 'No especificado'}</div>
                        <div><strong>Empleado:</strong> {incidencia.nombre_empleado || 'No especificado'}</div>
                        <div><strong>Fecha Fin:</strong> {incidencia.fecha_fin || 'No especificada'}</div>
                        <div><strong>Admin:</strong> {incidencia.administrador}</div>
                      </div>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: '#7f8c8d' }}>
                        Registrado: {formatDateTime(incidencia.fecha_registro)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Movimientos */}
            {operacion.movimientos.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ 
                  margin: '0 0 1rem 0', 
                  color: '#1abc9c', 
                  borderBottom: '2px solid #1abc9c',
                  paddingBottom: '0.5rem'
                }}>
                  Movimientos de Personal ({operacion.total_movimientos})
                </h4>
                
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {operacion.movimientos.map((movimiento, movIndex) => (
                    <div 
                      key={movIndex}
                      style={{ 
                        padding: '0.75rem',
                        backgroundColor: '#d4edda',
                        border: '1px solid #c3e6cb',
                        borderRadius: '4px',
                        borderLeft: '4px solid #1abc9c',
                        fontSize: '0.9rem'
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div><strong>Empleado:</strong> {movimiento.nombre_empleado || 'No especificado'}</div>
                        <div><strong>Cargo:</strong> {movimiento.cargo || 'No especificado'}</div>
                        <div><strong>Estado:</strong> {movimiento.estado || 'No especificado'}</div>
                        <div><strong>Admin:</strong> {movimiento.administrador}</div>
                      </div>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: '#7f8c8d' }}>
                        Registrado: {formatDateTime(movimiento.fecha_registro)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hechos Relevantes */}
            {operacion.hechos_relevantes.length > 0 && (
              <div>
                <h4 style={{ 
                  margin: '0 0 1rem 0', 
                  color: '#8e44ad', 
                  borderBottom: '2px solid #8e44ad',
                  paddingBottom: '0.5rem'
                }}>
                  Hechos Relevantes ({operacion.total_hechos_relevantes})
                </h4>
                
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {operacion.hechos_relevantes.map((hecho, hechoIndex) => (
                    <div 
                      key={hechoIndex}
                      style={{ 
                        padding: '0.75rem',
                        backgroundColor: '#e8d5ff',
                        border: '1px solid #d1aeff',
                        borderRadius: '4px',
                        borderLeft: '4px solid #8e44ad',
                        fontSize: '0.9rem'
                      }}
                    >
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Hecho:</strong>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#2c3e50' }}>
                          {hecho.hecho}
                        </p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.8rem' }}>
                          <strong>Admin:</strong> {hecho.administrador}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>
                          {formatDateTime(hecho.fecha_registro)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mensaje cuando no hay datos */}
            {operacion.total_incidencias === 0 && operacion.total_movimientos === 0 && operacion.total_hechos_relevantes === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                color: '#6c757d',
                fontStyle: 'italic'
              }}>
                <p>Esta operación no registró incidencias, movimientos ni hechos relevantes este día.</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default DailyDetailedOperations