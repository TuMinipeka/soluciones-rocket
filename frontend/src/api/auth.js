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
 * Registro público de usuarios (HU-11 / HU-21)
 * Regla estricta: No se envía ningún rol desde el cliente. El backend asigna teacher.
 */
export async function registerApi({ name, email, password }) {
  const payload = {
    name: name?.trim(),
    email: email?.trim().toLowerCase(),
    password,
  }
  return api.post('/auth/register', payload)
}

export async function getMeApi() {
  return api.get('/auth/me')
}

export function logoutApi() {
  clearStoredToken()
}
