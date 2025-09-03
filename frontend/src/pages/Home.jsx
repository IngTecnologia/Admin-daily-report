import React from 'react'
import DailyReportForm from '../components/form/DailyReportForm'

const Home = () => {
  return (
    <div style={{ minHeight: 'calc(100vh - 80px)', padding: '2rem 0' }}>
      <div className="form-container">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: 'var(--white)',
            marginBottom: '1rem',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            =Ê Reporte Diario de Administrador
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'var(--white)',
            opacity: '0.9',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}>
            Complete la información diaria de su operación
          </p>
        </div>
        
        <DailyReportForm />
      </div>
    </div>
  )
}

export default Home