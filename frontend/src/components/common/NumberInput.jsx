import React from 'react'

const NumberInput = ({ 
  id, 
  value, 
  onChange, 
  min = 0, 
  max = 9999, 
  placeholder = "", 
  className = "", 
  required = false,
  step = 1
}) => {
  const handleInputChange = (e) => {
    let inputValue = e.target.value
    
    // Permitir campo vacío durante la edición
    if (inputValue === '') {
      onChange('')
      return
    }
    
    // Remover ceros iniciales excepto si es solo "0"
    if (inputValue.length > 1 && inputValue.startsWith('0')) {
      inputValue = inputValue.replace(/^0+/, '')
      if (inputValue === '') inputValue = '0'
    }
    
    // Convertir a número y validar límites
    const numValue = parseInt(inputValue, 10)
    
    if (isNaN(numValue)) return
    
    if (numValue < min || numValue > max) return
    
    onChange(numValue.toString())
  }

  const handleIncrement = () => {
    const currentValue = parseInt(value || '0', 10)
    if (currentValue < max) {
      onChange((currentValue + step).toString())
    }
  }

  const handleDecrement = () => {
    const currentValue = parseInt(value || '0', 10)
    if (currentValue > min) {
      onChange((currentValue - step).toString())
    }
  }

  const handleBlur = () => {
    // Si el campo está vacío al perder foco, asignar valor mínimo
    if (value === '' || value === undefined) {
      onChange(min.toString())
    }
  }

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
      <input
        type="text"
        id={id}
        value={value || ''}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`${className} number-input`}
        required={required}
        style={{
          flex: 1,
          paddingRight: '3rem',
          // Ocultar spinners nativos
          MozAppearance: 'textfield'
        }}
        // Ocultar spinners en webkit
        onWheel={(e) => e.target.blur()}
      />
      
      {/* Botones de incremento/decremento */}
      <div style={{
        position: 'absolute',
        right: '1px',
        top: '1px',
        bottom: '1px',
        display: 'flex',
        flexDirection: 'column',
        width: '2.5rem',
        backgroundColor: '#f8fafc',
        border: '1px solid #e5e7eb',
        borderLeft: 'none',
        borderRadius: '0 4px 4px 0'
      }}>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={parseInt(value || '0', 10) >= max}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: 'var(--primary-red)',
            borderBottom: '1px solid #e5e7eb',
            borderRadius: '0 3px 0 0',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!e.target.disabled) {
              e.target.style.backgroundColor = '#f1f5f9'
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent'
          }}
        >
          +
        </button>
        <button
          type="button"
          onClick={handleDecrement}
          disabled={parseInt(value || '0', 10) <= min}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: 'var(--primary-red)',
            borderRadius: '0 0 3px 0',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!e.target.disabled) {
              e.target.style.backgroundColor = '#f1f5f9'
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent'
          }}
        >
          −
        </button>
      </div>

      <style jsx>{`
        .number-input::-webkit-outer-spin-button,
        .number-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  )
}

export default NumberInput