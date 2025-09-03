// Constantes del formulario según especificaciones del README

export const ADMINISTRATORS = [
  'Adriana Robayo',
  'Angela Ramirez',
  'Floribe Correa',
  'Julieth Rincon',
  'Eddinson Javier Martinez',
  'Kellis Minosca Morquera',
  'Kenia Sanchez',
  'Liliana Romero',
  'Marcela Cusba Gomez',
  'Mirledys García San Juan',
  'Yolima Arenas Zarate'
]

export const CLIENT_OPERATIONS = [
  'Administrativo Barranca',
  'Administrativo Bogota',
  'CEDCO',
  'PAREX',
  'VRC',
  'SIERRACOL',
  'VPI ADMON',
  'VPI CUSIANA',
  'VPI FLOREÑA',
  'VPI CUPIAGUA'
]

export const INCIDENT_TYPES = [
  'Incapacidad Médica Por Enfermedad Común',
  'Incapacidad Médica por Enfermedad Laboral',
  'Permiso por Cita Médica',
  'Licencia de Maternidad',
  'Licencia de paternidad',
  'Permiso por Luto',
  'Permiso por Calamidad Doméstica',
  'Vacaciones',
  'Compensatorios',
  'Día de la Familia',
  'Suspensiones de contrato',
  'Permisos no remunerados'
]

export const EMPLOYEE_STATUSES = [
  'Ingreso',
  'Retiro'
]

// Configuración de validaciones
export const VALIDATION_RULES = {
  administrador: { required: true, type: 'select' },
  cliente_operacion: { required: true, type: 'select' },
  horas_diarias: { 
    required: true, 
    type: 'number', 
    min: 1, 
    max: 24, 
    integer: true 
  },
  personal_staff: { 
    required: true, 
    type: 'number', 
    min: 0, 
    integer: true 
  },
  personal_base: { 
    required: true, 
    type: 'number', 
    min: 0, 
    integer: true 
  },
  cantidad_incidencias: {
    required: true,
    type: 'number',
    min: 0,
    integer: true
  },
  cantidad_ingresos_retiros: {
    required: true,
    type: 'number',
    min: 0,
    integer: true
  },
  nombre_empleado: {
    required: true,
    type: 'text',
    minLength: 3,
    maxLength: 100
  },
  fecha_fin: {
    required: true,
    type: 'date'
  },
  cargo: {
    required: true,
    type: 'text',
    minLength: 2,
    maxLength: 50
  }
}

// Configuración de API
export const API_BASE_URL = 'http://localhost:8001/api/v1'

export const API_ENDPOINTS = {
  REPORTES: '/reportes',
  ADMIN_REPORTES: '/admin/reportes',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_EXPORT: '/admin/export'
}