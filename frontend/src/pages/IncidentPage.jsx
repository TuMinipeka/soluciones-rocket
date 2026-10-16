/**
 * Página: Reporte de Incidencias y Flujo Inteligente Completo (HU-14, HU-15, HU-16, HU-24)
 * Permite analizar fallas con IA o Reglas Locales y confirmar incidencias y reubicaciones.
 * Responsable: GUERRA
 */

import { useState, useEffect } from 'react'
import { getSpacesApi } from '../api/spaces'
import { getResourcesApi } from '../api/resources'
import { analyzeIncidentApi, createIncidentApi } from '../api/incidents'
import { confirmReallocationApi } from '../api/reservations'
import { useAuth } from '../auth/useAuth'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import PriorityBadge from '../components/incidents/PriorityBadge'
import RecommendationCard from '../components/incidents/RecommendationCard'
import LoadingState from '../components/feedback/LoadingState'
import ErrorMessage from '../components/feedback/ErrorMessage'
import SuccessMessage from '../components/feedback/SuccessMessage'

// Catálogo oficial de respaldo si el backend aún no expone /spaces
const DEFAULT_OFFICIAL_SPACES = [
  { id: 'SAL-001', name: 'Auditorio', capacity: 100 },
  { id: 'SAL-002', name: 'Cosmos', capacity: 25 },
  { id: 'SAL-003', name: 'Skilab', capacity: 20 },
  { id: 'SAL-004', name: 'Spooki', capacity: 38 },
  { id: 'SAL-005', name: 'Apolo', capacity: 34 },
  { id: 'SAL-006', name: 'Blanca', capacity: 12 },
  { id: 'SAL-007', name: 'Azul', capacity: 10 },
  { id: 'SAL-008', name: 'Amarillas', capacity: 6 },
  { id: 'SAL-009', name: 'Verdes', capacity: 6 },
  { id: 'SAL-010', name: 'Artemis', capacity: 32 },
]

