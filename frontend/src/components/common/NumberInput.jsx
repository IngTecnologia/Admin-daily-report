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
  step = 1,
  allowDecimal = false,
  allowEmpty = false
}) => {
  const handleInputChange = (e) => {
    let inputValue = e.target.value
    
    // Permitir campo vacío durante la edición
    if (inputValue === '') {
      onChange('')
      return
    }
    
    // Validar formato según si permite decimales o no
    let regex = allowDecimal ? /^\d*\.?\d*$/ : /^\d+$/
    
    // Permitir solo números (y punto decimal si está habilitado)
    if (!regex.test(inputValue)) {
      return
    }
    
    // Para decimales, permitir un solo punto
    if (allowDecimal && inputValue.includes('.')) {
      const parts = inputValue.split('.')
      if (parts.length > 2) return // Más de un punto
      if (parts[1] && parts[1].length > 1) return // Más de un decimal
    }
    
    // Convertir a número
    const numValue = allowDecimal ? parseFloat(inputValue) : parseInt(inputValue, 10)
    
    if (isNaN(numValue) && inputValue !== '.') return
    
    // Permitir punto solo al final para facilitar entrada
    if (inputValue === '.') {
      onChange('0.')
      return
    }
    
    // Validar límites solo si tenemos un número completo
    if (!isNaN(numValue)) {
      if (numValue < min || numValue > max) return
    }
    
    // Si el valor es 0 y min es 0, permitir
    if (numValue === 0 && min === 0) {
      onChange(allowDecimal ? '0' : '0')
      return
    }
    
    // Para enteros, remover ceros iniciales
    if (!allowDecimal && numValue > 0 && inputValue.startsWith('0')) {
      onChange(numValue.toString())
    } else {
      onChange(inputValue)
    }
  }

  const handleIncrement = () => {
    const currentValue = allowDecimal ? parseFloat(value || '0') : parseInt(value || '0', 10)
    const newValue = currentValue + step
    if (newValue <= max) {
      onChange(allowDecimal ? newValue.toString() : newValue.toString())
    }
  }

  const handleDecrement = () => {
    const currentValue = allowDecimal ? parseFloat(value || min.toString()) : parseInt(value || min.toString(), 10)
    const newValue = currentValue - step
    if (newValue >= min) {
      onChange(allowDecimal ? newValue.toString() : newValue.toString())
    }
  }

  const handleBlur = () => {
    // Si allowEmpty es true, no asignar valor mínimo automáticamente
    if (!allowEmpty && (value === '' || value === undefined)) {
      onChange(allowDecimal ? min.toString() : min.toString())
    }
    // Si termina en punto, añadir un 0
    if (allowDecimal && value && value.endsWith('.')) {
      onChange(value + '0')
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
          disabled={allowDecimal ? parseFloat(value || '0') >= max : parseInt(value || '0', 10) >= max}
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
          disabled={allowDecimal ? parseFloat(value || '0') <= min : parseInt(value || '0', 10) <= min}
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