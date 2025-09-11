import React from 'react'
import DynamicHiringFields from './DynamicHiringFields'
import NumberInput from '../common/NumberInput'

const HiringRetirementsSection = ({ formData, errors, updateField, updateDynamicField }) => {
  const handleQuantityChange = (value) => {
    updateField('cantidad_ingresos_retiros', value)
  }

  return (
    <div className="form-section">
      <h2 className="section-title">
        💼 Ingresos o Retiros
      </h2>
      
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="cantidad_ingresos_retiros" className="form-label">
            Cantidad de ingresos o retiros *
            <small style={{ display: 'block', fontWeight: 'normal', color: 'var(--neutral-gray)' }}>
              Dejar vacío si no hay movimientos de personal
            </small>
          </label>
          <NumberInput
            id="cantidad_ingresos_retiros"
            min={0}
            max={50}
            value={formData.cantidad_ingresos_retiros}
            onChange={handleQuantityChange}
            className={`form-input ${errors.cantidad_ingresos_retiros ? 'error' : ''}`}
            placeholder="Dejar vacío = 0"
            allowEmpty={true}
            required={false}
          />
          {errors.cantidad_ingresos_retiros && (
            <span className="error-message">{errors.cantidad_ingresos_retiros}</span>
          )}
          
          {(parseInt(formData.cantidad_ingresos_retiros) || 0) > 0 && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '4px',
              fontSize: '0.875rem',
              color: 'var(--primary-red)'
            }}>
              📝 Se generarán {parseInt(formData.cantidad_ingresos_retiros) || 0} formularios de movimiento
            </div>
          )}
        </div>
      </div>

      {/* Campos dinámicos de ingresos/retiros */}
      {(parseInt(formData.cantidad_ingresos_retiros) || 0) > 0 && (
        <div className="dynamic-section">
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            color: 'var(--primary-red)',
            marginBottom: '1rem'
          }}>
            📋 Movimientos de Personal ({parseInt(formData.cantidad_ingresos_retiros) || 0})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Array.from({ length: parseInt(formData.cantidad_ingresos_retiros) || 0 }, (_, index) => (
              <DynamicHiringFields
                key={index}
                index={index}
                movement={formData.ingresos_retiros[index] || {}}
                errors={errors}
                updateDynamicField={updateDynamicField}
              />
            ))}
          </div>

          {/* Resumen de movimientos */}
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '6px'
          }}>
            <h4 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: 'var(--success-green)',
              marginBottom: '0.5rem'
            }}>
              📊 Resumen de Movimientos
            </h4>
            
            <div style={{ fontSize: '0.875rem' }}>
              {formData.ingresos_retiros.filter(mov => mov && mov.nombre_empleado).length > 0 ? (
                <div>
                  {/* Estadísticas */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '2rem', 
                    marginBottom: '0.75rem',
                    flexWrap: 'wrap'
                  }}>
                    <div>
                      <strong style={{ color: 'var(--success-green)' }}>
                        ✅ Ingresos: {formData.ingresos_retiros.filter(mov => mov && mov.estado === 'Ingreso').length}
                      </strong>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--error-red)' }}>
                        ❌ Retiros: {formData.ingresos_retiros.filter(mov => mov && mov.estado === 'Retiro').length}
                      </strong>
                    </div>
                  </div>

                  {/* Lista detallada */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {formData.ingresos_retiros
                      .filter(mov => mov && mov.nombre_empleado)
                      .map((mov, idx) => (
                        <div key={idx} style={{ color: 'var(--neutral-gray)' }}>
                          <strong>{idx + 1}.</strong>{' '}
                          <span style={{ 
                            color: mov.estado === 'Ingreso' ? 'var(--success-green)' : 'var(--error-red)',
                            fontWeight: '500'
                          }}>
                            {mov.estado === 'Ingreso' ? '✅' : '❌'} {mov.estado}
                          </span>{' '}
                          - {mov.nombre_empleado || 'Sin nombre'}{' '}
                          {mov.cargo && `(${mov.cargo})`}
                        </div>
                      ))
                    }
                  </div>
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

export default HiringRetirementsSection