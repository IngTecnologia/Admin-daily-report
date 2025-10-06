import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import authService from '../../services/authService'
import Alert from '../common/Alert'
import Loading from '../common/Loading'

const ChangePassword = ({ onClose, onSuccess }) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Limpiar error cuando el usuario escribe
    if (error) setError(null)
  }

  const validateForm = () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('Todos los campos son requeridos')
      return false
    }

    if (formData.newPassword.length < 8) {
      setError('La nueva contrase\u00f1a debe tener al menos 8 caracteres')
      return false
    }

    if (formData.newPassword === formData.currentPassword) {
      setError('La nueva contrase\u00f1a debe ser diferente a la actual')
      return false
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contrase\u00f1as no coinciden')
      return false
    }

    // Validar complejidad de la contrase\u00f1a
    const hasUpperCase = /[A-Z]/.test(formData.newPassword)
    const hasLowerCase = /[a-z]/.test(formData.newPassword)
    const hasNumbers = /\d/.test(formData.newPassword)
    const hasSpecialChar = /[!@#$%^&*]/.test(formData.newPassword)

    if (!(hasUpperCase && hasLowerCase && hasNumbers)) {
      setError('La contrase\u00f1a debe contener may\u00fasculas, min\u00fasculas y n\u00fameros')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await authService.changePassword(
        formData.currentPassword,
        formData.newPassword
      )

      setSuccess(true)

      // Mostrar mensaje de \u00e9xito por 2 segundos
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        }
        if (onClose) {
          onClose()
        }
      }, 2000)

    } catch (error) {
      setError(error.message || 'Error al cambiar la contrase\u00f1a')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="form-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', color: 'var(--success-green)' }}>
            \u2705
          </div>
          <h2 style={{ color: 'var(--success-green)', marginBottom: '1rem' }}>
            \u00a1Contrase\u00f1a Actualizada!
          </h2>
          <p style={{ color: 'var(--neutral-gray)' }}>
            Su contrase\u00f1a ha sido cambiada exitosamente.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="form-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem',
        padding: '1rem 0'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>\ud83d\udd10</div>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: 'var(--primary-red)',
          marginBottom: '0.5rem'
        }}>
          Cambiar Contrase\u00f1a
        </h2>
        <p style={{
          color: 'var(--neutral-gray)',
          fontSize: '0.9rem'
        }}>
          Usuario: {user?.full_name || user?.username}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ padding: '0 2rem 2rem 2rem' }}>
        {/* Contrase\u00f1a Actual */}
        <div className="form-field" style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="currentPassword" className="form-label">
            Contrase\u00f1a Actual
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPasswords.current ? "text" : "password"}
              id="currentPassword"
              value={formData.currentPassword}
              onChange={(e) => handleInputChange('currentPassword', e.target.value)}
              className="form-input"
              placeholder="Ingrese su contrase\u00f1a actual"
              required
              disabled={isLoading}
              style={{ paddingRight: '3rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                color: 'var(--neutral-gray)'
              }}
            >
              {showPasswords.current ? '\ud83d\udc41\ufe0f' : '\ud83d\udd12'}
            </button>
          </div>
        </div>

        {/* Nueva Contrase\u00f1a */}
        <div className="form-field" style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="newPassword" className="form-label">
            Nueva Contrase\u00f1a
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPasswords.new ? "text" : "password"}
              id="newPassword"
              value={formData.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              className="form-input"
              placeholder="M\u00ednimo 8 caracteres"
              required
              disabled={isLoading}
              style={{ paddingRight: '3rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                color: 'var(--neutral-gray)'
              }}
            >
              {showPasswords.new ? '\ud83d\udc41\ufe0f' : '\ud83d\udd12'}
            </button>
          </div>
          <small style={{ color: 'var(--neutral-gray)', fontSize: '0.8rem' }}>
            Debe contener may\u00fasculas, min\u00fasculas y n\u00fameros
          </small>
        </div>

        {/* Confirmar Contrase\u00f1a */}
        <div className="form-field" style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="confirmPassword" className="form-label">
            Confirmar Nueva Contrase\u00f1a
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPasswords.confirm ? "text" : "password"}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="form-input"
              placeholder="Repita la nueva contrase\u00f1a"
              required
              disabled={isLoading}
              style={{ paddingRight: '3rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                color: 'var(--neutral-gray)'
              }}
            >
              {showPasswords.confirm ? '\ud83d\udc41\ufe0f' : '\ud83d\udd12'}
            </button>
          </div>
        </div>

        {/* Botones */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end',
          marginTop: '2rem'
        }}>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                color: 'var(--neutral-gray)',
                backgroundColor: 'transparent',
                border: '2px solid var(--neutral-light)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              Cancelar
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: 'white',
              backgroundColor: isLoading ? 'var(--neutral-gray)' : 'var(--primary-red)',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              minWidth: '150px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {isLoading ? (
              <>
                <Loading size="small" />
                Cambiando...
              </>
            ) : (
              'Cambiar Contrase\u00f1a'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ChangePassword