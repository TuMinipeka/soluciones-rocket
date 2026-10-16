/**
 * Módulo API para Autenticación (HU-11, HU-12, HU-21)
 * Responsable: GUERRA
 */

import { api, setStoredToken, clearStoredToken } from './client'

export async function loginApi({ email, password }) {
  const data = await api.post('/auth/login', { email, password })
  // Soporta tanto access_token estándar OAuth2 como { token, user }
  const token = data.access_token || data.token
  if (token) {
    setStoredToken(token)
  }
  return data
}

/**
 * Registro de usuarios en el campus (HU-11 / HU-21)
 * Permite seleccionar rol institucional (teacher o support).
 */
export async function registerApi({ name, email, password, role }) {
  const payload = {
    name: name?.trim(),
    email: email?.trim().toLowerCase(),
    password,
    role: role || 'teacher',
  }
  return api.post('/auth/register', payload)
}

export async function getMeApi() {
  return api.get('/auth/me')
}

export function logoutApi() {
  clearStoredToken()
}
