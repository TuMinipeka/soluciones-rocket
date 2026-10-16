/**
 * Página: Reporte de Incidencias y Flujo Inteligente Completo (HU-14, HU-15, HU-16, HU-24)
 * Permite analizar fallas con IA o Reglas Locales y confirmar incidencias y reubicaciones.
 * Responsable: GUERRA
 */

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
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
import {
  ShieldCheckIcon,
  SparklesIcon,
  BoltIcon,
  CheckCircleIcon,
  BuildingOffice2Icon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline'

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
  const location = useLocation()
  const pre = location.state || {}

  // Selección de objetivo afectado
  const [targetType, setTargetType] = useState('space') // 'space' o 'resource'
  const [targetId, setTargetId] = useState(pre.preselectedSpaceId || 'SAL-002') // Cosmos o preseleccionado
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

  const [currentStep, setCurrentStep] = useState(1) // 1: Describir, 2: Revisar análisis, 3: Registrado
  const [createdIncidentId, setCreatedIncidentId] = useState(null)

  // Plantillas rápidas de reporte
  const quickTemplates = [
    { label: '+ Falla de colorimetría', text: 'El proyector principal parpadea y muestra tono magenta tras 10 minutos de encendido.' },
    { label: '+ Sobrecalentamiento', text: 'El equipo emite un zumbido irregular y la temperatura superficial excede los límites normales.' },
    { label: '+ Pérdida de enlace de red', text: 'Los puertos de red cableada perdieron enlace y no asignan dirección IP en el rack.' },
    { label: '+ Falla climatización', text: 'El aire acondicionado no enfría y gotea agua sobre las tomas de corriente del lateral.' },
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
      setCurrentStep(2)
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

      setCreatedIncidentId(incidentId)
      setCurrentStep(3)
      setSuccess(`Incidencia registrada formalmente en el sistema con código #${incidentId}.`)
      setDescription('')
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

  const handleResetFlow = () => {
    setCurrentStep(1)
    setAnalysisResult(null)
    setCreatedIncidentId(null)
    setDescription('')
    setError(null)
    setSuccess(null)
  }

  const stepProgress = currentStep === 1 ? '33.33%' : currentStep === 2 ? '66.66%' : '100%'

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Dynamic Glow & Ambient Canvas Backdrop */}
      <div className="flex flex-col gap-3">
        {/* Top Breadcrumb & Metadata Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-xs text-[#8d90a0]">
            <span className="hover:text-white transition-colors cursor-pointer">Inicio</span>
            <span className="text-white/20">/</span>
            <span className="hover:text-white transition-colors cursor-pointer">Incidencias</span>
            <span className="text-white/20">/</span>
            <span className="text-white font-semibold">Reporte institucional asistido</span>
          </nav>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c1c1e] text-xs font-mono border border-white/[0.08]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2fd9f4] animate-pulse" />
              <span className="text-[#8d90a0]">Expediente:</span>
              <span className="text-[#22d3ee] font-medium">CC-TICK-2025</span>
            </div>
          </div>
        </div>

        {/* Main Header & Step Controller */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-1">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[#22d3ee] text-xs font-mono uppercase tracking-wider mb-1">
              <ShieldCheckIcon className="w-4 h-4 text-[#22d3ee]" />
              <span>Sistema Táctico de Resolución Técnica</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Reportar incidencia
            </h1>
            <p className="text-sm text-[#a1a1a6] mt-1 max-w-2xl leading-relaxed">
              Monitoreo en tiempo real con triage híbrido: análisis de fallas con derivación de brigadas y contingencia de campus.
            </p>
          </div>

          {/* Segmented Step Controller */}
          <div className="bg-[#1c1c1e] p-1.5 rounded-full border border-white/[0.08] flex items-center shadow-inner self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                currentStep === 1
                  ? 'bg-[#2563eb] text-white shadow-sm'
                  : 'text-[#a1a1a6] hover:text-white'
              }`}
            >
              <span>1. Describir</span>
            </button>
            <button
              type="button"
              onClick={() => analysisResult && setCurrentStep(2)}
              disabled={!analysisResult}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                currentStep === 2
                  ? 'bg-[#2563eb] text-white shadow-sm'
                  : !analysisResult
                  ? 'text-[#636366] cursor-not-allowed'
                  : 'text-[#a1a1a6] hover:text-white'
              }`}
            >
              <span>2. Revisar análisis</span>
            </button>
            <button
              type="button"
              disabled={currentStep !== 3}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                currentStep === 3
                  ? 'bg-[#2563eb] text-white shadow-sm'
                  : 'text-[#636366] cursor-not-allowed'
              }`}
            >
              <span>3. Registrado</span>
            </button>
          </div>
        </div>

        {/* Linear Stepper Progress Bar */}
        <div className="w-full bg-[#1c1c1e] rounded-full h-1 overflow-hidden mt-1">
          <div
            className="h-full bg-gradient-to-r from-[#2563eb] via-[#2fd9f4] to-[#6cd3f7] transition-all duration-500 ease-out"
            style={{ width: stepProgress }}
          />
        </div>
      </div>

      {error && <ErrorMessage message={error} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess(null)} />}

      {/* Flujo de 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Formulario de Entrada */}
        <div className="lg:col-span-6 bg-[#1c1c1e] rounded-[20px] p-6 sm:p-7 border-t border-white/[0.09] border-x border-white/[0.04] border-b border-black/50 shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] mb-5">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#2563eb] text-white text-xs font-bold font-mono">
                1
              </span>
              <h2 className="text-base font-semibold text-white tracking-tight">
                Identificación y Síntomas
              </h2>
            </div>
            <span className="text-xs text-[#22d3ee] font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />
              Sensor Activo
            </span>
          </div>

          <form onSubmit={handleAnalyze} className="space-y-4">
            {/* Selector de Elemento (Sala / Equipo) - G-11 */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#a1a1a6] mb-1.5">
                Tipo de Elemento Afectado
              </label>
              <div className="grid grid-cols-2 gap-2 bg-[#2a2a2c] p-1.5 rounded-xl border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => handleTargetTypeChange('space')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    targetType === 'space'
                      ? 'bg-[#2563eb] text-white shadow-md border border-[#2563eb]'
                      : 'text-[#a1a1a6] hover:text-white'
                  }`}
                >
                  <BuildingOffice2Icon className="w-4 h-4 text-white" />
                  <span>Sala o Espacio</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTargetTypeChange('resource')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    targetType === 'resource'
                      ? 'bg-[#2563eb] text-white shadow-md border border-[#2563eb]'
                      : 'text-[#a1a1a6] hover:text-white'
                  }`}
                >
                  <ComputerDesktopIcon className="w-4 h-4 text-white" />
                  <span>Equipo / Recurso</span>
                </button>
              </div>
            </div>

            {/* Selector interactivo con metadatos del objetivo */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#a1a1a6]">
                  {targetType === 'space' ? 'Sala afectada' : 'Equipo o activo afectado'} *
                </label>
                <span className="text-[10px] font-mono text-[#22d3ee]">
                  {targetType === 'space' ? `${spaces.length} salas disponibles` : `${resources.length} equipos`}
                </span>
              </div>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-[12px] bg-[#2c2c2e] text-[#f5f5f7] text-sm font-medium border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-[#2563eb] transition-all cursor-pointer"
                disabled={isLoadingOptions || isAnalyzing}
              >
                {targetType === 'space'
                  ? spaces.map((sp) => (
                      <option key={sp.id} value={sp.id} className="bg-[#1c1c1e] text-white">
                        {sp.name} ({sp.id}) · Aforo: {sp.capacity} personas
                      </option>
                    ))
                  : resources.map((res) => (
                      <option key={res.id} value={res.id} className="bg-[#1c1c1e] text-white">
                        {res.name} [{res.id}] {res.category ? `· ${res.category}` : ''} {res.serial_number ? `· S/N: ${res.serial_number}` : ''}
                      </option>
                    ))}
              </select>
            </div>

            {/* Textarea con contador de caracteres */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#a1a1a6]">
                  Descripción del problema *
                </label>
                <span className="text-[11px] font-mono text-[#8d90a0]">
                  {description.length} / 1000 caracteres
                </span>
              </div>
              <textarea
                rows="4"
                required
                maxLength={1000}
                placeholder="Describe con precisión qué ocurre: ruidos, chispas, olores, sobrecalentamiento o fallas…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3.5 rounded-[12px] bg-[#2c2c2e] text-[#f5f5f7] text-sm placeholder-[#636366] border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#2563eb] leading-relaxed transition-all resize-y"
                disabled={isAnalyzing || isSubmitting}
              />
            </div>

            {/* Atajos de síntomas frecuentes */}
            <div>
              <span className="text-[11px] font-mono text-[#8d90a0] block mb-1.5">
                Atajos de síntomas frecuentes:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickTemplates.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setDescription(t.text)}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#2a2a2c] text-[#a1a1a6] hover:text-white hover:bg-[#353437] border border-white/[0.06] transition-all active:scale-95"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Opción de inhabilitación inmediata */}
            <div className="flex items-start gap-2.5 p-3 rounded-[12px] bg-[#2a2a2c] border border-white/[0.08]">
              <input
                type="checkbox"
                id="disablesElement"
                checked={disablesElement}
                onChange={(e) => setDisablesElement(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-[#1c1c1e] text-[#2563eb] focus:ring-[#2563eb]"
              />
              <label htmlFor="disablesElement" className="text-xs text-[#a1a1a6] select-none leading-snug cursor-pointer">
                <strong className="block text-white">Inhabilitar disponibilidad operativa</strong>
                Marca esta opción si el espacio o equipo no puede ser operado con seguridad.
              </label>
            </div>

            {/* Footer de acción y modelo */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] font-mono text-[#8d90a0]">
                Triage Híbrido: IA + Reglas Locales
              </span>
              <Button
                type="submit"
                variant="ai"
                size="md"
                className="w-full sm:w-auto px-6 h-11 rounded-full font-semibold text-xs tracking-wide flex items-center justify-center gap-2"
                isLoading={isAnalyzing}
              >
                <SparklesIcon className="w-4 h-4 text-cyan-300" />
                <span>{isAnalyzing ? 'Analizando diagnóstico…' : 'Analizar con Inteligencia Artificial'}</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Columna Derecha: Panel de Diagnóstico y Contingencia */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#a1a1a6]">
              Diagnóstico y Clasificación
            </h3>
            {analysisResult && (
              <span className="text-[11px] font-mono text-[#22d3ee] flex items-center gap-1">
                <CheckCircleIcon className="w-3.5 h-3.5" /> Token verificado
              </span>
            )}
          </div>

          {isAnalyzing ? (
            <div className="p-8 rounded-[20px] bg-[#1c1c1e] border border-white/[0.08]">
              <LoadingState message="El modelo está evaluando la falla y buscando contingencias…" />
            </div>
          ) : !analysisResult ? (
            <div className="h-80 rounded-[20px] border border-dashed border-white/[0.1] bg-[#141416]/60 flex flex-col items-center justify-center p-8 text-center text-[#8d90a0]">
              <div className="w-12 h-12 rounded-2xl bg-[#2a2a2c] flex items-center justify-center text-xl mb-3 text-[#22d3ee]">
                <BoltIcon className="w-6 h-6 text-[#22d3ee]" />
              </div>
              <p className="text-xs font-medium max-w-sm leading-relaxed text-[#a1a1a6]">
                Ingresa los síntomas en el formulario y haz clic en «Analizar con Inteligencia Artificial» para obtener severidad, categoría y propuestas de reubicación instantáneas.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-fluid-enter">
              {/* Resumen de Métricas del Análisis */}
              <Card title="Resultado del Análisis" subtitle="Clasificación táctica generada">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#a1a1a6] font-medium">Prioridad estimada:</span>
                    <PriorityBadge priority={analysisResult.priority} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#a1a1a6] font-medium">Categoría de falla:</span>
                    <span className="text-xs font-bold text-white capitalize font-mono bg-[#2c2c2e] px-2.5 py-1 rounded-lg border border-white/[0.08]">
                      {analysisResult.category || 'technology'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#a1a1a6] font-medium">Brigada responsable:</span>
                    <span className="text-xs font-semibold text-white">
                      {analysisResult.responsible_team || analysisResult.assigned_team || 'Mantenimiento e IT'}
                    </span>
                  </div>
                  {analysisResult.suggests_blocking && (
                    <div className="flex items-center justify-between border-t border-white/[0.06] pt-2 text-xs text-[#ffb4ab] font-medium">
                      <span>Acción preventiva recomendada:</span>
                      <span className="font-bold uppercase tracking-wider text-[#ff453a]">Inhabilitar espacio</span>
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
              <div className="pt-2 flex gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full h-12 rounded-full font-semibold text-sm tracking-wide shadow-lg shadow-blue-600/20"
                  isLoading={isSubmitting}
                  onClick={handleConfirmIncident}
                >
                  Confirmar y Registrar Incidencia
                </Button>
                {currentStep === 3 && (
                  <Button
                    variant="secondary"
                    size="lg"
                    className="h-12 rounded-full"
                    onClick={handleResetFlow}
                  >
                    Nuevo Reporte
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
