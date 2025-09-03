import React from 'react'
import { ADMINISTRATORS, CLIENT_OPERATIONS } from '../../services/constants'

const AdministratorSection = ({ formData, errors, updateField }) => {
  return (
    <div className="form-section">
      <h2 className="section-title">
        =d Información del Administrador
      </h2>
      
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="administrador" className="form-label">
            Administrador *
          </label>
          <select
            id="administrador"
            value={formData.administrador}
            onChange={(e) => updateField('administrador', e.target.value)}
            className={`form-select ${errors.administrador ? 'error' : ''}`}
            required
          >
            <option value="">Seleccione un administrador</option>
            {ADMINISTRATORS.map((admin) => (
              <option key={admin} value={admin}>
                {admin}
              </option>
            ))}
          </select>
          {errors.administrador && (
            <span className="error-message">{errors.administrador}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="cliente_operacion" className="form-label">
            Cliente (operación) *
          </label>
          <select
            id="cliente_operacion"
            value={formData.cliente_operacion}
            onChange={(e) => updateField('cliente_operacion', e.target.value)}
            className={`form-select ${errors.cliente_operacion ? 'error' : ''}`}
            required
          >
            <option value="">Seleccione una operación</option>
            {CLIENT_OPERATIONS.map((operation) => (
              <option key={operation} value={operation}>
                {operation}
              </option>
            ))}
          </select>
          {errors.cliente_operacion && (
            <span className="error-message">{errors.cliente_operacion}</span>
          )}
        </div>
      </div>

      {formData.administrador && formData.cliente_operacion && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '6px',
          color: 'var(--success-green)',
          fontSize: '0.875rem'
        }}>
           <strong>{formData.administrador}</strong> - <strong>{formData.cliente_operacion}</strong>
        </div>
      )}
    </div>
  )
}

export default AdministratorSection