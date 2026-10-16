/**
 * Página: Visualización de Incidencias y Recomendaciones (HU-20)
 * Área: MAFE (consumidor de api/incidents.js y api/reservations.js preparados por GUERRA).
 */

import { useState, useEffect } from 'react'
import { getIncidentsApi } from '../api/incidents'
import { confirmReallocationApi } from '../api/reservations'
import { useAuth } from '../auth/useAuth'
import IncidentCard from '../components/incidents/IncidentCard'
import RecommendationCard from '../components/incidents/RecommendationCard'
import LoadingState from '../components/feedback/LoadingState'
import ErrorMessage from '../components/feedback/ErrorMessage'
import SuccessMessage from '../components/feedback/SuccessMessage'
import EmptyState from '../components/feedback/EmptyState'
import Card from '../components/ui/Card'

export default function IncidentsListPage() {
  const { user } = useAuth()
  const [incidents, setIncidents] = useState([])
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const loadIncidents = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getIncidentsApi()
      const list = Array.isArray(data) ? data : data?.incidents || []
      setIncidents(list)
      if (list.length > 0 && !selectedIncident) {
        setSelectedIncident(list[0])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadIncidents()
  }, [])

  const handleConfirmReallocation = async (alternativeSpace) => {
    if (!selectedIncident?.affected_reservation_id) {
      setError('La incidencia no tiene una reserva asociada para reubicar.')
      return
    }

    try {
      await confirmReallocationApi(selectedIncident.affected_reservation_id, {
        new_space_id: alternativeSpace.id,
        notes: `Reubicación confirmada por administrador ${user?.name || user?.email}`,
      })
      setSuccess(`Reserva reubicada exitosamente en la sala ${alternativeSpace.name}.`)
      loadIncidents()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Historial de Incidencias y Resoluciones
        </h1>
        <p className="text-sm text-[#a1a1a6] mt-1">
          Seguimiento de fallas reportadas, recomendaciones generadas y alternativas de reubicación.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess(null)} />}

      {isLoading ? (
        <LoadingState message="Cargando incidencias registradas…" />
      ) : incidents.length === 0 ? (
        <EmptyState
          title="No hay incidencias reportadas"
          description="Todas las instalaciones y equipos operan con normalidad."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de incidentes */}
          <div className="space-y-3 lg:col-span-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#a1a1a6]">
              Reportes activos ({incidents.length})
            </h3>
            <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
              {incidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  onSelect={setSelectedIncident}
                />
              ))}
            </div>
          </div>

          {/* Detalle y recomendaciones */}
          <div className="lg:col-span-2 space-y-4">
            {selectedIncident ? (
              <>
                <Card
                  title={`Incidencia #${selectedIncident.id}: ${selectedIncident.title || 'Detalle'}`}
                  subtitle={`Estado: ${selectedIncident.status || 'abierta'}`}
                >
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#a1a1a6] block mb-1">
                        Descripción reportada:
                      </span>
                      <p className="text-[#f5f5f7] bg-[#2c2c2e] p-3 rounded-xl border border-white/[0.08]">
                        {selectedIncident.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-white/[0.06]">
                      <div>
                        <span className="text-[#8d90a0] block">Elemento afectado:</span>
                        <span className="font-semibold text-white">
                          {selectedIncident.space_name || selectedIncident.resource_name || 'No especificado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#8d90a0] block">Reportado por:</span>
                        <span className="font-semibold text-white">
                          {selectedIncident.reported_by || 'Docente'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Tarjeta de recomendación inteligente */}
                {selectedIncident.recommendation && (
                  <RecommendationCard
                    recommendation={selectedIncident.recommendation}
                    source={selectedIncident.classification_source || 'ai'}
                    isConfirmed={selectedIncident.is_reallocated}
                    onConfirmReallocation={handleConfirmReallocation}
                    canConfirm={user?.role === 'admin'}
                  />
                )}
              </>
            ) : (
              <div className="h-48 flex items-center justify-center p-8 rounded-2xl border border-dashed border-zinc-200 text-xs text-zinc-400">
                Selecciona una incidencia para ver su diagnóstico y recomendaciones.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
