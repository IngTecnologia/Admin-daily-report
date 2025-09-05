import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../services/constants'
import { adaptAnalyticsData } from '../../services/dataAdapter'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalReportes: 0,
    reportesHoy: 0,
    totalIncidencias: 0,
    totalMovimientos: 0,
    administradoresActivos: 0,
    promedioHorasDiarias: 0
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/admin/analytics`)
      
      if (!response.ok) {
        throw new Error('Error al cargar datos del dashboard')
      }
      
      const data = await response.json()
      const adaptedData = adaptAnalyticsData(data)
      setStats(adaptedData)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
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

  if (error) {
    return (
      <div className="alert alert-error" style={{ margin: '2rem 0' }}>
        � {error}
        <button 
          onClick={fetchDashboardData}
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
        📊 Dashboard de Métricas
      </h2>

      {/* Métricas principales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        <StatCard
          icon="📅"
          title="Reportes Hoy"
          value={stats.reportesHoy}
          color="var(--success-green)"
          subtitle="Reportes del día actual"
        />
        
        <StatCard
          icon="📅"
          title="Total Reportes"
          value={stats.totalReportes}
          color="var(--primary-red)"
          subtitle="Todos los reportes registrados"
        />
        
        <StatCard
          icon="⚠️"
          title="Total Incidencias"
          value={stats.totalIncidencias}
          color="var(--warning-yellow)"
          subtitle="Incidencias reportadas"
        />
        
        <StatCard
          icon="🔄"
          title="Movimientos de Personal"
          value={stats.totalMovimientos}
          color="var(--accent-orange)"
          subtitle="Ingresos y retiros"
        />
        
        <StatCard
          icon="👥"
          title="Administradores Activos"
          value={stats.administradoresActivos}
          color="var(--neutral-gray)"
          subtitle="Con reportes registrados"
        />
        
        <StatCard
          icon="⚠️"
          title="Promedio Horas Diarias"
          value={stats.promedioHorasDiarias?.toFixed(1) || '0.0'}
          color="var(--primary-red)"
          subtitle="Horas trabajadas promedio"
        />
      </div>

      {/* Resumen rápido */}
      <div style={{
        backgroundColor: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '8px',
        padding: '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: 'var(--success-green)',
          marginBottom: '1rem'
        }}>
          ✅ Resumen del Sistema
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          fontSize: '0.875rem'
        }}>
          <div>
            <strong>Estado del Sistema:</strong> Operacional
          </div>
          <div>
            <strong>Última Actualización:</strong> {new Date().toLocaleString('es-ES')}
          </div>
          <div>
            <strong>Base de Datos:</strong> Excel ({stats.totalReportes} registros)
          </div>
          <div>
            <strong>Disponibilidad:</strong> 99.9%
          </div>
        </div>
      </div>
    </div>
  )
}

const StatCard = ({ icon, title, value, color, subtitle }) => {
  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1.5rem',
      textAlign: 'center',
      transition: 'transform 0.2s, box-shadow 0.2s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = 'none'
    }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
        {icon}
      </div>
      <div style={{ 
        fontSize: '2rem', 
        fontWeight: '700', 
        color: color,
        marginBottom: '0.25rem'
      }}>
        {value}
      </div>
      <div style={{ 
        fontSize: '1rem', 
        fontWeight: '600',
        color: 'var(--dark-text)',
        marginBottom: '0.25rem'
      }}>
        {title}
      </div>
      <div style={{ 
        fontSize: '0.875rem', 
        color: 'var(--neutral-gray)'
      }}>
        {subtitle}
      </div>
    </div>
  )
}

export default Dashboard