import { useState, useEffect } from 'react'
import { VALIDATION_RULES } from '../services/constants'

export const useForm = (initialState = {}) => {
  const [formData, setFormData] = useState({
    administrador: '',
    cliente_operacion: '',
    horas_diarias: '',
    personal_staff: '',
    personal_base: '',
    cantidad_incidencias: 0,
    cantidad_ingresos_retiros: 0,
    incidencias: [],
    ingresos_retiros: [],
    ...initialState
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touchedFields, setTouchedFields] = useState({})

  // Función para validar un campo individual
  const validateField = (name, value) => {
    const rule = VALIDATION_RULES[name]
    if (!rule) return null

    // Campo requerido
    if (rule.required && (!value || value === '')) {
      return 'Este campo es obligatorio'
    }

    // Validación de números
    if (rule.type === 'number') {
      const numValue = parseInt(value, 10)
      
      if (value !== '' && isNaN(numValue)) {
        return 'Debe ser un número válido'
      }
      
      if (!isNaN(numValue)) {
        if (rule.integer && !Number.isInteger(numValue)) {
          return 'Debe ser un número entero'
        }
        
        if (rule.min !== undefined && numValue < rule.min) {
          return `El valor mínimo es ${rule.min}`
        }
        
        if (rule.max !== undefined && numValue > rule.max) {
          return `El valor máximo es ${rule.max}`
        }
      }
    }

    // Validación de texto
    if (rule.type === 'text' && value) {
      if (rule.minLength && value.length < rule.minLength) {
        return `Mínimo ${rule.minLength} caracteres`
      }
      
      if (rule.maxLength && value.length > rule.maxLength) {
        return `Máximo ${rule.maxLength} caracteres`
      }
    }

    // Validación de fecha
    if (rule.type === 'date' && value) {
      const selectedDate = new Date(value)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate < today) {
        return 'La fecha no puede ser anterior a hoy'
      }
      
      const maxDate = new Date()
      maxDate.setFullYear(maxDate.getFullYear() + 1)
      
      if (selectedDate > maxDate) {
        return 'La fecha no puede ser más de un año en el futuro'
      }
    }

    return null
  }

  // Función para actualizar un campo
  const updateField = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Marcar el campo como tocado
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }))

    // Validar el campo en tiempo real
    const error = validateField(name, value)
    setErrors(prev => ({
      ...prev,
      [name]: error
    }))
  }

  // Función para validar todos los campos
  const validateAllFields = () => {
    const newErrors = {}
    let isValid = true

    // Validar campos básicos
    Object.keys(VALIDATION_RULES).forEach(fieldName => {
      if (['nombre_empleado', 'fecha_fin', 'cargo'].includes(fieldName)) {
        return // Estos se validan dinámicamente
      }
      
      const error = validateField(fieldName, formData[fieldName])
      if (error) {
        newErrors[fieldName] = error
        isValid = false
      }
    })

    // Validar campos dinámicos de incidencias
    if (formData.cantidad_incidencias > 0) {
      for (let i = 0; i < formData.cantidad_incidencias; i++) {
        const incidencia = formData.incidencias[i] || {}
        
        ['tipo_incidencia', 'nombre_empleado', 'fecha_fin'].forEach(field => {
          const value = incidencia[field] || ''
          const error = validateField(field, value)
          if (error) {
            newErrors[`incidencias.${i}.${field}`] = error
            isValid = false
          }
        })
      }
    }

    // Validar campos dinámicos de ingresos/retiros
    if (formData.cantidad_ingresos_retiros > 0) {
      for (let i = 0; i < formData.cantidad_ingresos_retiros; i++) {
        const movimiento = formData.ingresos_retiros[i] || {}
        
        ['nombre_empleado', 'cargo', 'estado'].forEach(field => {
          const value = movimiento[field] || ''
          const error = validateField(field, value)
          if (error) {
            newErrors[`ingresos_retiros.${i}.${field}`] = error
            isValid = false
          }
        })
      }
    }

    setErrors(newErrors)
    return isValid
  }

  // Función para actualizar campos dinámicos
  const updateDynamicField = (section, index, field, value) => {
    setFormData(prev => {
      const newData = { ...prev }
      
      if (!newData[section][index]) {
        newData[section][index] = {}
      }
      
      newData[section][index][field] = value
      return newData
    })

    // Validar el campo dinámico
    const error = validateField(field, value)
    setErrors(prev => ({
      ...prev,
      [`${section}.${index}.${field}`]: error
    }))
  }

  // Efecto para manejar cambios en cantidades
  useEffect(() => {
    // Ajustar array de incidencias
    if (formData.cantidad_incidencias !== formData.incidencias.length) {
      const newIncidencias = [...formData.incidencias]
      
      if (formData.cantidad_incidencias > newIncidencias.length) {
        // Agregar nuevas incidencias vacías
        for (let i = newIncidencias.length; i < formData.cantidad_incidencias; i++) {
          newIncidencias.push({
            tipo_incidencia: '',
            nombre_empleado: '',
            fecha_fin: ''
          })
        }
      } else {
        // Remover incidencias extra
        newIncidencias.splice(formData.cantidad_incidencias)
      }
      
      setFormData(prev => ({ ...prev, incidencias: newIncidencias }))
    }

    // Ajustar array de ingresos/retiros
    if (formData.cantidad_ingresos_retiros !== formData.ingresos_retiros.length) {
      const newMovimientos = [...formData.ingresos_retiros]
      
      if (formData.cantidad_ingresos_retiros > newMovimientos.length) {
        // Agregar nuevos movimientos vacíos
        for (let i = newMovimientos.length; i < formData.cantidad_ingresos_retiros; i++) {
          newMovimientos.push({
            nombre_empleado: '',
            cargo: '',
            estado: ''
          })
        }
      } else {
        // Remover movimientos extra
        newMovimientos.splice(formData.cantidad_ingresos_retiros)
      }
      
      setFormData(prev => ({ ...prev, ingresos_retiros: newMovimientos }))
    }
  }, [formData.cantidad_incidencias, formData.cantidad_ingresos_retiros])

  // Función para resetear el formulario
  const resetForm = () => {
    setFormData({
      administrador: '',
      cliente_operacion: '',
      horas_diarias: '',
      personal_staff: '',
      personal_base: '',
      cantidad_incidencias: 0,
      cantidad_ingresos_retiros: 0,
      incidencias: [],
      ingresos_retiros: []
    })
    setErrors({})
    setTouchedFields({})
    setIsSubmitting(false)
  }

  return {
    formData,
    errors,
    isSubmitting,
    touchedFields,
    updateField,
    updateDynamicField,
    validateAllFields,
    setIsSubmitting,
    resetForm
  }
}