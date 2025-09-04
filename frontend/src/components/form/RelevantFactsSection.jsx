import React from 'react'

const RelevantFactsSection = ({ formData, updateField, errors }) => {
  return (
    <div className="form-section">
      <h3 className="section-title">📝 Hechos relevantes</h3>
      
      <div className="form-field">
        <label htmlFor="hechos_relevantes" className="form-label">
          Hechos relevantes del día (opcional)
        </label>
        <textarea
          id="hechos_relevantes"
          value={formData.hechos_relevantes || ''}
          onChange={(e) => updateField('hechos_relevantes', e.target.value)}
          className={`form-input ${errors.hechos_relevantes ? 'error' : ''}`}
          placeholder="Describa cualquier hecho relevante que haya ocurrido durante el día..."
          rows={4}
          style={{
            resize: 'vertical',
            minHeight: '100px'
          }}
        />
        {errors.hechos_relevantes && (
          <span className="error-message">{errors.hechos_relevantes}</span>
        )}
      </div>
    </div>
  )
}

export default RelevantFactsSection