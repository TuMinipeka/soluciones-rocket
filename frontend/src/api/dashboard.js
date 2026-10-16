/**
 * Módulo API para Dashboard Operativo (HU-19)
 * Consumido por Mafe.
 * Responsable: GUERRA
 */

import { api } from './client'

/**
 * Consulta los indicadores operativos consolidados del campus:
 * - Espacios disponibles y ocupados
 * - Préstamos activos y recursos inhabilitados
 * - Incidencias abiertas y en proceso
 * @param {Object} params - { date, time_slot }
 */
export async function getDashboardSummaryApi(params = {}) {
  return api.get('/dashboard/summary', params)
}
