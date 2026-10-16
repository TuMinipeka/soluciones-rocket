/**
 * Tarjeta de presentación de una incidencia individual (HU-14, HU-20).
 * Área: MAFE (consumida en lista de incidencias).
 */

import Card from '../ui/Card'
import PriorityBadge from './PriorityBadge'

export default function IncidentCard({ incident, onSelect }) {
  if (!incident) return null

  const statusColors = {
    open: 'bg-amber-50 text-amber-700 border-amber-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    closed: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  }

  return (
    <Card className="hover:border-zinc-300 transition-all cursor-pointer" onClick={() => onSelect && onSelect(incident)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={incident.priority} />
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
              statusColors[incident.status] || statusColors.open
            }`}
          >
            {incident.status || 'abierta'}
          </span>
        </div>
        <span className="text-[11px] text-zinc-400 font-mono">
          #{incident.id}
        </span>
      </div>

      <div className="mt-2.5">
        <h4 className="text-sm font-semibold text-zinc-900 line-clamp-1">
          {incident.title || incident.description}
        </h4>
        <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
          {incident.description}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-100 pt-2.5">
        <span>{incident.space_name || incident.resource_name || 'General'}</span>
        <span>{incident.created_at ? new Date(incident.created_at).toLocaleDateString() : 'Reciente'}</span>
      </div>
    </Card>
  )
}
