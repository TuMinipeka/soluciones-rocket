/**
 * Tarjeta de Recomendación Inteligente (HU-15, HU-16, HU-20, HU-24).
 * Diferencia explícitamente si proviene de IA o del Fallback de Reglas Locales,
 * y muestra si es una propuesta preliminar o una acción confirmada por un administrador.
 * Área: MAFE / GUERRA.
 */

import Card from '../ui/Card'
import Button from '../ui/Button'

export default function RecommendationCard({
  recommendation,
  source = 'ai', // 'ai' o 'rules'
  isConfirmed = false,
  onConfirmReallocation,
  canConfirm = false, // Solo admin
}) {
  if (!recommendation) return null

  const isAI = source === 'ai'

  return (
    <Card
      className={`border-l-4 ${
        isAI ? 'border-l-violet-500 bg-violet-50/20' : 'border-l-amber-500 bg-amber-50/20'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
              isAI
                ? 'bg-violet-100 text-violet-800 border border-violet-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            {isAI ? '✨ Recomendación de IA' : '⚙️ Reglas Locales (Fallback)'}
          </span>
          {isConfirmed && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
              ✓ Acción confirmada
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <p className="text-zinc-800 font-medium leading-relaxed">
          {typeof recommendation === 'string'
            ? recommendation
            : recommendation.text || recommendation.description || 'Sin recomendación detallada'}
        </p>

        {recommendation.alternative_space && (
          <div className="mt-3 p-3 rounded-lg bg-white border border-zinc-200 text-xs space-y-1">
            <span className="font-semibold text-zinc-900 block">
              Sala alternativa propuesta:
            </span>
            <p className="text-zinc-600">
              {recommendation.alternative_space.name} (Capacidad: {recommendation.alternative_space.capacity})
            </p>
            {recommendation.alternative_space.reason && (
              <p className="text-zinc-400 italic">
                Motivo: {recommendation.alternative_space.reason}
              </p>
            )}
            {!isConfirmed && onConfirmReallocation && (
              <div className="pt-2">
                {canConfirm ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onConfirmReallocation(recommendation.alternative_space)}
                  >
                    Confirmar reubicación de reserva
                  </Button>
                ) : (
                  <p className="text-[11px] text-zinc-500 italic">
                    * Solo un administrador puede confirmar la reubicación autorizada.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
