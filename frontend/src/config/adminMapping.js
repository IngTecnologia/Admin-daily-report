// Mapeo de administradores a sus clientes/operaciones asignadas
export const ADMIN_CLIENT_MAPPING = {
  'Adriana Robayo': 'Consorcio P&C',
  'Angela Ramirez': 'Confiabilidad VRC',
  'Floribe Correa': 'Administrativo Bogota',
  'Julieth Rincon': 'Sierracol CEDCO',
  'Eddinson Javier Martinez': 'VPI CUSIANA',
  'Jorge Iván Alvarado Celis': 'VPI FLOREÑA',
  'Kenia Sanchez': 'Sierracol CLM',
  'Liliana Romero': 'Administrativo Barranca',
  'Marcela Cusba Gomez': 'VPI ADMON',
  'Mirledys Garcia San Juan': 'Sierracol CRC',
  'Yolima Arenas Zarate': 'VPI CUPIAGUA'
}

// Función para obtener el cliente asignado a un administrador
export const getClientForAdmin = (adminName) => {
  return ADMIN_CLIENT_MAPPING[adminName] || null
}

// Función para validar si un administrador existe
export const isValidAdmin = (adminName) => {
  return adminName in ADMIN_CLIENT_MAPPING
}

// Lista de todos los administradores válidos
export const VALID_ADMINISTRATORS = Object.keys(ADMIN_CLIENT_MAPPING)

// Lista de todos los clientes/operaciones
export const VALID_CLIENTS = [...new Set(Object.values(ADMIN_CLIENT_MAPPING))]