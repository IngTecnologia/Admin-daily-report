import React, { useState } from 'react'
import Dashboard from '../components/admin/Dashboard'
import ReportsList from '../components/admin/ReportsList'
import ReportDetail from '../components/admin/ReportDetail'
import FormViewReports from '../components/admin/FormViewReports'
import DailyGeneralOperations from '../components/admin/DailyGeneralOperations'
import DailyDetailedOperations from '../components/admin/DailyDetailedOperations'
import AccumulatedGeneralOperations from '../components/admin/AccumulatedGeneralOperations'
import AccumulatedDetailedOperations from '../components/admin/AccumulatedDetailedOperations'

const Admin = () => {
  const [currentView, setCurrentView] = useState('dashboard')
  const [selectedReport, setSelectedReport] = useState(null)

  const handleViewReport = (report) => {
    setSelectedReport(report)
  }

  const handleCloseReportDetail = () => {
    setSelectedReport(null)
  }

  const renderNavigation = () => (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '2rem',
      backgroundColor: 'white',
      padding: '0.5rem',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    }}>
      <NavButton
        active={currentView === 'dashboard'}
        onClick={() => setCurrentView('dashboard')}
        icon="📊"
        label="Dashboard"
      />
      <NavButton
        active={currentView === 'reports'}
        onClick={() => setCurrentView('reports')}
        icon="📋"
        label="Lista de Reportes"
      />
      <NavButton
        active={currentView === 'formview'}
        onClick={() => setCurrentView('formview')}
        icon="📝"
        label="Vista Formulario"
      />
      <NavButton
        active={currentView === 'daily-general'}
        onClick={() => setCurrentView('daily-general')}
        icon="🌅"
        label="Operación Diaria"
      />
      <NavButton
        active={currentView === 'daily-detailed'}
        onClick={() => setCurrentView('daily-detailed')}
        icon="📊"
        label="Detalle por Operación"
      />
      <NavButton
        active={currentView === 'accumulated-general'}
        onClick={() => setCurrentView('accumulated-general')}
        icon="📈"
        label="General Acumulado"
      />
      <NavButton
        active={currentView === 'accumulated-detailed'}
        onClick={() => setCurrentView('accumulated-detailed')}
        icon="📋"
        label="Detalle Acumulado"
      />
    </div>
  )

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />
      case 'reports':
        return <ReportsList onViewReport={handleViewReport} />
      case 'formview':
        return <FormViewReports onViewReport={handleViewReport} />
      case 'daily-general':
        return <DailyGeneralOperations />
      case 'daily-detailed':
        return <DailyDetailedOperations />
      case 'accumulated-general':
        return <AccumulatedGeneralOperations />
      case 'accumulated-detailed':
        return <AccumulatedDetailedOperations />
      default:
        return <Dashboard />
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 80px)', padding: '2rem 0' }}>
      <div className="form-container">
        <div className="form-card">
          <div style={{ padding: '2rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: 'var(--primary-red)',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                ⚙️ Panel de Administración
              </h1>
              
              <p style={{
                fontSize: '1.125rem',
                color: 'var(--neutral-gray)',
                marginBottom: '0'
              }}>
                Gestione y analice los reportes diarios del sistema
              </p>
            </div>

            {/* Navigation */}
            {renderNavigation()}

            {/* Content */}
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetail 
          report={selectedReport}
          onClose={handleCloseReportDetail}
        />
      )}
    </div>
  )
}

const NavButton = ({ active, onClick, icon, label }) => {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1.5rem',
        border: 'none',
        borderRadius: '6px',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
        backgroundColor: active ? 'var(--primary-red)' : 'transparent',
        color: active ? 'white' : 'var(--dark-text)'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.target.style.backgroundColor = '#f3f4f6'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.target.style.backgroundColor = 'transparent'
        }
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

export default Admin