import React, { createContext, useContext, useReducer, useEffect } from 'react'
import authService from '../services/authService'

const AuthContext = createContext()

// Constantes para gestión de sesión
const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8 horas en milisegundos

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  sessionExpiry: null
}

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null
      }
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        sessionExpiry: action.payload.expiry
      }
    
    case 'LOGIN_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        sessionExpiry: null
      }
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        sessionExpiry: null
      }
    
    case 'RESTORE_SESSION':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        sessionExpiry: action.payload.expiry
      }
    
    case 'SESSION_EXPIRED':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
        sessionExpiry: null
      }
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }
    
    default:
      return state
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Función para verificar si el usuario tiene rol admin
  const isAdmin = (user) => {
    return user && (user.role === 'admin' || user.role === 'supervisor')
  }

  // Función para verificar si la sesión ha expirado
  const isSessionExpired = () => {
    // Con JWT, la expiración se maneja en el backend
    const token = authService.getToken()
    return !token
  }

  // Función para limpiar datos de sesión
  const clearSessionData = async () => {
    await authService.logout()
  }

  // Función para verificar sesión al cargar
  const checkSessionValidity = async () => {
    const token = authService.getToken()
    const storedUser = authService.getCurrentUser()

    if (!token || !storedUser) {
      dispatch({ type: 'SET_LOADING', payload: false })
      return false
    }

    try {
      // Verificar que el token siga siendo válido
      const isValid = await authService.verifyToken()

      if (isValid && storedUser) {
        const expiry = new Date(Date.now() + SESSION_DURATION)
        dispatch({
          type: 'RESTORE_SESSION',
          payload: { user: storedUser, expiry }
        })
        return true
      } else {
        await clearSessionData()
        dispatch({ type: 'SET_LOADING', payload: false })
        return false
      }
    } catch (error) {
      console.error('Error restaurando sesión:', error)
      await clearSessionData()
      dispatch({ type: 'SET_LOADING', payload: false })
      return false
    }
  }

  // Restaurar sesión al cargar la aplicación
  useEffect(() => {
    checkSessionValidity()
  }, [])

  // Verificar expiración de sesión cada minuto
  useEffect(() => {
    if (!state.isAuthenticated) return

    const interval = setInterval(() => {
      if (isSessionExpired()) {
        dispatch({ type: 'SESSION_EXPIRED' })
        clearSessionData()
      }
    }, 60000) // Verificar cada minuto

    return () => clearInterval(interval)
  }, [state.isAuthenticated])

  const login = async (username, password) => {
    dispatch({ type: 'LOGIN_START' })

    try {
      // Llamar al servicio de autenticación backend
      const user = await authService.login(username, password)

      if (user) {
        const expiry = new Date(Date.now() + SESSION_DURATION)

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, expiry }
        })
        return { success: true, user }
      } else {
        const errorMessage = 'Usuario o contraseña incorrectos'
        dispatch({ type: 'LOGIN_ERROR', payload: errorMessage })
        return { success: false, error: errorMessage }
      }
    } catch (error) {
      const errorMessage = error.message || 'Error de conexión. Intente nuevamente.'
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage })
      return { success: false, error: errorMessage }
    }
  }

  const logout = async () => {
    await clearSessionData()
    dispatch({ type: 'LOGOUT' })
  }

  const forceLogout = async () => {
    await clearSessionData()
    dispatch({ type: 'SESSION_EXPIRED' })
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const hasAdminAccess = () => {
    // Revalidar los permisos cada vez que se llama
    if (!state.user || !state.isAuthenticated) return false

    // Verificar que la sesión no haya expirado
    if (isSessionExpired()) {
      forceLogout()
      return false
    }

    return isAdmin(state.user)
  }

  const getSessionInfo = () => {
    const token = authService.getToken()
    if (!token || !state.sessionExpiry) return null

    const currentTime = Date.now()
    const expiryTime = new Date(state.sessionExpiry).getTime()
    const timeLeft = expiryTime - currentTime

    return {
      startTime: new Date(expiryTime - SESSION_DURATION),
      expiresAt: new Date(expiryTime),
      timeLeft: Math.max(0, timeLeft),
      isExpired: timeLeft <= 0
    }
  }

  const extendSession = async () => {
    if (state.isAuthenticated && !isSessionExpired()) {
      try {
        // Renovar token con el backend
        await authService.refreshToken()

        const expiry = new Date(Date.now() + SESSION_DURATION)
        dispatch({
          type: 'RESTORE_SESSION',
          payload: { user: state.user, expiry }
        })
        return true
      } catch (error) {
        console.error('Error extending session:', error)
        return false
      }
    }
    return false
  }

  const value = {
    ...state,
    login,
    logout,
    forceLogout,
    clearError,
    hasAdminAccess,
    getSessionInfo,
    extendSession,
    isSessionExpired
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}

export default AuthContext