/**
 * Módulo API para Recursos y Préstamos (HU-08, HU-23)
 * Responsable: GUERRA
 */

import { api } from './client'

/**
 * Consulta la lista de inventario tecnológico y recursos autorizados.
 * @param {Object} params - { category, status, search }
 */
export async function getResourcesApi(params = {}) {
  return api.get('/resources', params)
}

/**
 * Obtiene el detalle de un equipo o recurso.
 */
export async function getResourceByIdApi(resourceId) {
  return api.get(`/resources/${resourceId}`)
}

/**
 * Registra una solicitud de préstamo de equipo (HU-08 / HU-23).
 * @param {Object} data - { resource_id, start_time, end_time, expected_return, notes }
 */
export async function requestLoanApi(data) {
  return api.post('/resources/loans', data)
}

/**
 * Consulta el historial o los préstamos activos.
 */
export async function getLoansApi(params = {}) {
  return api.get('/resources/loans', params)
}

/**
 * Registra la devolución de un equipo por parte de usuarios autorizados (HU-08 / HU-23).
 */
export async function returnLoanApi(loanId, returnData = {}) {
  return api.post(`/resources/loans/${loanId}/return`, returnData)
}

/**
 * Crea un nuevo recurso tecnológico (HU-08 / G-14).
 * Solo para administradores.
 * @param {Object} data - { id, name, category }
 */
export async function createResourceApi(data) {
  return api.post('/resources', data)
}
