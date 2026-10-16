/**
 * Módulo API para Espacios y Disponibilidad (HU-02, HU-18)
 * Consumido por Mafe (Mapa de salas) y Guerra (Formulario de reservas).
 * Responsable: GUERRA
 */

import { api } from './client'

/**
 * Consulta la disponibilidad de las 10 salas del campus.
 * @param {Object} params - { date, start_time, end_time }
 */
export async function getSpacesApi(params = {}) {
  return api.get('/spaces', params)
}

/**
 * Obtiene el detalle de una sala individual.
 * @param {string|number} spaceId
 */
export async function getSpaceByIdApi(spaceId) {
  return api.get(`/spaces/${spaceId}`)
}

export async function getSpaceReservationsApi(spaceId, date) {
  return api.get(`/spaces/${spaceId}/reservations`, { date })
}
