/**
 * Mapa interactivo tipo cine de las 10 salas del campus (HU-18).
 * Estructurado con pantalla/escenario curvado superior y distribución por zonas.
 * Área: MAFE (HU-18).
 */

import RoomTile from './RoomTile'
import RoomLegend from './RoomLegend'

export default function RoomMap({
  spaces = [],
  selectedRoomId,
  onSelectRoom,
}) {
  return (
    <div className="space-y-6">
      {/* Indicador de Escenario / Curva tipo Cine */}
      <div className="flex flex-col items-center justify-center pt-2 pb-4">
        <div className="w-3/4 max-w-md h-2 rounded-t-full bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-200 shadow-sm" />
        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mt-1.5 select-none">
          Pabellón Central • Campuslands
        </span>
      </div>

      {/* Rejilla de salas */}
      <div className="p-5 sm:p-6 bg-zinc-100/60 rounded-3xl border border-zinc-200/80 shadow-[inset_0_1px_4px_rgba(0,0,0,0.03)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {spaces.map((room) => (
            <RoomTile
              key={room.id}
              room={room}
              isSelected={selectedRoomId === room.id}
              onSelect={onSelectRoom}
            />
          ))}
        </div>
      </div>

      {/* Leyenda de estados */}
      <div className="px-2">
        <RoomLegend />
      </div>
    </div>
  )
}
