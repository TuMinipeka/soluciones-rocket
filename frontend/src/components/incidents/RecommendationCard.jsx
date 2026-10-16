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
  fallbackReason,
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
          ? 'border-l-[#2563eb] bg-[#1c1c1e]'
          : 'border-l-[#ff9f0a] bg-[#1c1c1e]'
      }`}
    >
      {/* Cabecera con origen honesto del diagnóstico */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
              isAI
                ? 'bg-[#2563eb]/20 text-[#22d3ee] border border-[#2563eb]/40 shadow-xs'
                : 'bg-[#ff9f0a]/15 text-[#ff9f0a] border border-[#ff9f0a]/30'
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
            <span className="text-[10px] font-mono text-[#8d90a0]">
              {latencyMs}ms
            </span>
          )}
          {!isAI && fallbackReason && (
            <span className="text-[10px] font-mono text-[#ff9f0a]">Motivo: {fallbackReason}</span>
          )}
        </div>

        {isConfirmed ? (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/40">
            ✓ Reubicación Confirmada
          </span>
        ) : suggestsBlocking ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-[#93000a]/30 text-[#ffb4ab] border border-[#ff453a]/30">
            Requiere Bloqueo
          </span>
        ) : null}
      </div>

      {/* Cuerpo de la recomendación */}
      <div className="space-y-3 text-sm">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#a1a1a6] block mb-1">
            Recomendación de resolución:
          </span>
          <p className="text-[#f5f5f7] font-medium leading-relaxed bg-[#2c2c2e] p-3 rounded-xl border border-white/[0.08]">
            {recText}
          </p>
        </div>

        {explanation && (
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#a1a1a6] block mb-1">
              Justificación técnica:
            </span>
            <p className="text-xs text-[#c3c6d7] italic bg-[#262a31] p-2.5 rounded-lg border border-white/[0.06]">
              «{explanation}»
            </p>
          </div>
        )}

        {/* Lista de salas alternativas compatibles (HU-05 / HU-24) */}
        {alternatives && alternatives.length > 0 && (
          <div className="pt-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#22d3ee] block mb-2">
              Salas alternativas compatibles ({alternatives.length}):
            </span>
            <div className="space-y-2">
              {alternatives.map((alt) => (
                <div
                  key={alt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-white/[0.08] bg-[#262a31] hover:border-white/[0.15] transition-all gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">
                        {alt.name}
                      </span>
                      <span className="text-[10px] font-mono text-[#22d3ee]">
                        [{alt.id}]
                      </span>
                    </div>
                    <p className="text-xs text-[#a1a1a6] mt-0.5 leading-snug">
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
                        <span className="text-[10px] text-[#8d90a0] font-medium italic">
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
