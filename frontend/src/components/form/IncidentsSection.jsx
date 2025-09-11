import React from 'react'
import { INCIDENT_TYPES } from '../../services/constants'
import DynamicIncidentFields from './DynamicIncidentFields'
import NumberInput from '../common/NumberInput'

const IncidentsSection = ({ formData, errors, updateField, updateDynamicField }) => {
  const handleQuantityChange = (value) => {
    updateField('cantidad_incidencias', value)
  }

  return (
    <div className="form-section">
      <h2 className="section-title">
        👥 Personal con Incidencias
      </h2>
      
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="cantidad_incidencias" className="form-label">
            Cantidad de personal con incidencias *
            <small style={{ display: 'block', fontWeight: 'normal', color: 'var(--neutral-gray)' }}>
              Dejar vacío si no hay incidencias
            </small>
          </label>
          <NumberInput
            id="cantidad_incidencias"
            min={0}
            max={50}
            value={formData.cantidad_incidencias}
            onChange={handleQuantityChange}
            className={`form-input ${errors.cantidad_incidencias ? 'error' : ''}`}
            placeholder="Dejar vacío = 0"
            allowEmpty={true}
            required={false}
          />
          {errors.cantidad_incidencias && (
            <span className="error-message">{errors.cantidad_incidencias}</span>
          )}
          
          {(parseInt(formData.cantidad_incidencias) || 0) > 0 && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: '#fffbeb',
              border: '1px solid #fed7aa',
              borderRadius: '4px',
              fontSize: '0.875rem',
              color: 'var(--warning-yellow)'
            }}>
              📝 Se generarán {parseInt(formData.cantidad_incidencias) || 0} formularios de incidencia
            </div>
          )}
        </div>
      </div>

      {/* Campos dinamicos de incidencias */}
      {(parseInt(formData.cantidad_incidencias) || 0) > 0 && (
        <div className="dynamic-section">
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            color: 'var(--primary-red)',
            marginBottom: '1rem'
          }}>
            📋 Detalles de Incidencias ({parseInt(formData.cantidad_incidencias) || 0})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Array.from({ length: parseInt(formData.cantidad_incidencias) || 0 }, (_, index) => (
              <DynamicIncidentFields
                key={index}
                index={index}
                incident={formData.incidencias[index] || {}}
                errors={errors}
                updateDynamicField={updateDynamicField}
              />
            ))}
          </div>

          {/* Resumen de incidencias */}
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '6px'
          }}>
            <h4 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: 'var(--primary-red)',
              marginBottom: '0.5rem'
            }}>
              📋 Resumen de Incidencias
            </h4>
            
            <div style={{ fontSize: '0.875rem', color: 'var(--neutral-gray)' }}>
              {formData.incidencias.filter(inc => inc && inc.tipo_incidencia).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {formData.incidencias
                    .filter(inc => inc && inc.tipo_incidencia)
                    .map((inc, idx) => (
                      <div key={idx}>
                        <strong>{idx + 1}.</strong> {inc.tipo_incidencia} - {inc.nombre_empleado || 'Sin nombre'}
                        {inc.fecha_fin && ` (hasta ${inc.fecha_fin})`}
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div style={{ color: 'var(--neutral-gray)', fontStyle: 'italic' }}>
                  Complete los campos para ver el resumen
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IncidentsSection