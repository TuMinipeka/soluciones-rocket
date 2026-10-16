/**
 * RecommendationCard: Tarjeta de recomendación de triaje y reubicación inteligente (HU-15, HU-16, HU-20, HU-24).
 * - Distingue 'ai' (chip cian #0891B2 "Clasificación IA / Inteligencia Artificial") vs 'rules' (#A1A1A6 "Fallback por Reglas Locales").
 * - Caso borde: Si no hay alternativas disponibles, renderiza alerta explícita en texto claro.
 * - Restricción por rol: El botón "Confirmar Reubicación" SOLO es visible y ejecutable si el usuario tiene rol de Administrador.
 * Área: MAFE & GUERRA
 */

import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function RecommendationCard({
  recommendation,
  incident,
  user,
  onConfirm,
  isConfirming = false,
  className = '',
  // Props complementarias de Guerra
  source,
  explanation,
  suggestsBlocking = false,
  alternatives: propAlternatives,
  aiModel,
  latencyMs,
  isConfirmed = false,
  onConfirmReallocation,
  canConfirm,
}) {
  if (!recommendation && !incident?.recommendation && !explanation) return null;

  const rec =
    typeof recommendation === 'object' && recommendation !== null
      ? recommendation
      : incident?.recommendation || {};

  const classificationSource =
    source ||
    rec.classification_source ||
    incident?.classification_source ||
    (rec.ai_model || aiModel ? 'ai' : 'rules');

  const isAi = classificationSource === 'ai';
  const isAdmin = canConfirm !== undefined ? canConfirm : user?.role?.toLowerCase() === 'admin';

  const alternatives = propAlternatives || rec.alternatives || [];
  const hasNoAlternatives = alternatives.length === 0 && !rec.targetRoomId && !rec.target_room_id;

  const targetRoomName =
    rec.targetRoomName ||
    rec.target_room_name ||
    alternatives[0]?.name ||
    'Spooki';

  const targetRoomId =
    rec.targetRoomId ||
    rec.target_room_id ||
    alternatives[0]?.id ||
    'SAL-004';

  const reason =
    rec.reason ||
    explanation ||
    alternatives[0]?.reason ||
    (typeof recommendation === 'string' ? recommendation : null) ||
    'Aforo compatible y equipamiento técnico equivalente disponible sin conflictos.';

  const confidence = rec.confidence || (aiModel ? 0.95 : null);
  const handleAction = onConfirm || onConfirmReallocation;

  return (
    <Card
      className={`border-l-4 transition-all duration-200 ${
        isAi
          ? 'border-l-[#0891B2] bg-gradient-to-r from-[#0891B2]/15 via-[#1C1C1E] to-[#1C1C1E] shadow-[0_0_25px_rgba(8,145,178,0.2)]'
          : 'border-l-[#A1A1A6] bg-gradient-to-r from-[#2C2C2E]/60 via-[#1C1C1E] to-[#1C1C1E]'
      } ${className}`}
      padding="p-5 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Chips de Clasificación */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {isAi ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#0891B2]/25 border border-[#0891B2]/50 text-[#22D3EE] shadow-[0_0_12px_rgba(34,211,238,0.3)]">
                <span className="w-2 h-2 rounded-full bg-[#0891B2] animate-ping" />
                <svg className="w-3.5 h-3.5 text-[#22D3EE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Clasificación IA</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#2C2C2E] border border-[rgba(255,255,255,0.15)] text-[#A1A1A6]">
                <svg className="w-3.5 h-3.5 text-[#A1A1A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Reglas Locales (Fallback)</span>
              </span>
            )}

            {isAi && confidence && (
              <span className="text-[11px] font-mono text-[#A1A1A6]">
                Confianza: {(confidence * 100).toFixed(0)}%
              </span>
            )}

            {latencyMs && (
              <span className="text-[10px] font-mono text-[#8d90a0]">
                {latencyMs}ms
              </span>
            )}

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

          <h4 className="text-base sm:text-lg font-bold text-[#F5F5F7] tracking-tight">
            Propuesta de Reubicación:{' '}
            <span className="text-[#22D3EE] font-extrabold">{targetRoomName}</span> ({targetRoomId})
          </h4>
        </div>

        {/* Botón de Acción Administrativa (SOLO VISIBLE para admin) */}
        {isAdmin && !hasNoAlternatives && !isConfirmed && (
          <div className="shrink-0 flex items-center">
            <Button
              variant={isAi ? 'secondary' : 'primary'}
              size="md"
              isLoading={isConfirming}
              onClick={() => handleAction?.({ ...rec, targetRoomId, targetRoomName, reason })}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
            >
              Confirmar Reubicación
            </Button>
          </div>
        )}
      </div>

      {/* Caso Borde: Alerta si no existen alternativas viables */}
      {hasNoAlternatives ? (
        <div className="mt-4 p-3.5 rounded-[0.75rem] bg-[#FF453A]/10 border border-[#FF453A]/30 text-xs sm:text-sm text-[#FF453A] font-semibold flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>No hay salas alternativas con aforo y equipamiento disponible para este horario.</span>
        </div>
      ) : (
        /* Justificación y Detalles Técnicos */
        <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="md:col-span-2 space-y-1">
            <span className="text-[#A1A1A6] font-bold uppercase tracking-wider block">
              Justificación de Continuidad:
            </span>
            <p className="text-[#F5F5F7]/90 leading-relaxed text-xs sm:text-sm">
              {reason}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#1C1C1E]/90 border border-[rgba(255,255,255,0.06)] flex flex-col justify-center">
            <span className="text-[#A1A1A6] text-[11px]">Control de Acceso</span>
            <span className="text-xs font-bold text-[#F5F5F7] mt-0.5">
              {isAdmin ? 'Autorizado para mitigar' : 'Vista de solo lectura (Docente/Soporte)'}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