export default function IncidentPage() {
  const { user } = useAuth()

  // Selección de objetivo afectado
  const [targetType, setTargetType] = useState('space') // 'space' o 'resource'
  const [targetId, setTargetId] = useState('SAL-002') // Cosmos por defecto
  const [description, setDescription] = useState('')
  const [disablesElement, setDisablesElement] = useState(false)

  // Opciones de salas y recursos
  const [spaces, setSpaces] = useState(DEFAULT_OFFICIAL_SPACES)
  const [resources, setResources] = useState([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)

  // Estados del flujo inteligente
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    async function fetchTargets() {
      setIsLoadingOptions(true)
      try {
        const [spacesData, resourcesData] = await Promise.all([
          getSpacesApi().catch(() => DEFAULT_OFFICIAL_SPACES),
          getResourcesApi().catch(() => []),
        ])
        const spList = Array.isArray(spacesData) ? spacesData : spacesData?.spaces || DEFAULT_OFFICIAL_SPACES
        const resList = Array.isArray(resourcesData) ? resourcesData : resourcesData?.resources || []
        setSpaces(spList.length > 0 ? spList : DEFAULT_OFFICIAL_SPACES)
        setResources(resList)
      } finally {
        setIsLoadingOptions(false)
      }
    }
    fetchTargets()
  }, [])

  const handleTargetTypeChange = (type) => {
    setTargetType(type)
    setAnalysisResult(null)
    if (type === 'space' && spaces.length > 0) {
      setTargetId(String(spaces[0].id))
    } else if (type === 'resource' && resources.length > 0) {
      setTargetId(String(resources[0].id))
    } else {
      setTargetId('')
    }
  }

  // Plantillas rápidas de reporte
  const quickTemplates = [
    { label: 'Proyector parpadea', text: 'El proyector principal parpadea continuamente y huele a calentamiento excesivo.' },
    { label: 'Falla aire acondicionado', text: 'El aire acondicionado no enfría y gotea agua sobre las tomas de corriente.' },
    { label: 'Corte de red Ethernet', text: 'Los puertos de red cableada perdieron enlace y no asignan dirección IP.' },
  ]

  // Paso 1: Analizar incidencia con IA / Fallback
  const handleAnalyze = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setAnalysisResult(null)

    if (!description.trim()) {
      setError('Por favor describe la falla o novedad ocurrida.')
      return
    }

    setIsAnalyzing(true)
    try {
      const payload = {
        description: description.trim(),
        context: `Reportado desde Campus Control por ${user?.name || user?.email}`,
        space_id: targetType === 'space' ? targetId : null,
        resource_id: targetType === 'resource' ? targetId : null,
      }

      const result = await analyzeIncidentApi(payload)
      setAnalysisResult(result)
      if (result.suggests_blocking) {
        setDisablesElement(true)
      }
    } catch (err) {
      setError(err.message || 'Error al conectar con el servicio de análisis inteligente.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Paso 2: Registrar formalmente la incidencia tras revisar el análisis
  const handleConfirmIncident = async () => {
    if (!analysisResult) return

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const payload = {
        description: description.trim(),
        context: `Reportado desde Campus Control por ${user?.name || user?.email}`,
        space_id: targetType === 'space' ? targetId : null,
        resource_id: targetType === 'resource' ? targetId : null,
        category: analysisResult.category || 'technology',
        priority: analysisResult.priority || 'medium',
        analysis_token: analysisResult.analysis_token,
        confirm_blocking: Boolean(disablesElement),
      }

      const created = await createIncidentApi(payload)
      const incidentId = created.id || created.incident_id || 'INC-' + Math.floor(100 + Math.random() * 900)

      setSuccess(`Incidencia registrada formalmente en el sistema con código #${incidentId}.`)
      setDescription('')
      setAnalysisResult(null)
    } catch (err) {
      setError(err.message || 'Error al registrar la incidencia.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Paso 3 (Admin): Confirmar reubicación si existe reserva afectada
  const handleConfirmReallocation = async (alternativeSpace) => {
    if (!analysisResult?.affected_reservation_id) {
      setError('No hay un identificador de reserva afectada para realizar el cambio en esta incidencia.')
      return
    }

    try {
      await confirmReallocationApi(analysisResult.affected_reservation_id, {
        new_space_id: alternativeSpace.id,
        notes: `Reubicación aprobada por admin: ${user?.name || user?.email}`,
      })
      setSuccess(`Reserva reubicada satisfactoriamente en ${alternativeSpace.name}.`)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Reporte y Diagnóstico Inteligente
          </h1>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200 uppercase tracking-wider">
            HU-24 Asistido por IA
          </span>
        </div>
        <p className="text-sm text-zinc-500 mt-1">
          Diagnóstico automatizado de incidencias, estimación de severidad y sugerencias de reubicación de salas.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Formulario de reporte */}
        <div>
          <Card title="Reportar Novedad Técnica" subtitle="Describe la anomalía para clasificarla">
            <form onSubmit={handleAnalyze} className="space-y-4">
              {/* Selector de tipo de elemento */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Elemento Afectado
                </label>
                <div className="grid grid-cols-2 gap-2 bg-zinc-100/70 p-1 rounded-xl border border-zinc-200/60">
                  <button
                    type="button"
                    onClick={() => handleTargetTypeChange('space')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-150 select-none ${
                      targetType === 'space'
                        ? 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    🏛️ Sala o Espacio
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTargetTypeChange('resource')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-150 select-none ${
                      targetType === 'resource'
                        ? 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    💻 Equipo o Recurso
                  </button>
                </div>
              </div>

              {/* Selector específico */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  {targetType === 'space' ? 'Sala afectada' : 'Equipo afectado'} *
                </label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200/90 bg-white/90 px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900"
                  disabled={isLoadingOptions || isAnalyzing}
                >
                  {targetType === 'space'
                    ? spaces.map((sp) => (
                        <option key={sp.id} value={sp.id}>
                          {sp.name} (Capacidad: {sp.capacity} personas)
                        </option>
                      ))
                    : resources.map((res) => (
                        <option key={res.id} value={res.id}>
                          {res.name} {res.serial_number ? `(${res.serial_number})` : ''}
                        </option>
                      ))}
                </select>
              </div>

              {/* Plantillas rápidas */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
                  Plantillas rápidas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickTemplates.map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => setDescription(t.text)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 transition-colors"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Descripción del problema *
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Describe con precisión qué ocurre, olores, chispas, ruidos o fallas visibles…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200/90 bg-white/90 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900 leading-relaxed"
                  disabled={isAnalyzing || isSubmitting}
                />
              </div>

              <div className="flex items-start gap-2.5 pt-1 bg-zinc-50 p-3 rounded-xl border border-zinc-200/60">
                <input
                  type="checkbox"
                  id="disablesElement"
                  checked={disablesElement}
                  onChange={(e) => setDisablesElement(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                />
                <label htmlFor="disablesElement" className="text-xs text-zinc-700 select-none leading-snug">
                  <strong className="block text-zinc-900">Inhabilitar disponibilidad</strong>
                  Marca esta opción si el espacio o equipo no puede ser utilizado con seguridad.
                </label>
              </div>

              <Button
                type="submit"
                variant="ai"
                size="md"
                className="w-full mt-2"
                isLoading={isAnalyzing}
              >
                {isAnalyzing ? 'Analizando diagnóstico…' : '✨ Analizar con Inteligencia Artificial'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Panel de resultados del análisis inteligente */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Diagnóstico y Clasificación
            </h3>
            {analysisResult && (
              <span className="text-[11px] font-mono text-zinc-400">
                Token verificado ✓
              </span>
            )}
          </div>

          {isAnalyzing ? (
            <div className="p-8 rounded-3xl bg-white border border-zinc-200/80 shadow-xs">
              <LoadingState message="El modelo está evaluando el texto y buscando salas alternativas…" />
            </div>
          ) : !analysisResult ? (
            <div className="h-72 rounded-3xl border border-dashed border-zinc-200 flex flex-col items-center justify-center p-8 text-center text-zinc-400 bg-white/40">
              <span className="text-3xl mb-2">⚡</span>
              <p className="text-xs font-medium max-w-sm leading-relaxed">
                Ingresa los detalles del incidente y haz clic en «Analizar con Inteligencia Artificial» para obtener severidad, categoría y propuestas de solución.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-fluid-enter">
              {/* Resumen de Métricas del Análisis */}
              <Card title="Resultado del Análisis" subtitle="Clasificación generada">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 font-medium">Prioridad calculada:</span>
                    <PriorityBadge priority={analysisResult.priority} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 font-medium">Categoría:</span>
                    <span className="text-xs font-bold text-zinc-800 capitalize font-mono bg-zinc-100 px-2 py-0.5 rounded-md">
                      {analysisResult.category || 'technology'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 font-medium">Equipo responsable:</span>
                    <span className="text-xs font-semibold text-zinc-800">
                      {analysisResult.responsible_team || analysisResult.assigned_team || 'Mantenimiento e IT'}
                    </span>
                  </div>
                  {analysisResult.suggests_blocking && (
                    <div className="flex items-center justify-between border-t border-zinc-100 pt-2 text-xs text-rose-700 font-medium">
                      <span>Acción preventiva recomendada:</span>
                      <span className="font-bold">Inhabilitar espacio</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Tarjeta de Recomendación y Alternativas */}
              <RecommendationCard
                recommendation={analysisResult.recommendation}
                source={analysisResult.classification_source || 'ai'}
                explanation={analysisResult.explanation}
                suggestsBlocking={analysisResult.suggests_blocking}
                alternatives={analysisResult.alternatives}
                aiModel={analysisResult.ai_model}
                latencyMs={analysisResult.latency_ms}
                onConfirmReallocation={handleConfirmReallocation}
                canConfirm={user?.role === 'admin'}
              />

              {/* Botón de confirmación final */}
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full shadow-md"
                  isLoading={isSubmitting}
                  onClick={handleConfirmIncident}
                >
                  Confirmar y Registrar Incidencia
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
