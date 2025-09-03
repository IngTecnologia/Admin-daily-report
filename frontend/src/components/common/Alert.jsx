import React from 'react'

const Alert = ({ type = 'info', message, onClose }) => {
  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return {
          className: 'alert-success',
          icon: '✅'
        }
      case 'error':
        return {
          className: 'alert-error',
          icon: '❌'
        }
      case 'warning':
        return {
          className: 'alert-warning',
          icon: '⚠️'
        }
      default:
        return {
          className: 'alert-info',
          icon: 'ℹ️'
        }
    }
  }

  const { className, icon } = getAlertStyles()

  return (
    <div className={`alert ${className}`}>
      <span style={{ fontSize: '1.25rem' }}>{icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.25rem',
            cursor: 'pointer',
            color: 'inherit',
            opacity: 0.7
          }}
          onMouseEnter={(e) => e.target.style.opacity = '1'}
          onMouseLeave={(e) => e.target.style.opacity = '0.7'}
        >
          ❌
        </button>
      )}
    </div>
  )
}

export default Alert
