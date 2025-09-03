import React from 'react'
import { EMPLOYEE_STATUSES } from '../../services/constants'

const DynamicHiringFields = ({ index, movement, errors, updateDynamicField }) => {
  const handleFieldChange = (field, value) => {
    updateDynamicField('ingresos_retiros', index, field, value)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Ingreso':
        return 'var(--success-green)'
      case 'Retiro':
        return 'var(--error-red)'
      default:
        return 'var(--neutral-gray)'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Ingreso':
        return ''
      case 'Retiro':
        return ''
      default:
        return '=Ë'
    }
  }

  return (
    <div className="dynamic-item">
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <h4 style={{ 
          fontSize: '1.1rem', 
          fontWeight: '600', 
          color: 'var(--primary-blue)',
          margin: 0
        }}>
          Movimiento #{index + 1}
        </h4>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {movement.estado && (
            <div style={{
              fontSize: '0.875rem',
              color: getStatusColor(movement.estado),
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              {getStatusIcon(movement.estado)} {movement.estado}
            </div>
          )}
          
          {movement.nombre_empleado && movement.cargo && movement.estado && (
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--success-green)',
              fontWeight: '500'
            }}>
               Completo
            </div>
          )}
        </div>
      </div>
      
      <div className="form-grid">
        <div className="form-field">
          <label className="form-label">
            Nombre y Apellido del Empleado *
          </label>
          <input
            type="text"
            value={movement.nombre_empleado || ''}
            onChange={(e) => handleFieldChange('nombre_empleado', e.target.value)}
            className={`form-input ${errors[`ingresos_retiros.${index}.nombre_empleado`] ? 'error' : ''}`}
            placeholder="Ej: María López González"
            minLength={3}
            maxLength={100}
            required
          />
          {errors[`ingresos_retiros.${index}.nombre_empleado`] && (
            <span className="error-message">
              {errors[`ingresos_retiros.${index}.nombre_empleado`]}
            </span>
          )}
        </div>

        <div className="form-field">
          <label className="form-label">
            Cargo *
          </label>
          <input
            type="text"
            value={movement.cargo || ''}
            onChange={(e) => handleFieldChange('cargo', e.target.value)}
            className={`form-input ${errors[`ingresos_retiros.${index}.cargo`] ? 'error' : ''}`}
            placeholder="Ej: Técnico de Campo, Supervisor, Operario"
            minLength={2}
            maxLength={50}
            required
          />
          {errors[`ingresos_retiros.${index}.cargo`] && (
            <span className="error-message">
              {errors[`ingresos_retiros.${index}.cargo`]}
            </span>
          )}
        </div>

        <div className="form-field">
          <label className="form-label">
            Estado *
          </label>
          <select
            value={movement.estado || ''}
            onChange={(e) => handleFieldChange('estado', e.target.value)}
            className={`form-select ${errors[`ingresos_retiros.${index}.estado`] ? 'error' : ''}`}
            required
          >
            <option value="">Seleccione un estado</option>
            {EMPLOYEE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getStatusIcon(status)} {status}
              </option>
            ))}
          </select>
          {errors[`ingresos_retiros.${index}.estado`] && (
            <span className="error-message">
              {errors[`ingresos_retiros.${index}.estado`]}
            </span>
          )}
        </div>
      </div>

      {/* Información adicional basada en el estado */}
      {movement.estado && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.75rem',
          backgroundColor: movement.estado === 'Ingreso' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${movement.estado === 'Ingreso' ? '#a7f3d0' : '#fecaca'}`,
          borderRadius: '4px',
          fontSize: '0.875rem'
        }}>
          {movement.estado === 'Ingreso' ? (
            <div style={{ color: 'var(--success-green)' }}>
               <strong>Ingreso de personal:</strong> Nueva incorporación al equipo
              {movement.cargo && ` como ${movement.cargo}`}
            </div>
          ) : (
            <div style={{ color: 'var(--error-red)' }}>
              L <strong>Retiro de personal:</strong> Salida del equipo
              {movement.cargo && ` del cargo ${movement.cargo}`}
            </div>
          )}
        </div>
      )}

      {/* Preview card del empleado */}
      {movement.nombre_empleado && movement.cargo && movement.estado && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.75rem',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(movement.estado),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.5rem'
          }}>
            {getStatusIcon(movement.estado)}
          </div>
          
          <div>
            <div style={{ fontWeight: '600', color: 'var(--dark-text)' }}>
              {movement.nombre_empleado}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--neutral-gray)' }}>
              {movement.cargo} " {movement.estado}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DynamicHiringFields