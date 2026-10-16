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
        <div className="flex justify-between py-1 border-b border-zinc-100">
          <span className="text-zinc-500">Capacidad máxima:</span>
          <span className="font-semibold text-zinc-900">{room.capacity} personas</span>
        </div>
        <div className="flex justify-between py-1 border-b border-zinc-100">
          <span className="text-zinc-500">Estado actual:</span>
          <span className="font-semibold capitalize text-zinc-900">{room.status || 'Disponible'}</span>
        </div>
        {room.resources && (
          <div className="py-1">
            <span className="text-zinc-500 block mb-1">Equipamiento fijo:</span>
            <span className="text-zinc-700 text-xs">{room.resources.join(', ')}</span>
          </div>
        )}
        {onBook && room.status !== 'disabled' && (
          <div className="pt-2">
            <Button variant="primary" size="sm" className="w-full" onClick={() => onBook(room)}>
              Reservar esta sala
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
