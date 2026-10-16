/**
 * Badge de prioridad de incidencia (alta, media, baja, crítica).
 * Área: MAFE / GUERRA (HU-14, HU-20, HU-24).
 */

export default function PriorityBadge({ priority = 'media' }) {
  const norm = String(priority).toLowerCase()

  const styles = {
    critica: 'bg-rose-100 text-rose-800 border-rose-200',
    critical: 'bg-rose-100 text-rose-800 border-rose-200',
    alta: 'bg-amber-100 text-amber-800 border-amber-200',
    high: 'bg-amber-100 text-amber-800 border-amber-200',
    media: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-blue-100 text-blue-800 border-blue-200',
    baja: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    low: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${
        styles[norm] || styles.media
      }`}
    >
      {priority}
    </span>
  )
}
