import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { API_BASE_URL } from '../../services/constants'
import ReportDetail from '../admin/ReportDetail'

const TodayReportsStatus = ({ onReportsChange }) => {
  const { user } = useAuth()
  const [reportsInfo, setReportsInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null) // Reporte seleccionado para ver detalle

  const fetchTodayReports = async () => {
    if (!user?.fullName) return

    try {
      setLoading(true)
      const response = await fetch(
        `${API_BASE_URL}/reportes/admin/${encodeURIComponent(user.fullName)}/today`
      )
      
      if (response.ok) {
        const data = await response.json()
        setReportsInfo(data.data)
        setError(null)
      } else {
        throw new Error('Error al verificar reportes del día')
      }
    } catch (err) {
      console.error('Error fetching today reports:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleViewReport = async (reportId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/reportes/${reportId}`)
      if (response.ok) {
        const reportData = await response.json()
        setSelectedReport(reportData)
      } else {
        throw new Error('Error cargando detalles del reporte')
      }
    } catch (err) {
      console.error('Error fetching report details:', err)
      alert(`Error cargando el reporte: ${err.message}`)
    }
  }

  const handleCloseReportDetail = () => {
    setSelectedReport(null)
  }

  const handleReportUpdated = () => {
    // Recargar la información de reportes después de editar
    fetchTodayReports()
    setSelectedReport(null)
  }

  useEffect(() => {
    fetchTodayReports()
  }, [user?.fullName])

  // Notify parent component when reports status changes
  useEffect(() => {
    if (onReportsChange && reportsInfo !== null) {
      onReportsChange(reportsInfo.ha_reportado || false)
    }
  }, [reportsInfo, onReportsChange])

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#f3f4f6',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        <div>⏳ Verificando reportes del día...</div>
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
        marginBottom: '1.5rem',
        color: 'var(--error-red)'
      }}>
        ❌ {error}
        <button 
          onClick={fetchTodayReports}
          style={{
            marginLeft: '1rem',
            padding: '0.25rem 0.5rem',
            background: 'var(--error-red)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!reportsInfo) return null

  if (!reportsInfo.ha_reportado) {
    return (
      <div style={{
        backgroundColor: '#f0fdf4',
        border: '1px solid #a7f3d0',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1.5rem',
        color: 'var(--success-green)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>✨</span>
          <div>
            <strong>¡Buen día!</strong> Aún no has enviado tu reporte diario.
            <br />
            <small style={{ opacity: 0.8 }}>
              Fecha: {new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}
            </small>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: '#fffbeb',
      border: '1px solid #fed7aa',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1.5rem',
      color: 'var(--warning-yellow)'
    }}>
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>📝</span>
          <strong>
            Ya has enviado {reportsInfo.reportes_enviados} reporte(s) hoy
          </strong>
        </div>
        <small style={{ opacity: 0.8 }}>
          Fecha: {new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}
        </small>
      </div>

      {reportsInfo.reportes.length > 0 && (
        <div style={{ fontSize: '0.875rem' }}>
          <div style={{ marginBottom: '0.5rem', fontWeight: '500' }}>
            📊 Reportes enviados hoy:
          </div>
          <div style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            borderRadius: '4px',
            padding: '0.5rem',
            maxHeight: '120px',
            overflowY: 'auto'
          }}>
            {reportsInfo.reportes.map((reporte, index) => (
              <div key={reporte.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: index < reportsInfo.reportes.length - 1 ? '0.25rem' : '0',
                marginBottom: index < reportsInfo.reportes.length - 1 ? '0.25rem' : '0',
                borderBottom: index < reportsInfo.reportes.length - 1 ? '1px solid rgba(0,0,0,0.1)' : 'none'
              }}>
                <span style={{ flex: 1 }}>#{index + 1} - {reporte.id}</span>
                <span style={{ 
                  fontSize: '0.75rem', 
                  opacity: 0.8, 
                  marginRight: '0.5rem' 
                }}>
                  {new Date(reporte.hora).toLocaleTimeString('es-CO', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
                <button
                  onClick={() => handleViewReport(reporte.id)}
                  style={{
                    background: 'var(--primary-red)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#b91c1c'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'var(--primary-red)'
                  }}
                  title={`Ver detalle del reporte ${reporte.id}`}
                >
                  👁️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        marginTop: '0.75rem',
        padding: '0.5rem',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: '4px',
        fontSize: '0.875rem'
      }}>
        ℹ️ <strong>Nota:</strong> Haz clic en 👁️ para ver los detalles del reporte y editarlo si es necesario.
      </div>

      {/* Modal de detalle del reporte */}
      {selectedReport && (
        <ReportDetail 
          report={selectedReport}
          onClose={handleCloseReportDetail}
          allowEdit={true}
          onReportUpdated={handleReportUpdated}
        />
      )}
    </div>
  )
}

export default TodayReportsStatus