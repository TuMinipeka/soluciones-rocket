/**
 * Tarjeta de Recomendación Inteligente (HU-15, HU-16, HU-20, HU-24).
 * Distingue nítidamente entre clasificación por IA y Fallback de Reglas Locales,
 * mostrando explicaciones, advertencias de bloqueo y alternativas oficiales de reubicación.
 * Área: MAFE / GUERRA.
 */

import Card from '../ui/Card'
import Button from '../ui/Button'

export default function RecommendationCard({
  recommendation,
  source = 'ai', // 'ai' o 'rules'
  explanation,
  suggestsBlocking = false,
  alternatives = [],
  aiModel,
  latencyMs,
  isConfirmed = false,
  onConfirmReallocation,
  canConfirm = false, // Solo rol admin
}) {
  const isAI = source === 'ai'

  const recText =
    typeof recommendation === 'string'
      ? recommendation
      : recommendation?.text || recommendation?.description || 'Revisión por personal técnico requerida.'

  return (
    <Card
      className={`border-l-4 transition-all duration-200 ${
        isAI
          ? 'border-l-violet-600 bg-gradient-to-br from-violet-50/40 via-white to-white'
          : 'border-l-amber-500 bg-gradient-to-br from-amber-50/30 via-white to-white'
      }`}
    >
      {/* Cabecera con origen honesto del diagnóstico */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
              isAI
                ? 'bg-violet-100 text-violet-800 border border-violet-200 shadow-xs'
                : 'bg-amber-100 text-amber-900 border border-amber-200'
            }`}
          >
            <span>{isAI ? '✨' : '⚙️'}</span>
            <span>
              {isAI
                ? `Inteligencia Artificial${aiModel ? ` (${aiModel})` : ''}`
                : 'Fallback por Reglas Locales'}
            </span>
          </span>

          {latencyMs && (
            <span className="text-[10px] font-mono text-zinc-400">
              {latencyMs}ms
            </span>
          )}
        </div>

        {isConfirmed ? (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            ✓ Reubicación Confirmada
          </span>
        ) : suggestsBlocking ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            Requiere Bloqueo
          </span>
        ) : null}
      </div>

      {/* Cuerpo de la recomendación */}
      <div className="space-y-3 text-sm">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
            Recomendación de resolución:
          </span>
          <p className="text-zinc-900 font-medium leading-relaxed bg-white/80 p-3 rounded-xl border border-zinc-200/60 shadow-xs">
            {recText}
          </p>
        </div>

        {explanation && (
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
              Justificación técnica:
            </span>
            <p className="text-xs text-zinc-600 italic bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
              «{explanation}»
            </p>
          </div>
        )}

        {/* Lista de salas alternativas compatibles (HU-05 / HU-24) */}
        {alternatives && alternatives.length > 0 && (
          <div className="pt-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block mb-2">
              Salas alternativas compatibles ({alternatives.length}):
            </span>
            <div className="space-y-2">
              {alternatives.map((alt) => (
                <div
                  key={alt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-zinc-200/80 bg-white hover:border-zinc-300 transition-all gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-zinc-900">
                        {alt.name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        [{alt.id}]
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 leading-snug">
                      {alt.reason}
                    </p>
                  </div>

                  {!isConfirmed && onConfirmReallocation && (
                    <div className="shrink-0 pt-1 sm:pt-0">
                      {canConfirm ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => onConfirmReallocation(alt)}
                        >
                          Confirmar cambio
                        </Button>
                      ) : (
                        <span className="text-[10px] text-zinc-400 font-medium italic">
                          (Confirmación solo admin)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
