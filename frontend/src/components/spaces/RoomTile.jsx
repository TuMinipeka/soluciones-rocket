/**
 * Tile/Asiento interactivo que representa una sala individual.
 * Área: MAFE (HU-18: Mapa de salas).
 */

export default function RoomTile({
  room,
  isSelected = false,
  onSelect,
}) {
  // Estados posibles: available, occupied, incident, disabled
  const statusStyles = {
    available: 'border-emerald-200 bg-emerald-50/60 text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100/60',
    occupied: 'border-zinc-200 bg-zinc-100 text-zinc-500 cursor-not-allowed opacity-75',
    incident: 'border-amber-200 bg-amber-50/70 text-amber-800 hover:border-amber-400',
    disabled: 'border-rose-200 bg-rose-50/70 text-rose-800 cursor-not-allowed opacity-75',
  }

  const status = room?.status || 'available'

  return (
    <button
      type="button"
      onClick={() => onSelect && onSelect(room)}
      disabled={status === 'disabled'}
      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-150 active:scale-95 ${
        statusStyles[status] || statusStyles.available
      } ${isSelected ? 'ring-2 ring-zinc-900 ring-offset-2 shadow-md' : 'shadow-xs'}`}
    >
      <span className="text-xs font-bold tracking-tight">{room?.name || 'Sala'}</span>
      <span className="text-[10px] opacity-75 mt-0.5">Cap: {room?.capacity || 20}</span>
    </button>
  )
}
