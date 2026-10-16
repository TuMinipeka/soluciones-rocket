/**
 * Módulo API para Incidencias y Clasificación Inteligente (HU-14, HU-15, HU-16, HU-24)
 * Responsable: GUERRA
 */

import { api } from './client'

/**
 * Consulta la lista de incidencias registradas.
 * @param {Object} params - { status, priority, space_id, resource_id }
 */
export async function getIncidentsApi(params = {}) {
  return api.get('/incidents', params)
}

/**
 * Envía la descripción de un incidente para su análisis inteligente (HU-15 / HU-16 / HU-24).
 * Devuelve categoría, prioridad, equipo responsable, recomendación y classification_source ('ai' o 'rules').
 * @param {Object} data - { description, space_id, resource_id }
 */
export async function analyzeIncidentApi(data) {
  return api.post('/incidents/analyze', data)
}

/**
 * Registra formalmente una incidencia en el sistema tras revisión (HU-14 / HU-24).
 * @param {Object} data - { description, space_id, resource_id, category, priority, recommendation, classification_source, disables_space, disables_resource }
 */
export async function createIncidentApi(data) {
  return api.post('/incidents', data)
}

/**
 * Actualiza el estado o resolución de una incidencia (HU-14).
 */
export async function updateIncidentApi(incidentId, data) {
  return api.patch(`/incidents/${incidentId}`, data)
}

/**
 * Resuelve una incidencia restaurando la disponibilidad (HU-14 / auth_incidents.md).
 * Solo permitido para rol support o admin.
 */
export async function resolveIncidentApi(incidentId) {
  return api.post(`/incidents/${incidentId}/resolve`)
}
