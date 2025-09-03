import React from 'react'

const PersonnelInfoSection = ({ formData, errors, updateField }) => {
  return (
    <div className="form-section">
      <h2 className="section-title">
        👥 Información de Personal
      </h2>
      
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="horas_diarias" className="form-label">
            Horas diarias *
            <small style={{ display: 'block', fontWeight: 'normal', color: 'var(--neutral-gray)' }}>
              Número de horas trabajadas (1-24)
            </small>
          </label>
          <input
            type="number"
            id="horas_diarias"
            min="1"
            max="24"
            value={formData.horas_diarias}
            onChange={(e) => updateField('horas_diarias', e.target.value)}
            className={`form-input ${errors.horas_diarias ? 'error' : ''}`}
            placeholder="Ej: 8"
            required
          />
          {errors.horas_diarias && (
            <span className="error-message">{errors.horas_diarias}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="personal_staff" className="form-label">
            Personal staff *
            <small style={{ display: 'block', fontWeight: 'normal', color: 'var(--neutral-gray)' }}>
              Cantidad de personal staff
            </small>
          </label>
          <input
            type="number"
            id="personal_staff"
            min="0"
            value={formData.personal_staff}
            onChange={(e) => updateField('personal_staff', e.target.value)}
            className={`form-input ${errors.personal_staff ? 'error' : ''}`}
            placeholder="Ej: 15"
            required
          />
          {errors.personal_staff && (
            <span className="error-message">{errors.personal_staff}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="personal_base" className="form-label">
            Personal Base *
            <small style={{ display: 'block', fontWeight: 'normal', color: 'var(--neutral-gray)' }}>
              Cantidad de personal base
            </small>
          </label>
          <input
            type="number"
            id="personal_base"
            min="0"
            value={formData.personal_base}
            onChange={(e) => updateField('personal_base', e.target.value)}
            className={`form-input ${errors.personal_base ? 'error' : ''}`}
            placeholder="Ej: 45"
            required
          />
          {errors.personal_base && (
            <span className="error-message">{errors.personal_base}</span>
          )}
        </div>
      </div>

      {/* Resumen visual */}
      {(formData.horas_diarias || formData.personal_staff || formData.personal_base) && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#f8fafc',
          borderRadius: '6px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ 
            display: 'flex', 
            gap: '2rem', 
            flexWrap: 'wrap',
            fontSize: '0.875rem',
            color: 'var(--neutral-gray)'
          }}>
            {formData.horas_diarias && (
              <div>
                <strong>⏰ Horas:</strong> {formData.horas_diarias}h
              </div>
            )}
            {formData.personal_staff && (
              <div>
                <strong>👔 Staff:</strong> {formData.personal_staff}
              </div>
            )}
            {formData.personal_base && (
              <div>
                <strong>🏭 Base:</strong> {formData.personal_base}
              </div>
            )}
            {(formData.personal_staff && formData.personal_base) && (
              <div>
                <strong>📊 Total:</strong> {parseInt(formData.personal_staff || 0) + parseInt(formData.personal_base || 0)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PersonnelInfoSection