/**
 * Tarjeta de presentación de una incidencia individual (HU-14, HU-20).
 * Área: MAFE (consumida en lista de incidencias).
 */

import Card from '../ui/Card'
import PriorityBadge from './PriorityBadge'

export default function IncidentCard({ incident, onSelect }) {
  if (!incident) return null

  const statusColors = {
    open: 'bg-[#ff9f0a]/15 text-[#ff9f0a] border-[#ff9f0a]/30',
    in_progress: 'bg-[#2563eb]/20 text-[#6cd3f7] border-[#2563eb]/40',
    resolved: 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30',
    closed: 'bg-[#2a2a2c] text-[#8d90a0] border-white/[0.08]',
  }

  return (
    <Card className="hover:border-white/[0.15] transition-all cursor-pointer" onClick={() => onSelect && onSelect(incident)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={incident.priority} />
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
              statusColors[incident.status] || statusColors.open
            }`}
          >
            {incident.status || 'abierta'}
          </span>
        </div>
        <span className="text-[11px] text-[#22d3ee] font-mono">
          #{incident.id}
        </span>
      </div>

      <div className="mt-2.5">
        <h4 className="text-sm font-semibold text-white line-clamp-1">
          {incident.title || incident.description}
        </h4>
        <p className="mt-1 text-xs text-[#a1a1a6] line-clamp-2">
          {incident.description}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-[#8d90a0] border-t border-white/[0.06] pt-2.5">
        <span>{incident.space_name || incident.resource_name || 'General'}</span>
        <span className="font-mono">{incident.created_at ? new Date(incident.created_at).toLocaleDateString() : 'Reciente'}</span>
      </div>
    </Card>
  )
}
