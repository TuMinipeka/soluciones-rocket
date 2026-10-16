/**
 * Contexto de Autenticación y Sesión de Campuslands (HU-11, HU-12, HU-21)
 * Responsable: GUERRA
 */

import { createContext, useState, useEffect, useCallback } from 'react'
import {
  loginApi,
  registerApi,
  getMeApi,
  logoutApi,
} from '../api/auth'
import { getStoredToken, onUnauthorized } from '../api/client'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => getStoredToken())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const clearSession = useCallback(() => {
    logoutApi()
    setToken(null)
    setUser(null)
  }, [])

  // Inicializar estado a partir de token almacenado
  const refreshProfile = useCallback(async () => {
    const currentToken = getStoredToken()
    if (!currentToken) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const userData = await getMeApi()
      setUser(userData)
      setToken(currentToken)
      setError(null)
    } catch (err) {
      // Si el token es inválido o expiró
      clearSession()
      if (err.status !== 401) {
        setError(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [clearSession])

  useEffect(() => {
    refreshProfile()

    // Escuchar eventos globales de 401 disparados por el cliente HTTP
    const unsubscribe = onUnauthorized(() => {
      clearSession()
    })

    return () => unsubscribe()
  }, [refreshProfile, clearSession])

  const login = async ({ email, password }) => {
    setError(null)
    setIsLoading(true)
    try {
      const response = await loginApi({ email, password })
      const newToken = response.access_token || response.token
      setToken(newToken)
      // Si la respuesta ya incluye los datos del usuario, los usamos; si no, consultamos /auth/me
      if (response.user) {
        setUser(response.user)
      } else {
        const userData = await getMeApi()
        setUser(userData)
      }
      return response
    } catch (err) {
      setError(err.message || 'Credenciales inválidas')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const register = async ({ name, email, password, role }) => {
    setError(null)
    setIsLoading(true)
    try {
      const result = await registerApi({ name, email, password, role })
      // Tras el registro, intentar login directo si el backend no entrega token automático
      try {
        await login({ email, password })
      } catch {
        // Registro exitoso aunque requiera login manual
      }
      return result
    } catch (err) {
      setError(err.message || 'Error al crear la cuenta')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    clearSession()
  }

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    error,
    login,
    register,
    logout,
    refreshProfile,
    clearError: () => setError(null),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
