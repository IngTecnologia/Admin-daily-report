import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { validateCredentials, getUserByUsername, canAccessAdmin } from '../config/users'

const AuthContext = createContext()

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
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
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }
    
    case 'LOGIN_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      }
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      }
    
    case 'RESTORE_SESSION':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false
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

  // Restaurar sesión al cargar la aplicación
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        // Verificar que el usuario aún existe y es válido
        const currentUser = getUserByUsername(userData.username)
        if (currentUser) {
          dispatch({ type: 'RESTORE_SESSION', payload: currentUser })
        } else {
          // Usuario no válido, limpiar localStorage
          localStorage.removeItem('currentUser')
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } catch (error) {
        console.error('Error restaurando sesión:', error)
        localStorage.removeItem('currentUser')
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const login = async (username, password) => {
    dispatch({ type: 'LOGIN_START' })

    try {
      // Simular delay de red para mejor UX
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const user = validateCredentials(username, password)
      
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user))
        dispatch({ type: 'LOGIN_SUCCESS', payload: user })
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
    localStorage.removeItem('currentUser')
    dispatch({ type: 'LOGOUT' })
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const hasAdminAccess = () => {
    return canAccessAdmin(state.user)
  }

  const value = {
    ...state,
    login,
    logout,
    clearError,
    hasAdminAccess
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