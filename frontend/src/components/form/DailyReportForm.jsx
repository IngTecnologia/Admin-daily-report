import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from '../../hooks/useForm'
import { useAuth } from '../../contexts/AuthContext'
import { API_BASE_URL } from '../../services/constants'
import { getClientForAdmin } from '../../config/adminMapping'
import PersonnelInfoSection from './PersonnelInfoSection'
import IncidentsSection from './IncidentsSection'
import HiringRetirementsSection from './HiringRetirementsSection'
import RelevantFactsSection from './RelevantFactsSection'
import Loading from '../common/Loading'
import Alert from '../common/Alert'

const DailyReportForm = ({ isDisabled = false }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
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
  const [userOperations, setUserOperations] = React.useState([])
  const [selectedOperation, setSelectedOperation] = React.useState(null)
  const [loadingOperations, setLoadingOperations] = React.useState(true)

  // Cargar operaciones del usuario al montar el componente
  React.useEffect(() => {
    const fetchUserOperations = async () => {
      try {
        setLoadingOperations(true)
        const token = localStorage.getItem('auth_token')

        const response = await fetch(`${API_BASE_URL}/auth/me/operations`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setUserOperations(data.operations || [])

          // Si solo hay una operación, seleccionarla automáticamente
          if (data.operations && data.operations.length === 1) {
            setSelectedOperation(data.operations[0])
          } else if (data.default_operation) {
            setSelectedOperation(data.default_operation)
          }
        } else {
          // Fallback a método legacy si falla el endpoint
          const administrador = user?.fullName || user?.username
          const cliente = getClientForAdmin(administrador)
          if (cliente) {
            setUserOperations([cliente])
            setSelectedOperation(cliente)
          }
        }
      } catch (error) {
        console.error('Error loading operations:', error)
        // Fallback a método legacy
        const administrador = user?.fullName || user?.username
        const cliente = getClientForAdmin(administrador)
        if (cliente) {
          setUserOperations([cliente])
          setSelectedOperation(cliente)
        }
      } finally {
        setLoadingOperations(false)
      }
    }

    if (user) {
      fetchUserOperations()
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateAllFields()) {
      setSubmitError('Por favor corrija los errores en el formulario')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Obtener administrador y cliente del usuario autenticado
      const administrador = user?.full_name || user?.fullName || user?.administrator_name || user?.username
      const cliente_operacion = selectedOperation

      // Validar que el usuario tenga una operación seleccionada
      if (!cliente_operacion) {
        setSubmitError(`Por favor seleccione una operación para enviar el reporte`)
        return
      }

      // Preparar los datos para el backend según la especificación de la API
      const submitData = {
        administrador: administrador,
        cliente_operacion: cliente_operacion,
        horas_diarias: parseFloat(formData.horas_diarias),
        personal_staff: parseInt(formData.personal_staff, 10),
        personal_base: parseInt(formData.personal_base, 10),
        incidencias: (formData.incidencias || []).filter(inc => inc.tipo_incidencia && inc.nombre_empleado && inc.fecha_fin).map(inc => ({
          tipo: inc.tipo_incidencia,
          nombre_empleado: inc.nombre_empleado,
          fecha_fin: inc.fecha_fin
        })),
        ingresos_retiros: (formData.ingresos_retiros || []).filter(mov => mov.nombre_empleado && mov.cargo && mov.estado).map(mov => ({
          nombre_empleado: mov.nombre_empleado,
          cargo: mov.cargo,
          estado: mov.estado
        })),
        hechos_relevantes: formData.hechos_relevantes || ''
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
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
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

  if (isDisabled) {
    return (
      <div className="form-card" style={{ position: 'relative' }}>
        {/* Overlay de formulario deshabilitado */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          borderRadius: '12px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#fff8dc',
            border: '2px solid #ffd700',
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center',
            maxWidth: '400px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
            <h3 style={{ 
              color: 'var(--warning-yellow)', 
              marginBottom: '1rem', 
              fontSize: '1.5rem' 
            }}>
              Formulario No Disponible
            </h3>
            <p style={{ 
              color: 'var(--dark-text)', 
              lineHeight: '1.5',
              marginBottom: '1rem' 
            }}>
              Ya has enviado tu reporte diario. Para realizar cambios, utiliza el botón de editar en la sección superior.
            </p>
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: 'var(--primary-red)'
            }}>
              💡 <strong>Consejo:</strong> Puedes editar tu reporte existente haciendo clic en el ícono 👁️ arriba
            </div>
          </div>
        </div>

        {/* Formulario deshabilitado (solo visual) */}
        <div style={{ opacity: 0.3, pointerEvents: 'none' }}>
          <div className="form-section">
            <h2 className="section-title">
              👤 Administrador: {user?.fullName}
            </h2>
            <div style={{
              padding: '1rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}>
              <div style={{ color: 'var(--success-green)', fontWeight: '600' }}>
                ✅ Cliente/Operación: {getClientForAdmin(user?.fullName || user?.username)}
              </div>
              <div style={{ color: 'var(--neutral-gray)', marginTop: '0.25rem' }}>
                Usuario autenticado: {user?.username} • Área: {user?.area}
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h2 className="section-title">📊 Información de Personal</h2>
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--neutral-gray)' }}>
              Formulario deshabilitado - Ya has enviado tu reporte diario
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="form-card">
      {/* Información del administrador actual */}
      <div className="form-section">
        <h2 className="section-title">
          👤 Administrador: {user?.fullName}
        </h2>

        {loadingOperations ? (
          <div style={{
            padding: '1rem',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            textAlign: 'center',
            color: 'var(--neutral-gray)'
          }}>
            ⏳ Cargando operaciones asignadas...
          </div>
        ) : userOperations.length > 1 ? (
          <div>
            <label className="form-label">
              Cliente/Operación *
              <small style={{ display: 'block', fontWeight: 'normal', color: 'var(--neutral-gray)' }}>
                Selecciona la operación para la cual deseas enviar el reporte
              </small>
            </label>
            <select
              value={selectedOperation || ''}
              onChange={(e) => setSelectedOperation(e.target.value)}
              className="form-input"
              required
              style={{
                padding: '0.75rem',
                fontSize: '1rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: '#fff',
                width: '100%',
                cursor: 'pointer'
              }}
            >
              <option value="">-- Seleccione una operación --</option>
              {userOperations.map((operation) => (
                <option key={operation} value={operation}>
                  {operation}
                </option>
              ))}
            </select>
            {selectedOperation && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: 'var(--success-green)'
              }}>
                ✅ Operación seleccionada: <strong>{selectedOperation}</strong>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            padding: '1rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '6px',
            fontSize: '0.875rem'
          }}>
            <div style={{ color: 'var(--success-green)', fontWeight: '600' }}>
              ✅ Cliente/Operación: {selectedOperation || userOperations[0] || 'No asignado'}
            </div>
            <div style={{ color: 'var(--neutral-gray)', marginTop: '0.25rem' }}>
              Usuario autenticado: {user?.username}
            </div>
          </div>
        )}
      </div>

      {/* Sección 1: Información de Personal */}
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

      {/* Sección 5: Hechos Relevantes */}
      <RelevantFactsSection
        formData={formData}
        errors={errors}
        updateField={updateField}
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
            🗑 Limpiar Formulario
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
          {user?.fullName && `${user.fullName} • `}
          {selectedOperation && `${selectedOperation} • `}
          {formData.horas_diarias && `${formData.horas_diarias}h diarias • `}
          {formData.personal_staff && `${formData.personal_staff} staff • `}
          {formData.personal_base && `${formData.personal_base} base • `}
          {formData.cantidad_incidencias > 0 && `${formData.cantidad_incidencias} incidencias • `}
          {formData.cantidad_ingresos_retiros > 0 && `${formData.cantidad_ingresos_retiros} movimientos`}
        </div>
      </div>
    </form>
  )
}

export default DailyReportForm