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
  const majorRooms = spaces.filter((room) => room.capacity >= 25)
  const collaborativeRooms = spaces.filter((room) => room.capacity < 25)

  const renderSector = (rooms, label) => (
    <section className="space-y-3" aria-label={label}>
      <div className="flex items-center justify-between gap-3 px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#a1a1a6]">{label}</h3>
        <span className="shrink-0 text-[11px] font-mono text-[#60a5fa]">
          {rooms.reduce((total, room) => total + room.capacity, 0)} puestos
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {rooms.map((room) => (
          <RoomTile
            key={room.id}
            room={room}
            isSelected={selectedRoomId === room.id}
            onSelect={onSelectRoom}
          />
        ))}
      </div>
    </section>
  )

  return (
    <section className="space-y-6" aria-label="Plano de distribución de salas">
      {/* Indicador de Escenario / Curva tipo Cine */}
      <div className="flex flex-col items-center justify-center pt-2 pb-2">
        <div className="w-3/4 max-w-md h-2 rounded-t-full bg-gradient-to-r from-blue-900/40 via-[#22d3ee] to-blue-900/40 shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
        <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#22d3ee] mt-2 select-none">
          Pabellón Central • Campuslands
        </span>
      </div>

      {/* Sectores por aforo, calculados a partir de las salas recibidas */}
      <div className="space-y-6 p-5 sm:p-6 bg-[#131315] rounded-[24px] border border-white/[0.08] shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]">
        {renderSector(majorRooms, 'Sector A: auditorio y salas principales')}
        {renderSector(collaborativeRooms, 'Sector B: salas colaborativas')}
      </div>

      {/* Leyenda de estados */}
      <div className="px-2">
        <RoomLegend />
      </div>
    </section>
  )
}
