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
      <div className="flex flex-col items-center justify-center pt-2 pb-2">
        <div className="w-3/4 max-w-md h-2 rounded-t-full bg-gradient-to-r from-blue-900/40 via-[#22d3ee] to-blue-900/40 shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
        <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#22d3ee] mt-2 select-none">
          Pabellón Central • Campuslands
        </span>
      </div>

      {/* Rejilla de salas */}
      <div className="p-5 sm:p-6 bg-[#131315] rounded-[24px] border border-white/[0.08] shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]">
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
