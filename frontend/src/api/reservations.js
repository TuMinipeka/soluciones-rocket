/**
 * Módulo API para Reservas (HU-03, HU-04, HU-05, HU-22)
 * Responsable: GUERRA
 */

import { api } from './client'

/**
 * Consulta las reservas existentes según filtros.
 * @param {Object} params - { date, space_id, user_id, status }
 */
export async function getReservationsApi(params = {}) {
  return api.get('/reservations', params)
}

/**
 * Crea una reserva de sala validada (HU-03 / HU-22).
 * @param {Object} data - { space_id, date, start_time, end_time, attendees, title, notes }
 */
export async function createReservationApi(data) {
  return api.post('/reservations', data)
}

/**
 * Modifica una reserva existente (HU-04).
 */
export async function updateReservationApi(reservationId, data) {
  return api.put(`/reservations/${reservationId}`, data)
}

/**
 * Cancela una reserva liberando el espacio (HU-04).
 */
export async function cancelReservationApi(reservationId) {
  return api.del(`/reservations/${reservationId}`)
}

/**
 * Consulta propuestas de reubicación para una reserva afectada por inhabilitación (HU-05).
 */
export async function getReallocationsApi(reservationId) {
  return api.get(`/reservations/${reservationId}/reallocations`)
}

/**
 * Confirma la reubicación en una sala alternativa (Solo Administrador, HU-05 / HU-24).
 */
export async function confirmReallocationApi(reservationId, { new_space_id, notes }) {
  return api.post(`/reservations/${reservationId}/reallocate`, {
    new_space_id,
    notes,
  })
}
