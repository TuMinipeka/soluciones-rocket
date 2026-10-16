/** Recomendaciones calculadas por el backend sobre salas persistidas. */
import { api } from './client'

export async function getSpaceRecommendationApi(params) {
  return api.post('/spaces/recommend', params)
}
