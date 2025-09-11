import { useState, useEffect } from 'react'
import { VALIDATION_RULES } from '../services/constants'

export const useForm = (initialState = {}) => {
  const [formData, setFormData] = useState({
    horas_diarias: '',
    personal_staff: '',
    personal_base: '',
    cantidad_incidencias: '',
    cantidad_ingresos_retiros: '',
    hechos_relevantes: '',
    incidencias: [],
    ingresos_retiros: [],
    ...initialState
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touchedFields, setTouchedFields] = useState({})

  // Funci�n para validar un campo individual
  const validateField = (name, value) => {
    const rule = VALIDATION_RULES[name]
    if (!rule) return null

    // Campo requerido - permitir 0 como valor válido y valores vacíos si allowEmpty está habilitado
    if (rule.required && !rule.allowEmpty && (value === '' || value === null || value === undefined)) {
      return 'Este campo es obligatorio'
    }

    // Validaci�n de n�meros
    if (rule.type === 'number') {
      const numValue = parseInt(value, 10)
      
      if (value !== '' && isNaN(numValue)) {
        return 'Debe ser un n�mero v�lido'
      }
      
      if (!isNaN(numValue)) {
        if (rule.integer && !Number.isInteger(numValue)) {
          return 'Debe ser un n�mero entero'
        }
        
        if (rule.min !== undefined && numValue < rule.min) {
          return `El valor m�nimo es ${rule.min}`
        }
        
        if (rule.max !== undefined && numValue > rule.max) {
          return `El valor m�ximo es ${rule.max}`
        }
      }
    }

    // Validaci�n de texto
    if (rule.type === 'text' && value) {
      if (rule.minLength && value.length < rule.minLength) {
        return `M�nimo ${rule.minLength} caracteres`
      }
      
      if (rule.maxLength && value.length > rule.maxLength) {
        return `M�ximo ${rule.maxLength} caracteres`
      }
    }

    // Validaci�n de fecha
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
        return 'La fecha no puede ser m�s de un a�o en el futuro'
      }
    }

    return null
  }

  // Funci�n para actualizar un campo
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

  // Funci�n para validar todos los campos
  const validateAllFields = () => {
    const newErrors = {}
    let isValid = true

    // Validar campos b�sicos (excluyendo los campos de administrador)
    Object.keys(VALIDATION_RULES).forEach(fieldName => {
      if (['nombre_empleado', 'fecha_fin', 'cargo', 'administrador', 'cliente_operacion'].includes(fieldName)) {
        return // Estos se validan din�micamente o ya no se usan
      }
      
      const error = validateField(fieldName, formData[fieldName])
      if (error) {
        newErrors[fieldName] = error
        isValid = false
      }
    })

    // Validar campos din�micos de incidencias
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

    // Validar campos din�micos de ingresos/retiros
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

  // Funci�n para actualizar campos din�micos
  const updateDynamicField = (section, index, field, value) => {
    setFormData(prev => {
      const newData = { ...prev }
      
      if (!newData[section][index]) {
        newData[section][index] = {}
      }
      
      newData[section][index][field] = value
      return newData
    })

    // Validar el campo din�mico
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
        // Agregar nuevas incidencias vac�as
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
        // Agregar nuevos movimientos vac�os
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

  // Funci�n para resetear el formulario
  const resetForm = () => {
    setFormData({
      horas_diarias: '',
      personal_staff: '',
      personal_base: '',
      cantidad_incidencias: '',
      cantidad_ingresos_retiros: '',
      hechos_relevantes: '',
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