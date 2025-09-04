// Sistema de autenticación simple con usuarios hardcodeados
// IMPORTANTE: En producción, esto debe manejarse desde el backend con encriptación

export const USERS = [
  // Usuarios con acceso solo al formulario
  {
    id: 1,
    username: 'admin.campo1',
    password: 'campo123',
    fullName: 'Administrador Campo 1',
    role: 'form_user',
    area: 'Campo Cusiana'
  },
  {
    id: 2,
    username: 'admin.campo2',
    password: 'campo456',
    fullName: 'Administrador Campo 2', 
    role: 'form_user',
    area: 'Campo Cupiagua'
  },
  {
    id: 3,
    username: 'supervisor.floreña',
    password: 'flor789',
    fullName: 'Supervisor Floreña',
    role: 'form_user',
    area: 'Campo Floreña'
  },

  // Usuarios con acceso al formulario + panel admin
  {
    id: 4,
    username: 'admin.general',
    password: 'admin2024',
    fullName: 'Administrador General',
    role: 'admin_user',
    area: 'Administración General'
  },
  {
    id: 5,
    username: 'gerente.operaciones',
    password: 'gerente2024',
    fullName: 'Gerente de Operaciones',
    role: 'admin_user', 
    area: 'Gerencia'
  },
  {
    id: 6,
    username: 'jefe.reportes',
    password: 'reportes2024',
    fullName: 'Jefe de Reportes',
    role: 'admin_user',
    area: 'Análisis y Reportes'
  }
]

export const USER_ROLES = {
  FORM_USER: 'form_user',      // Solo puede llenar formularios
  ADMIN_USER: 'admin_user'     // Puede llenar formularios Y acceder al panel admin
}

export const validateCredentials = (username, password) => {
  const user = USERS.find(u => u.username === username && u.password === password)
  
  if (user) {
    // No devolver la contraseña por seguridad
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }
  
  return null
}

export const getUserByUsername = (username) => {
  const user = USERS.find(u => u.username === username)
  if (user) {
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }
  return null
}

export const canAccessAdmin = (user) => {
  return user && user.role === USER_ROLES.ADMIN_USER
}