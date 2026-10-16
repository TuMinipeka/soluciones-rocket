/**
 * Modal Asistente Inteligente de Espacios (Concierge IA con Groq / Llama 3.3)
 * Provee recomendaciones contextuales de salas según aforo, actividad y equipamiento.
 * Responsable: GUERRA
 */

import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { getSpaceRecommendationApi } from '../../api/recommendations'

const FEATURE_OPTIONS = [
  'Proyector 4K',
  'Videoconferencia',
  'Estaciones iMac',
  'Laptops de desarrollo',
  'Audio distribuido',
  'Pizarra interactiva',
  'Aire acondicionado',
  'Escenario',
]

export default function SpaceConciergeModal({
  isOpen,
  onClose,
  userName = 'Camper',
  initialAttendees = 20,
  initialTitle = '',
  onApplyRecommendation,
}) {
  const [activityTitle, setActivityTitle] = useState(initialTitle || 'Sesión de Trabajo en Equipo')
  const [attendees, setAttendees] = useState(initialAttendees || 20)
  const [selectedFeatures, setSelectedFeatures] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const toggleFeature = (feature) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    )
  }

  const handleConsult = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getSpaceRecommendationApi({
        attendees: Number(attendees),
        activityTitle,
        requiredFeatures: selectedFeatures,
        userName,
      })
      setResult(data)
    } catch (err) {
      setError(err?.message || 'No fue posible obtener recomendaciones en este momento.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = (room) => {
    if (onApplyRecommendation) {
      onApplyRecommendation({
        spaceId: room.id,
        spaceName: room.name,
        attendees: Number(attendees),
        title: activityTitle,
      })
    }
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asistente Inteligente de Espacios"
      subtitle="Optimización de salas con Groq Llama 3.3"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Banner de Bienvenida y Modelo */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-[#1c1c1e] to-cyan-950/30 border border-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-cyan-400 font-bold text-sm shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              ✨
            </div>
            <div>
              <p className="text-xs font-semibold text-white tracking-wide">
                Motor Groq Llama 3.3 (70B)
              </p>
              <p className="text-[11px] text-[#a1a1a6]">
                Análisis heurístico de aforo y equipamiento en tiempo real
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">
            Cero Conflictos
          </span>
        </div>

        {/* Formulario de Requerimientos */}
        <div className="space-y-4 bg-[#141416] p-4.5 rounded-2xl border border-white/[0.06]">
          <Input
            label="Tipo o Título de la Actividad"
            value={activityTitle}
            onChange={(e) => setActivityTitle(e.target.value)}
            placeholder="Ej: Workshop de Arquitectura Cloud, Hackathon..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#a1a1a6] mb-1.5">
                Número de Asistentes
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAttendees((a) => Math.max(1, Number(a) - 5))}
                  className="w-10 h-10 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white font-bold flex items-center justify-center border border-white/5 active:scale-95 transition-all"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value)}
                  className="w-full text-center py-2 bg-[#2c2c2e] rounded-xl text-white font-bold text-base border border-white/10 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setAttendees((a) => Math.min(120, Number(a) + 5))}
                  className="w-10 h-10 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white font-bold flex items-center justify-center border border-white/5 active:scale-95 transition-all"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1a6] mb-1.5">
                Equipamiento Clave (Opcional)
              </label>
              <p className="text-[11px] text-[#8e8e93]">
                Selecciona requerimientos para priorizar salas equipadas
              </p>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap gap-2 pt-1">
              {FEATURE_OPTIONS.map((feat) => {
                const isSelected = selectedFeatures.includes(feat)
                return (
                  <button
                    key={feat}
                    type="button"
                    onClick={() => toggleFeature(feat)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-blue-600/30 text-cyan-300 border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.25)]'
                        : 'bg-[#2c2c2e] text-[#a1a1a6] border-white/5 hover:text-white hover:bg-[#3a3a3c]'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {feat}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              className="w-full justify-center py-3 text-sm font-semibold tracking-wide"
              onClick={handleConsult}
              isLoading={isLoading}
            >
              {isLoading ? 'Consultando Groq IA...' : '⚡ Obtener Recomendación Inteligente'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 text-xs rounded-xl bg-red-950/40 border border-red-500/30 text-red-300">
            {error}
          </div>
        )}

        {/* Resultados del Concierge */}
        {result && (
          <div className="space-y-4 animate-modal-pop">
            {/* Saludo Personalizado */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/25 via-[#1a202c]/40 to-cyan-900/20 border border-blue-500/30">
              <div className="flex items-start gap-3">
                <span className="text-xl">👋</span>
                <p className="text-sm font-medium text-white leading-relaxed">
                  {result.greeting}
                </p>
              </div>
            </div>

            {/* Sala Principal Recomendada */}
            {result.recommended_space && (
              <div className="relative overflow-hidden p-5 rounded-2xl bg-[#1a1a1c] border-2 border-blue-500/60 shadow-[0_10px_30px_rgba(37,99,235,0.2)]">
                <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-l from-blue-600 to-cyan-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-bl-xl shadow-sm">
                  ★ Mejor Elección ({result.recommended_space.fit_percentage}% match)
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <h4 className="text-xl font-bold text-white tracking-tight">
                      Sala {result.recommended_space.name}
                    </h4>
                    <p className="text-xs text-[#a1a1a6]">
                      Capacidad oficial: <strong className="text-white">{result.recommended_space.capacity} personas</strong> • ID: {result.recommended_space.id}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[#d1d1d6] leading-relaxed mb-4 bg-black/20 p-3 rounded-xl border border-white/5">
                  💡 {result.recommended_space.reason}
                </p>

                {result.recommended_space.features && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {result.recommended_space.features.map((feat) => (
                      <span
                        key={feat}
                        className="text-[11px] px-2.5 py-0.5 rounded-md bg-[#2c2c2e] text-[#a1a1a6] border border-white/5"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                )}

                <Button
                  type="button"
                  variant="primary"
                  className="w-full justify-center font-bold text-sm shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                  onClick={() => handleApply(result.recommended_space)}
                >
                  ✓ Aplicar {result.recommended_space.name} a mi Reserva
                </Button>
              </div>
            )}

            {/* Alternativas Disponibles */}
            {result.alternatives && result.alternatives.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#a1a1a6] uppercase tracking-wider mb-2.5">
                  Otras opciones viables
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.alternatives.map((alt) => (
                    <div
                      key={alt.id}
                      className="p-3.5 rounded-xl bg-[#141416] border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <h5 className="font-bold text-sm text-white">{alt.name}</h5>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#2c2c2e] text-cyan-300 border border-white/5">
                            {alt.fit_percentage}% fit
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8e8e93] mb-2">
                          Capacidad: {alt.capacity} personas
                        </p>
                        <p className="text-[11px] text-[#a1a1a6] line-clamp-2 mb-3">
                          {alt.reason}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full justify-center text-xs py-1.5"
                        onClick={() => handleApply(alt)}
                      >
                        Seleccionar {alt.name}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Telemetría y Fuente */}
            <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-[#8e8e93] pt-2 border-t border-white/[0.06]">
              <span>Motor: {result.ai_model}</span>
              <span>
                Fuente: {result.classification_source === 'ai' ? 'Groq Cloud (Llama 3.3)' : 'Reglas Deterministas (Fallback)'}
              </span>
              <span>Latencia: ~{result.latency_ms}ms</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
