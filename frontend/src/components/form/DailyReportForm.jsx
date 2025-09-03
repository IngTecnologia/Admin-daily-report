import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from '../../hooks/useForm'
import { API_BASE_URL } from '../../services/constants'
import AdministratorSection from './AdministratorSection'
import PersonnelInfoSection from './PersonnelInfoSection'
import IncidentsSection from './IncidentsSection'
import HiringRetirementsSection from './HiringRetirementsSection'
import Loading from '../common/Loading'
import Alert from '../common/Alert'

const DailyReportForm = () => {
  const navigate = useNavigate()
  const {
    formData,
    errors,
    isSubmitting,
    updateField,
    updateDynamicField,
    validateAllFields,
    setIsSubmitting,
    resetForm
  } = useForm()

  const [submitError, setSubmitError] = React.useState(null)
  const [submitSuccess, setSubmitSuccess] = React.useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateAllFields()) {
      setSubmitError('Por favor corrija los errores en el formulario')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Preparar los datos para el backend según la especificación de la API
      const submitData = {
        administrador: formData.administrador,
        cliente_operacion: formData.cliente_operacion,
        horas_diarias: parseInt(formData.horas_diarias, 10),
        personal_staff: parseInt(formData.personal_staff, 10),
        personal_base: parseInt(formData.personal_base, 10),
        incidencias: formData.incidencias.filter(inc => inc.tipo_incidencia && inc.nombre_empleado && inc.fecha_fin).map(inc => ({
          tipo: inc.tipo_incidencia,
          nombre_empleado: inc.nombre_empleado,
          fecha_fin: inc.fecha_fin
        })),
        ingresos_retiros: formData.ingresos_retiros.filter(mov => mov.nombre_empleado && mov.cargo && mov.estado).map(mov => ({
          nombre_empleado: mov.nombre_empleado,
          cargo: mov.cargo,
          estado: mov.estado
        }))
      }

      console.log('Enviando datos:', submitData)

      // Llamada a API real
      const response = await fetch(`${API_BASE_URL}/reportes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log('Respuesta del servidor:', responseData)
      
      setSubmitSuccess(true)
      
      // Redirigir a página de éxito después de un momento
      setTimeout(() => {
        navigate('/success', { 
          state: { 
            reportData: submitData,
            timestamp: new Date().toISOString()
          } 
        })
      }, 1500)

    } catch (error) {
      console.error('Error al enviar el reporte:', error)
      setSubmitError('Error al enviar el reporte. Por favor intente nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="form-card">
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}></div>
          <h2 style={{ color: 'var(--success-green)', marginBottom: '1rem' }}>
¡Reporte Enviado Exitosamente!
          </h2>
          <p style={{ color: 'var(--neutral-gray)' }}>
            Redirigiendo a la página de confirmación...
          </p>
          <Loading />
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="form-card">
      {/* Sección 1: Información del Administrador */}
      <AdministratorSection
        formData={formData}
        errors={errors}
        updateField={updateField}
      />

      {/* Sección 2: Información de Personal */}
      <PersonnelInfoSection
        formData={formData}
        errors={errors}
        updateField={updateField}
      />

      {/* Sección 3: Personal con Incidencias */}
      <IncidentsSection
        formData={formData}
        errors={errors}
        updateField={updateField}
        updateDynamicField={updateDynamicField}
      />

      {/* Sección 4: Ingresos o Retiros */}
      <HiringRetirementsSection
        formData={formData}
        errors={errors}
        updateField={updateField}
        updateDynamicField={updateDynamicField}
      />

      {/* Área de errores y envío */}
      <div className="form-section">
        {submitError && (
          <Alert type="error" message={submitError} />
        )}

        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'flex-end',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            type="button"
            onClick={resetForm}
            disabled={isSubmitting}
            className="btn btn-secondary"
            style={{ 
              opacity: isSubmitting ? 0.6 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            = Limpiar Formulario
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ 
              opacity: isSubmitting ? 0.6 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? (
              <>
                <Loading />
                Enviando Reporte...
              </>
            ) : (
              <>
📝 Enviar Reporte Diario
              </>
            )}
          </button>
        </div>

        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          backgroundColor: '#f8fafc', 
          borderRadius: '6px',
          fontSize: '0.875rem',
          color: 'var(--neutral-gray)'
        }}>
          <strong>📄 Resumen:</strong> {' '}
          {formData.administrador && `${formData.administrador} " `}
          {formData.cliente_operacion && `${formData.cliente_operacion} " `}
          {formData.horas_diarias && `${formData.horas_diarias}h diarias " `}
          {formData.personal_staff && `${formData.personal_staff} staff " `}
          {formData.personal_base && `${formData.personal_base} base " `}
          {formData.cantidad_incidencias > 0 && `${formData.cantidad_incidencias} incidencias " `}
          {formData.cantidad_ingresos_retiros > 0 && `${formData.cantidad_ingresos_retiros} movimientos`}
        </div>
      </div>
    </form>
  )
}

export default DailyReportForm