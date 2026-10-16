/**
 * Badge de prioridad de incidencia (alta, media, baja, crítica).
 * Área: MAFE / GUERRA (HU-14, HU-20, HU-24).
 */

export default function PriorityBadge({ priority = 'media' }) {
  const norm = String(priority).toLowerCase()

  const styles = {
    critica: 'bg-[#93000a]/30 text-[#ffb4ab] border-[#ff453a]/40',
    critical: 'bg-[#93000a]/30 text-[#ffb4ab] border-[#ff453a]/40',
    alta: 'bg-[#ff9f0a]/20 text-[#ff9f0a] border-[#ff9f0a]/40',
    high: 'bg-[#ff9f0a]/20 text-[#ff9f0a] border-[#ff9f0a]/40',
    media: 'bg-[#2563eb]/20 text-[#6cd3f7] border-[#2563eb]/40',
    medium: 'bg-[#2563eb]/20 text-[#6cd3f7] border-[#2563eb]/40',
    baja: 'bg-[#2a2a2c] text-[#a1a1a6] border-white/[0.08]',
    low: 'bg-[#2a2a2c] text-[#a1a1a6] border-white/[0.08]',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
        styles[norm] || styles.media
      }`}
    >
      {priority}
    </span>
  )
}
