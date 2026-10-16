import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

/**
 * RecommendationCard: Tarjeta de recomendación de reubicación y continuidad operativa (HU-20).
 * Diferencia explícitamente el origen:
 * - 'ai': Brillo cian #0891B2 con texto "Clasificación por IA"
 * - 'rules': Badge neutro #A1A1A6 con texto "Clasificación por Reglas Locales (Fallback)"
 * El botón "Confirmar Reubicación" solo se habilita o muestra para rol 'admin'.
 */
export default function RecommendationCard({
  recommendation,
  onConfirm,
  isConfirming = false,
  userRole = 'ADMIN',
  className = '',
}) {
  if (!recommendation) return null;

  const {
    classification_source = recommendation.source || 'ai', // 'ai' | 'rules'
    targetRoomId = 'SAL-004',
    targetRoomName = 'Spooki',
    reason = 'Aforo compatible (38 PCs disponibles vs 34 requeridas), climatización operativa y franja horaria sin solapes.',
    confidence = 0.96,
    affectedReservationsCount = 1,
    ruleName = 'Compatibilidad por Aforo y Equipamiento',
  } = recommendation;

  const isAi = classification_source === 'ai';
  const isAdmin = String(userRole).toUpperCase() === 'ADMIN';

  return (
    <Card
      variant="elevated"
      className={`border-l-4 transition-all duration-200 ${
        isAi
          ? 'border-l-[#0891B2] bg-gradient-to-r from-[#0891B2]/15 via-[#1C1C1E] to-[#1C1C1E] shadow-[0_0_25px_rgba(8,145,178,0.18)]'
          : 'border-l-[#A1A1A6] bg-gradient-to-r from-[#2C2C2E]/60 via-[#1C1C1E] to-[#1C1C1E]'
      } ${className}`}
      padding="p-5 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Source Badge y Título */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {isAi ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#0891B2]/25 border border-[#0891B2]/50 text-[#22D3EE] shadow-[0_0_12px_rgba(34,211,238,0.3)]">
                <span className="w-2 h-2 rounded-full bg-[#0891B2] animate-ping" />
                <svg className="w-3.5 h-3.5 text-[#22D3EE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Clasificación por IA</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#2C2C2E] border border-[rgba(255,255,255,0.15)] text-[#A1A1A6]">
                <svg className="w-3.5 h-3.5 text-[#A1A1A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Clasificación por Reglas Locales (Fallback)</span>
              </span>
            )}

            {isAi && confidence && (
              <span className="text-[11px] font-mono text-[#A1A1A6]">
                Confianza: {(confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>

          <h4 className="text-base sm:text-lg font-bold text-[#F5F5F7] tracking-tight">
            Sala alternativa sugerida: <span className="text-[#22D3EE] font-extrabold">{targetRoomName}</span> ({targetRoomId})
          </h4>
        </div>

        {/* Botón Administrativo de Reubicación (HU-20) */}
        <div className="shrink-0 flex flex-col items-end gap-1">
          {isAdmin ? (
            <Button
              variant={isAi ? 'secondary' : 'primary'}
              size="md"
              isLoading={isConfirming}
              onClick={() => onConfirm?.(recommendation)}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
            >
              Confirmar Reubicación
            </Button>
          ) : (
            <div className="flex flex-col items-end">
              <Button variant="outline" size="sm" disabled>
                Confirmar Reubicación
              </Button>
              <span className="text-[10px] text-[#A1A1A6] mt-1">
                Requiere rol Administrador
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Justificación Operativa */}
      <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="md:col-span-2 space-y-1">
          <span className="text-[#A1A1A6] font-bold uppercase tracking-wider block">
            Justificación de Continuidad Operativa:
          </span>
          <p className="text-[#F5F5F7]/90 leading-relaxed text-xs sm:text-sm">
            {reason}
          </p>
          {!isAi && ruleName && (
            <p className="text-[11px] font-mono text-[#A1A1A6] pt-1">
              Motor Heurístico: {ruleName}
            </p>
          )}
        </div>

        <div className="p-3 rounded-xl bg-[#1C1C1E]/90 border border-[rgba(255,255,255,0.06)] flex flex-col justify-center">
          <span className="text-[#A1A1A6] text-[11px]">Reservas por Mitigar</span>
          <span className="text-xl font-extrabold text-[#FF9F0A] mt-0.5">
            {affectedReservationsCount} sesión
          </span>
          <span className="text-[10px] text-[#A1A1A6] mt-0.5">
            Preserva la actividad docente
          </span>
        </div>
      </div>
    </Card>
  );
}
