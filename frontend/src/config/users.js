// Sistema de autenticación simple con usuarios hardcodeados
// IMPORTANTE: En producción, esto debe manejarse desde el backend con encriptación

export const USERS = [
  // Usuarios con acceso solo al formulario

  //Adriana Robayo
  {
    id: 1,
    username: 'administrador@inemec-pyc.com',
    password: 'admonpyc2025',
    fullName: 'Adriana Robayo',
    role: 'form_user',
    area: 'Consorcio P&C'
  },
  //Angela Ramirez
  {
    id: 2,
    username: 'admon.vrc@inemec.com',
    password: 'admonvrc2025',
    fullName: 'Angela Ramirez', 
    role: 'form_user',
    area: 'Confiabilidad VRC'
  },
  //Floribe Correa
  {
    id: 2,
    username: 'asistente.admonrh@inemec.com',
    password: 'admonbog2025',
    fullName: 'Floribe Correa', 
    role: 'form_user',
    area: 'Administrativo Bogota'
  },
  //Julieth Rincon
  {
    id: 3,
    username: 'administradora.sc@inemec.com',
    password: 'admoncedco2025',
    fullName: 'Julieth Rincon',
    role: 'form_user',
    area: 'Sierracol CEDCO'
  },
  //Eddinson Javier Martinez
  {
    id: 3,
    username: 'admincus.ggs@inemec.com',
    password: 'admoncus2025',
    fullName: 'Eddinson Javier Martinez',
    role: 'form_user',
    area: 'VPI CUSIANA'
  },
  //Jorge Ivan Alvarado Celis
  {
    id: 3,
    username: 'adminflo.ggs@inemec.com',
    password: 'admonflo2025',
    fullName: 'Jorge Iván Alvarado Celis',
    role: 'form_user',
    area: 'VPI FLOREÑA'
  },
  //Kenia Sanchez 
  {
    id: 3,
    username: 'admon.sierracolclm@inemec.com',
    password: 'admonclm2025',
    fullName: 'Kenia Sanchez',
    role: 'form_user',
    area: 'Sierracol CLM'
  },
  //Liliana Romero 
  {
    id: 3,
    username: 'contadora@inemec.com',
    password: 'admonbrc2025',
    fullName: 'Liliana Romero',
    role: 'form_user',
    area: 'Administrativo Barranca'
  },
  //Marcela Cusba 
  {
    id: 3,
    username: 'administrador.ggs@inemec.com',
    password: 'admonggs2025',
    fullName: 'Marcela Cusba Gomez',
    role: 'form_user',
    area: 'VPI ADMON'
  },
  //Mirledys Garcia San Juan 
  {
    id: 3,
    username: 'admonjr.sierracolcrm@inemec.com',
    password: 'admoncrc2025',
    fullName: 'Mirledys Garcia San Juan',
    role: 'form_user',
    area: 'Sierracol CRC'
  },
  //Yolima Arenas Zarate 
  {
    id: 3,
    username: 'admincup.ggs@inemec.com',
    password: 'admoncup2025',
    fullName: 'Yolima Arenas Zarate',
    role: 'form_user',
    area: 'VPI CUPIAGUA'
  },

  // Usuarios con acceso al formulario + panel admin
  //Jesús Cotes
  {
    id: 4,
    username: 'ing.tecnologia2@inemec.com',
    password: 'protec2025',
    fullName: 'Jesús David Cotes',
    role: 'admin_user',
    area: 'Nuevas Tecnologías'
  },
  //Andrés Pérez
  {
    id: 5,
    username: 'ing.tecnologia1@inemec.com',
    password: 'protec2025',
    fullName: 'Andrés Pérez',
    role: 'admin_user', 
    area: 'Nuevas Tecnologías'
  },
  //Andrés Muñoz 
  {
    id: 6,
    username: 'pro.automatizacion@inemec.com',
    password: 'proti2025',
    fullName: 'Andrés Muñoz',
    role: 'admin_user',
    area: 'TI'
  },
  //Hugo Rodriguez
  {
    id: 6,
    username: 'gte.administrativo@inemec.com',
    password: 'gteadmon2025',
    fullName: 'Hugo Rodríguez',
    role: 'admin_user',
    area: 'Gerencia Administrativa'
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