/**
 * Mapa interactivo tipo cine de las 10 salas del campus (HU-18).
 * Área: MAFE (consumido por Guerra para selección rápida de sala).
 */

import RoomTile from './RoomTile'
import RoomLegend from './RoomLegend'

export default function RoomMap({
  spaces = [],
  selectedRoomId,
  onSelectRoom,
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Distribución física del campus
          </h4>
          <p className="text-xs text-zinc-400">Selecciona una sala para consultar disponibilidad</p>
        </div>
      </div>

      {/* Rejilla de salas tipo asientos / salas de campus */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-zinc-50/80 rounded-2xl border border-zinc-200/80">
        {spaces.map((room) => (
          <RoomTile
            key={room.id}
            room={room}
            isSelected={selectedRoomId === room.id}
            onSelect={onSelectRoom}
          />
        ))}
      </div>

      <RoomLegend />
    </div>
  )
}
