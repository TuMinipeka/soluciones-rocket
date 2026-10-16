/**
 * Panel de detalle de una sala seleccionada.
 * Área: MAFE (HU-18).
 */

import Card from '../ui/Card'
import Button from '../ui/Button'

export default function RoomDetails({
  room,
  onBook,
  onClose,
}) {
  if (!room) return null

  return (
    <Card
      title={`Detalle: ${room.name}`}
      subtitle={`Ubicación y equipamiento`}
      action={
        onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 text-xs font-semibold"
          >
            Cerrar
          </button>
        )
      }
    >
      <div className="space-y-3 text-sm">
        <div className="flex justify-between py-1 border-b border-white/[0.06]">
          <span className="text-[#a1a1a6]">Capacidad máxima:</span>
          <span className="font-semibold text-white font-mono">{room.capacity} personas</span>
        </div>
        <div className="flex justify-between py-1 border-b border-white/[0.06]">
          <span className="text-[#a1a1a6]">Estado actual:</span>
          <span className="font-semibold capitalize text-[#22d3ee] font-mono">{room.status || 'Disponible'}</span>
        </div>
        {room.resources && (
          <div className="py-1">
            <span className="text-[#a1a1a6] block mb-1">Equipamiento fijo:</span>
            <span className="text-[#c3c6d7] text-xs">{room.resources.join(', ')}</span>
          </div>
        )}
        {onBook && room.status !== 'disabled' && (
          <div className="pt-2">
            <Button variant="primary" size="sm" className="w-full h-10 rounded-xl" onClick={() => onBook(room)}>
              Reservar esta sala
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
