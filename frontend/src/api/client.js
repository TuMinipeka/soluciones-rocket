/**
 * Cliente HTTP base para Campuslands Operations
 * Maneja JWT, interceptación de 401, timeout y normalización de errores.
 * Responsable: GUERRA
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'campus_auth_token'

// Evento para desautenticar si el backend responde 401
const UNAUTHORIZED_EVENT = 'campus_auth_unauthorized'

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function onUnauthorized(callback) {
  window.addEventListener(UNAUTHORIZED_EVENT, callback)
  return () => window.removeEventListener(UNAUTHORIZED_EVENT, callback)
}

/**
 * Normaliza mensajes de error desde FastAPI HTTPException ({ detail: ... })
 * o fallos genéricos de red.
 */
function normalizeError(errorData, status) {
  if (!errorData) {
    return status === 401
      ? 'Sesión expirada o credenciales inválidas'
      : status === 403
      ? 'No tienes permisos para realizar esta acción'
      : status === 404
      ? 'El recurso solicitado no fue encontrado'
      : status === 409
      ? 'Conflicto con una reserva o recurso existente'
      : 'Error de comunicación con el servidor'
  }

  // Formato estándar de errores del backend (Diego / auth_incidents.md):
  // { "error": { "code": "...", "message": "...", "details": [...] } }
  if (errorData.error) {
    if (Array.isArray(errorData.error.details) && errorData.error.details.length > 0) {
      return errorData.error.details
        .map((d) => d.message || `${d.field}: ${d.type}`)
        .join(', ')
    }
    if (typeof errorData.error.message === 'string') {
      return errorData.error.message
    }
    if (typeof errorData.error === 'string') {
      return errorData.error
    }
  }

  if (typeof errorData.detail === 'string') {
    return errorData.detail
  }

  if (Array.isArray(errorData.detail)) {
    // Errores de validación Pydantic
    return errorData.detail.map((err) => `${err.loc?.join('.') || 'Campo'}: ${err.msg}`).join(', ')
  }

  if (errorData.message) {
    return errorData.message
  }

  return 'Ocurrió un error inesperado al procesar la solicitud'
}

export async function apiClient(endpoint, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    params,
    ...customConfig
  } = options

  const token = getStoredToken()

  // Construir query string si hay params
  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val))
      }
    })
    const qs = searchParams.toString()
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs
    }
  }

  const defaultHeaders = {
    'Accept': 'application/json',
  }

  if (body && !(body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json'
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  const config = {
    method,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    ...customConfig,
  }

  if (body) {
    config.body = body instanceof FormData ? body : JSON.stringify(body)
  }

  try {
    const response = await fetch(url, config)

    // Manejo de 401: Sesión expirada o token inválido
    if (response.status === 401) {
      clearStoredToken()
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: { endpoint } }))
      let errBody = null
      try {
        errBody = await response.json()
      } catch {
        // no-op
      }
      const message = normalizeError(errBody, 401)
      const error = new Error(message)
      error.status = 401
      error.code = errBody?.error?.code || 'UNAUTHORIZED'
      error.data = errBody
      throw error
    }

    // Si la respuesta no tiene contenido (204 No Content)
    if (response.status === 204) {
      return null
    }

    const contentType = response.headers.get('content-type')
    const isJson = contentType && contentType.includes('application/json')
    const data = isJson ? await response.json() : await response.text()

    if (!response.ok) {
      const message = normalizeError(data, response.status)
      const error = new Error(message)
      error.status = response.status
      error.code = data?.error?.code || 'HTTP_ERROR'
      error.data = data
      throw error
    }

    return data
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const netError = new Error('No fue posible conectar con el servidor. Revisa tu conexión.')
      netError.status = 0
      netError.code = 'NETWORK_ERROR'
      throw netError
    }
    throw err
  }
}

export const api = {
  get: (endpoint, params, options = {}) => apiClient(endpoint, { ...options, method: 'GET', params }),
  post: (endpoint, body, options = {}) => apiClient(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => apiClient(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options = {}) => apiClient(endpoint, { ...options, method: 'PATCH', body }),
  del: (endpoint, options = {}) => apiClient(endpoint, { ...options, method: 'DELETE', ...options }),
}
