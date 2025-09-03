import React from 'react'
import { INCIDENT_TYPES } from '../../services/constants'

const DynamicIncidentFields = ({ index, incident, errors, updateDynamicField }) => {
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const handleFieldChange = (field, value) => {
    updateDynamicField('incidencias', index, field, value)
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
          Incidencia #{index + 1}
        </h4>
        
        {incident.tipo_incidencia && incident.nombre_empleado && (
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--success-green)',
            fontWeight: '500'
          }}>
            ✅ Completo
          </div>
        )}
      </div>
      
      <div className="form-grid">
        <div className="form-field">
          <label className="form-label">
            Tipo de incidencia *
          </label>
          <select
            value={incident.tipo_incidencia || ''}
            onChange={(e) => handleFieldChange('tipo_incidencia', e.target.value)}
            className={`form-select ${errors[`incidencias.${index}.tipo_incidencia`] ? 'error' : ''}`}
            required
          >
            <option value="">Seleccione un tipo de incidencia</option>
            {INCIDENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors[`incidencias.${index}.tipo_incidencia`] && (
            <span className="error-message">
              {errors[`incidencias.${index}.tipo_incidencia`]}
            </span>
          )}
        </div>

        <div className="form-field">
          <label className="form-label">
            Nombre y Apellido del Empleado *
          </label>
          <input
            type="text"
            value={incident.nombre_empleado || ''}
            onChange={(e) => handleFieldChange('nombre_empleado', e.target.value)}
            className={`form-input ${errors[`incidencias.${index}.nombre_empleado`] ? 'error' : ''}`}
            placeholder="Ej: Juan Perez Garcia"
            minLength={3}
            maxLength={100}
            required
          />
          {errors[`incidencias.${index}.nombre_empleado`] && (
            <span className="error-message">
              {errors[`incidencias.${index}.nombre_empleado`]}
            </span>
          )}
        </div>

        <div className="form-field">
          <label className="form-label">
            Fecha de Fin de la Novedad *
          </label>
          <input
            type="date"
            value={incident.fecha_fin || ''}
            onChange={(e) => handleFieldChange('fecha_fin', e.target.value)}
            className={`form-input ${errors[`incidencias.${index}.fecha_fin`] ? 'error' : ''}`}
            min={getTodayDate()}
            required
          />
          {errors[`incidencias.${index}.fecha_fin`] && (
            <span className="error-message">
              {errors[`incidencias.${index}.fecha_fin`]}
            </span>
          )}
          {incident.fecha_fin && (
            <small style={{ 
              display: 'block', 
              marginTop: '0.25rem',
              color: 'var(--neutral-gray)' 
            }}>
              Fin programado: {new Date(incident.fecha_fin).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </small>
          )}
        </div>
      </div>

      {incident.tipo_incidencia && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.75rem',
          backgroundColor: '#f8fafc',
          borderRadius: '4px',
          fontSize: '0.875rem',
          color: 'var(--neutral-gray)'
        }}>
          {incident.tipo_incidencia.includes('Incapacidad') && (
            <div>
              💊 <strong>Incapacidad médica:</strong> Requiere certificado médico
            </div>
          )}
          {incident.tipo_incidencia.includes('Licencia') && (
            <div>
              📋 <strong>Licencia:</strong> Según normativa laboral vigente
            </div>
          )}
          {incident.tipo_incidencia === 'Vacaciones' && (
            <div>
              🏖️ <strong>Vacaciones:</strong> Tiempo de descanso remunerado
            </div>
          )}
          {incident.tipo_incidencia.includes('Permiso') && (
            <div>
              📅 <strong>Permiso:</strong> Autorizacion temporal
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DynamicIncidentFields