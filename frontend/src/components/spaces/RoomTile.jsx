/**
 * Tile interactivo que representa una sala individual (HU-18: Mapa tipo cine).
 * Diseño: Apple Card con respuesta háptica (Emil Kowalski).
 * Área: MAFE (HU-18).
 */

export default function RoomTile({
  room,
  isSelected = false,
  onSelect,
}) {
  const status = room?.status || 'available'

  // Estilos visuales refinados tipo cine
  const statusConfig = {
    available: {
      border: 'border-[#30d158]/25 hover:border-[#30d158]/60 bg-[#1c1c1e] hover:glow-emerald',
      badge: 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30',
      badgeText: 'Disponible',
      dotColor: 'bg-[#30d158]',
      isDisabled: false,
    },
    occupied: {
      border: 'border-white/[0.06] bg-[#141416] opacity-75',
      badge: 'bg-[#2a2a2c] text-[#8d90a0] border-white/[0.06]',
      badgeText: 'Ocupada',
      dotColor: 'bg-[#8d90a0]',
      isDisabled: false,
    },
    incident: {
      border: 'border-[#ff9f0a]/35 bg-[#1f1b14] hover:border-[#ff9f0a]/70 hover:glow-amber',
      badge: 'bg-[#ff9f0a]/15 text-[#ff9f0a] border-[#ff9f0a]/30',
      badgeText: 'En revisión',
      dotColor: 'bg-[#ff9f0a] animate-pulse-subtle',
      isDisabled: false,
    },
    disabled: {
      border: 'border-[#ff453a]/35 hatch-disabled-dark opacity-80',
      badge: 'bg-[#93000a]/40 text-[#ffdad6] border-[#ff453a]/30',
      badgeText: 'Inhabilitada',
      dotColor: 'bg-[#ff453a]',
      isDisabled: true,
    },
  }

  const current = statusConfig[status] || statusConfig.available

  return (
    <button
      type="button"
      onClick={() => onSelect && onSelect(room)}
      className={`group relative flex flex-col justify-between p-4 rounded-[18px] border text-left transition-all duration-150 ease-out active:scale-[0.97] cursor-pointer ${
        current.border
      } ${
        isSelected
          ? 'ring-2 ring-[#2563eb] ring-offset-2 ring-offset-[#0e0e10] shadow-[0_8px_24px_rgba(37,99,235,0.3)] scale-[1.02] bg-[#222226] z-10'
          : 'hover:scale-[1.01]'
      }`}
    >
      {/* Cabecera del Pod / Sala */}
      <div className="flex items-start justify-between gap-1 w-full">
        <div>
          <span className="text-[10px] font-mono font-medium text-[#8d90a0] block tracking-wider">
            {room?.code || `SAL-${String(room?.id || 1).padStart(3, '0')}`}
          </span>
          <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-[#2fd9f4] transition-colors">
            {room?.name || 'Sala'}
          </h4>
        </div>
        <span className={`w-2 h-2 rounded-full ${current.dotColor} shrink-0 mt-1`} />
      </div>

      {/* Pie del Pod: Capacidad y Estado */}
      <div className="mt-4 pt-2.5 border-t border-white/[0.06] flex items-center justify-between w-full">
        <span className="text-xs font-medium text-[#a1a1a6] flex items-center gap-1 font-mono">
          <svg className="w-3.5 h-3.5 text-[#8d90a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {room?.capacity || 20}
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${current.badge}`}>
          {current.badgeText}
        </span>
      </div>
    </button>
  )
}
