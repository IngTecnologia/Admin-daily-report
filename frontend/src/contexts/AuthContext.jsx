import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { validateCredentials, getUserByUsername, canAccessAdmin } from '../config/users'

const AuthContext = createContext()

// Constantes para gestión de sesión
const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8 horas en milisegundos
const TOKEN_KEY = 'auth_token'
const USER_KEY = 'current_user'
const TIMESTAMP_KEY = 'session_timestamp'

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

  // Función para generar token de sesión
  const generateToken = () => {
    return `token_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }

  // Función para verificar si la sesión ha expirado
  const isSessionExpired = () => {
    const timestamp = localStorage.getItem(TIMESTAMP_KEY)
    if (!timestamp) return true
    
    const sessionStart = parseInt(timestamp)
    const currentTime = Date.now()
    return (currentTime - sessionStart) > SESSION_DURATION
  }

  // Función para limpiar datos de sesión
  const clearSessionData = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(TIMESTAMP_KEY)
  }

  // Función para verificar sesión al cargar
  const checkSessionValidity = () => {
    const token = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)
    const timestamp = localStorage.getItem(TIMESTAMP_KEY)

    if (!token || !storedUser || !timestamp || isSessionExpired()) {
      clearSessionData()
      dispatch({ type: 'SET_LOADING', payload: false })
      return false
    }

    try {
      const userData = JSON.parse(storedUser)
      const currentUser = getUserByUsername(userData.username)
      
      if (currentUser) {
        const expiry = new Date(parseInt(timestamp) + SESSION_DURATION)
        dispatch({ 
          type: 'RESTORE_SESSION', 
          payload: { user: currentUser, expiry }
        })
        return true
      } else {
        clearSessionData()
        dispatch({ type: 'SET_LOADING', payload: false })
        return false
      }
    } catch (error) {
      console.error('Error restaurando sesión:', error)
      clearSessionData()
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
      // Simular delay de red para mejor UX
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const user = validateCredentials(username, password)
      
      if (user) {
        // Generar token y timestamp de sesión
        const token = generateToken()
        const timestamp = Date.now()
        const expiry = new Date(timestamp + SESSION_DURATION)
        
        // Guardar en localStorage
        localStorage.setItem(TOKEN_KEY, token)
        localStorage.setItem(USER_KEY, JSON.stringify(user))
        localStorage.setItem(TIMESTAMP_KEY, timestamp.toString())
        
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
      const errorMessage = 'Error de conexión. Intente nuevamente.'
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage })
      return { success: false, error: errorMessage }
    }
  }

  const logout = () => {
    clearSessionData()
    dispatch({ type: 'LOGOUT' })
  }

  const forceLogout = () => {
    clearSessionData()
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
    
    // Verificar que el usuario aún existe y tiene permisos
    const currentUser = getUserByUsername(state.user.username)
    if (!currentUser) {
      forceLogout()
      return false
    }
    
    return canAccessAdmin(currentUser)
  }

  const getSessionInfo = () => {
    const timestamp = localStorage.getItem(TIMESTAMP_KEY)
    if (!timestamp) return null
    
    const startTime = parseInt(timestamp)
    const currentTime = Date.now()
    const timeLeft = SESSION_DURATION - (currentTime - startTime)
    
    return {
      startTime: new Date(startTime),
      expiresAt: new Date(startTime + SESSION_DURATION),
      timeLeft: Math.max(0, timeLeft),
      isExpired: timeLeft <= 0
    }
  }

  const extendSession = () => {
    if (state.isAuthenticated && !isSessionExpired()) {
      const newTimestamp = Date.now()
      localStorage.setItem(TIMESTAMP_KEY, newTimestamp.toString())
      
      const expiry = new Date(newTimestamp + SESSION_DURATION)
      dispatch({ 
        type: 'RESTORE_SESSION', 
        payload: { user: state.user, expiry }
      })
      return true
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