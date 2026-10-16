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
      border: 'border-emerald-200/90 hover:border-emerald-400 bg-white shadow-[0_2px_8px_rgba(16,185,129,0.06)] hover:glow-emerald',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badgeText: 'Disponible',
      dotColor: 'bg-emerald-500',
      isDisabled: false,
    },
    occupied: {
      border: 'border-zinc-200/80 bg-zinc-50/80 opacity-70 cursor-not-allowed',
      badge: 'bg-zinc-100 text-zinc-500 border-zinc-200',
      badgeText: 'Ocupada',
      dotColor: 'bg-zinc-400',
      isDisabled: false, // Permite inspeccionar aunque esté ocupada
    },
    incident: {
      border: 'border-amber-300/90 bg-amber-50/30 hover:border-amber-400 hover:glow-amber',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      badgeText: 'En revisión',
      dotColor: 'bg-amber-500 animate-pulse-subtle',
      isDisabled: false,
    },
    disabled: {
      border: 'border-rose-200/90 hatch-disabled cursor-not-allowed opacity-80',
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      badgeText: 'Inhabilitada',
      dotColor: 'bg-rose-500',
      isDisabled: true,
    },
  }

  const current = statusConfig[status] || statusConfig.available

  return (
    <button
      type="button"
      onClick={() => onSelect && onSelect(room)}
      className={`group relative flex flex-col justify-between p-4 rounded-2xl border text-left transition-all duration-150 ease-out active:scale-[0.97] cursor-pointer ${
        current.border
      } ${
        isSelected
          ? 'ring-2 ring-zinc-950 ring-offset-2 shadow-lg scale-[1.02] bg-white z-10'
          : 'hover:scale-[1.01]'
      }`}
    >
      {/* Cabecera del Pod / Sala */}
      <div className="flex items-start justify-between gap-1 w-full">
        <div>
          <span className="text-[10px] font-mono font-medium text-zinc-400 block tracking-wider">
            {room?.code || `SAL-${String(room?.id || 1).padStart(3, '0')}`}
          </span>
          <h4 className="text-sm font-bold text-zinc-900 tracking-tight group-hover:text-black">
            {room?.name || 'Sala'}
          </h4>
        </div>
        <span className={`w-2 h-2 rounded-full ${current.dotColor} shrink-0 mt-1`} />
      </div>

      {/* Pie del Pod: Capacidad y Estado */}
      <div className="mt-4 pt-2.5 border-t border-zinc-100/80 flex items-center justify-between w-full">
        <span className="text-xs font-medium text-zinc-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
