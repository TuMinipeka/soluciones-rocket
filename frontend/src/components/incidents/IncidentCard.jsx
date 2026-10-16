import React from 'react';
import Card from '../ui/Card';
import PriorityBadge from './PriorityBadge';
import Button from '../ui/Button';

/**
 * IncidentCard: Ficha técnica individual de una incidencia (HU-20).
 * Accesible por teclado, con badge de prioridad y sala afectada.
 */
export default function IncidentCard({
  incident,
  onResolve,
  onViewDetails,
  className = '',
}) {
  if (!incident) return null;

  const {
    id = 'INC-001',
    title = 'Falla técnica',
    description = 'Descripción del problema...',
    spaceId = 'SAL-005',
    spaceName = 'Apolo',
    priority = 'ALTA',
    status = 'OPEN', // 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
    createdAt = 'Hoy, 09:15 AM',
    reportedBy = 'Docente',
    hasRecommendation = false,
  } = incident;

  const statusMap = {
    OPEN: { label: 'Abierta', color: 'text-[#FF453A]', bg: 'bg-[#FF453A]/15 border-[#FF453A]/30' },
    IN_PROGRESS: { label: 'En Mitigación', color: 'text-[#FF9F0A]', bg: 'bg-[#FF9F0A]/15 border-[#FF9F0A]/30' },
    RESOLVED: { label: 'Resuelta', color: 'text-[#30D158]', bg: 'bg-[#30D158]/15 border-[#30D158]/30' },
  };

  const currentStatus = statusMap[status] || statusMap.OPEN;

  return (
    <Card
      padding="p-5"
      className={`border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.18)] transition-all ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="font-mono text-xs font-bold text-[#A1A1A6]">{id}</span>
            <PriorityBadge priority={priority} />
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${currentStatus.bg} ${currentStatus.color}`}>
              {currentStatus.label}
            </span>
            {hasRecommendation && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0891B2]/20 text-[#22D3EE] border border-[#0891B2]/40 flex items-center gap-1 shadow-xs">
                <span>⚡</span> Recomendación Disponible
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-[#F5F5F7] tracking-tight">
            {title}
          </h3>

          <div className="flex items-center gap-2 mt-1 text-xs text-[#A1A1A6]">
            <span>Espacio:</span>
            <span className="font-bold text-[#60A5FA]">{spaceName} ({spaceId})</span>
            <span>&bull;</span>
            <span>{createdAt}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={() => onViewDetails(incident)}>
              Ficha
            </Button>
          )}
          {onResolve && status !== 'RESOLVED' && (
            <Button variant="primary" size="sm" onClick={() => onResolve(incident)}>
              Gestionar
            </Button>
          )}
        </div>
      </div>

      <p className="mt-3 text-xs sm:text-sm text-[#F5F5F7]/85 leading-relaxed bg-[#2C2C2E]/40 p-3 rounded-[0.75rem] border border-[rgba(255,255,255,0.04)]">
        {description}
      </p>

      <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-[11px] text-[#A1A1A6]">
        <span>Reportado por: <strong className="text-[#F5F5F7]">{reportedBy}</strong></span>
        <span className="font-mono text-[10px] text-[#60A5FA]">Continuidad Campuslands</span>
      </div>
    </Card>
  );
}
