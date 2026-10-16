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

export default function IncidentPage() {
  const { user } = useAuth()

  // Selección de objetivo afectado
  const [targetType, setTargetType] = useState('space') // 'space' o 'resource'
  const [targetId, setTargetId] = useState('')
  const [description, setDescription] = useState('')
  const [disablesElement, setDisablesElement] = useState(false)

  // Opciones de salas y recursos
  const [spaces, setSpaces] = useState([])
  const [resources, setResources] = useState([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)

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
          getSpacesApi(),
          getResourcesApi(),
        ])
        const spList = Array.isArray(spacesData) ? spacesData : spacesData?.spaces || []
        const resList = Array.isArray(resourcesData) ? resourcesData : resourcesData?.resources || []
        setSpaces(spList)
        setResources(resList)
        if (spList.length > 0) {
          setTargetId(String(spList[0].id))
        }
      } catch (err) {
        setError(err.message)
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
        space_id: targetType === 'space' ? Number(targetId) : null,
        resource_id: targetType === 'resource' ? Number(targetId) : null,
      }

      const result = await analyzeIncidentApi(payload)
      setAnalysisResult(result)
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

      setSuccess(`Incidencia registrada exitosamente con código #${incidentId}.`)
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
      setError('No hay un identificador de reserva afectada para realizar el cambio.')
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
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Reporte y Diagnóstico de Incidencias
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Reporta anomalías técnicas en salas o equipos y recibe clasificación asistida con IA.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulario de reporte */}
        <div>
          <Card title="Reportar Falla" subtitle="Ingresa el detalle de la situación">
            <form onSubmit={handleAnalyze} className="space-y-4">
              {/* Selector de tipo de elemento */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 mb-1.5">
                  Tipo de elemento afectado
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTargetTypeChange('space')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      targetType === 'space'
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    🏛️ Sala o Espacio
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTargetTypeChange('resource')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      targetType === 'resource'
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    💻 Equipo o Recurso
                  </button>
                </div>
              </div>

              {/* Selector específico */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 mb-1.5">
                  {targetType === 'space' ? 'Sala afectada' : 'Equipo afectado'} *
                </label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                  disabled={isLoadingOptions || isAnalyzing}
                >
                  {targetType === 'space'
                    ? spaces.map((sp) => (
                        <option key={sp.id} value={sp.id}>
                          {sp.name} (Capacidad: {sp.capacity})
                        </option>
                      ))
                    : resources.map((res) => (
                        <option key={res.id} value={res.id}>
                          {res.name} {res.serial_number ? `(${res.serial_number})` : ''}
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 mb-1.5">
                  Descripción detallada del incidente *
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Ej. El proyector de la sala Cosmos parpadea y la conexión HDMI no envía señal hacia la pantalla principal."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                  disabled={isAnalyzing || isSubmitting}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="disablesElement"
                  checked={disablesElement}
                  onChange={(e) => setDisablesElement(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                />
                <label htmlFor="disablesElement" className="text-xs text-zinc-700 select-none">
                  Inhabilita el uso temporal de este espacio/equipo
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isAnalyzing}
              >
                {isAnalyzing ? 'Analizando con IA…' : 'Analizar Incidencia'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Panel de resultados del análisis inteligente */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Diagnóstico Asistido
          </h3>

          {isAnalyzing ? (
            <LoadingState message="Procesando análisis de lenguaje natural y consultando alternativas…" />
          ) : !analysisResult ? (
            <div className="h-64 rounded-2xl border border-dashed border-zinc-200 flex flex-col items-center justify-center p-8 text-center text-zinc-400">
              <span className="text-2xl mb-2">⚡</span>
              <p className="text-xs font-medium">
                Completa el reporte y presiona «Analizar Incidencia» para obtener la categoría, severidad y recomendación de solución.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Tarjeta de clasificación */}
              <Card title="Resultado del Análisis" subtitle="Clasificación automática">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Prioridad asignada:</span>
                    <PriorityBadge priority={analysisResult.priority} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Categoría:</span>
                    <span className="text-xs font-semibold text-zinc-800 capitalize font-mono">
                      {analysisResult.category || 'Técnica'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Equipo a cargo:</span>
                    <span className="text-xs font-semibold text-zinc-800">
                      {analysisResult.assigned_team || 'Soporte Técnico'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-100 pt-2">
                    <span className="text-xs text-zinc-500">Origen del diagnóstico:</span>
                    <span className="text-[11px] font-bold text-zinc-700">
                      {analysisResult.classification_source === 'rules'
                        ? '⚙️ Reglas Locales (Fallback)'
                        : '✨ Inteligencia Artificial'}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Recomendación y reubicación */}
              <RecommendationCard
                recommendation={analysisResult.recommendation}
                source={analysisResult.classification_source || 'ai'}
                onConfirmReallocation={handleConfirmReallocation}
                canConfirm={user?.role === 'admin'}
              />

              {/* Botón de confirmación final */}
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
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
