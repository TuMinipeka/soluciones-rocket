import React, { useState } from 'react';
import RoomTile from './RoomTile';
import RoomLegend from './RoomLegend';
import RoomDetails from './RoomDetails';
import LoadingState from '../feedback/LoadingState';
import ErrorMessage from '../feedback/ErrorMessage';

// 10 Salas Oficiales de Campuslands con aforos y orden arquitectónico tipo cine (HU-18)
export const OFFICIAL_CAMPUS_ROOMS = [
  // Fila Superior: Salas de Alto Aforo y Auditorios
  {
    id: 'SAL-001',
    name: 'Auditorio',
    capacity: 100,
    status: 'available',
    tier: 'major',
    equipment: ['Pantalla Gigante Láser', 'Sonido Dolby Surround', '4x Micrófonos Inalámbricos', 'Atril de Control'],
    description: 'Auditorio principal para conferencias magistrales, lanzamientos de proyectos y hackatones.',
  },
  {
    id: 'SAL-004',
    name: 'Sputnik',
    capacity: 38,
    status: 'available',
    tier: 'major',
    equipment: ['38 Workstations Dual-Monitor', 'Proyector 4K', 'Pizarra Smart Digital'],
    description: 'Aula especializada en desarrollo de software avanzado y computación gráfica.',
  },
  {
    id: 'SAL-005',
    name: 'Apolo',
    capacity: 34,
    status: 'incident',
    tier: 'major',
    currentReservation: { title: 'Taller de Arquitectura Cloud', start: '10:00', end: '13:00' },
    equipment: ['Proyector 4K', 'Sistema de Climatización', '34 Puestos LAN Gigabit'],
    description: 'Laboratorio de infraestructura en mitigación técnica por sobrecalentamiento.',
  },
  {
    id: 'SAL-010',
    name: 'Artemis',
    capacity: 32,
    status: 'available',
    tier: 'major',
    equipment: ['32 Laptops Workstation', 'Audio de Conferencia', '2x Monitores Guía'],
    description: 'Espacio de innovación y entrenamiento intensivo de bootcamps.',
  },
  {
    id: 'SAL-002',
    name: 'Cosmos',
    capacity: 25,
    status: 'busy',
    tier: 'major',
    currentReservation: { title: 'Bootcamp Backend Python & FastAPI', start: '08:00', end: '12:00' },
    equipment: ['Proyector HD', '25 PCs All-in-One', 'Pizarra Blanca'],
    description: 'Aula para desarrollo intensivo de APIs y bases de datos relacionales.',
  },

  // Fila Inferior: Salas de Trabajo Colaborativo, Mentoría y Workshops
  {
    id: 'SAL-003',
    name: 'Skylab',
    capacity: 20,
    status: 'available',
    tier: 'workshop',
    equipment: ['Monitores Duales', 'Pizarra Smart', 'Mesa de Brainstorming'],
    description: 'Espacio ágil para sprints de diseño de producto y mentorías técnicas.',
  },
  {
    id: 'SAL-006',
    name: 'Sala Nueva',
    capacity: 12,
    status: 'maintenance',
    tier: 'collab',
    equipment: ['Mesa de Reuniones', 'Smart TV 65"', 'Cámara 360°'],
    description: 'Sala de juntas ejecutiva en mantenimiento preventivo de mobiliario.',
  },
  {
    id: 'SAL-007',
    name: 'Azul',
    capacity: 10,
    status: 'available',
    tier: 'collab',
    equipment: ['Monitor 4K', 'Pizarra Magnética', 'Sistema Meet'],
    description: 'Sala de trabajo en equipo para comités evaluadores y defensas de proyectos.',
  },
  {
    id: 'SAL-008',
    name: 'Amarillas',
    capacity: 6,
    status: 'available',
    tier: 'mini',
    equipment: ['Smart TV 50"', 'Cámara HD', 'Mesa Colaborativa'],
    description: 'Espacio cerrado para sesiones de pair programming y entrevistas técnicas.',
  },
  {
    id: 'SAL-009',
    name: 'Verdes',
    capacity: 6,
    status: 'busy',
    tier: 'mini',
    currentReservation: { title: 'Reunión de Coordinación Académica', start: '09:00', end: '11:00' },
    equipment: ['Smart TV 50"', 'Micrófono ambiental'],
    description: 'Espacio reservado para sincronización docente y seguimiento operativo.',
  },
];

export default function RoomMap({
  rooms,
  spaces,
  loading = false,
  error = null,
  selectedRoomId = null,
  onSelectRoom,
  onRetry,
}) {
  const [modalRoom, setModalRoom] = useState(null);

  const roomList = rooms || spaces || OFFICIAL_CAMPUS_ROOMS;

  const handleTileClick = (room) => {
    setModalRoom(room);
    onSelectRoom?.(room);
  };

  if (loading) {
    return <LoadingState message="Cargando mapa de espacios y aforos del campus..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Error de conexión con el módulo de espacios"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  // Separación arquitectónica (Salas de gran aforo arriba, salas de trabajo colaborativo abajo)
  const majorRooms = roomList.filter((r) => r.capacity >= 25);
  const collabRooms = roomList.filter((r) => r.capacity < 25);

  return (
    <section className="space-y-6" aria-label="Plano de distribución de salas">
      {/* Indicador de Escenario / Curva tipo Cine */}
      <div className="flex flex-col items-center justify-center pt-2 pb-2">
        <div className="w-3/4 max-w-md h-2 rounded-t-full bg-gradient-to-r from-blue-900/40 via-[#22d3ee] to-blue-900/40 shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
        <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#22d3ee] mt-2 select-none">
          Pabellón Central • Campuslands
        </span>
      </div>

      {/* Leyenda Accesible */}
      <RoomLegend />

      {/* Plano de Cine: Sección Frontal (Aulas de Gran Capacidad) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#A1A1A6] flex items-center gap-2">
            <span>Sector A: Auditorio y Laboratorios Principales (Aforo &ge; 25)</span>
          </h3>
          <span className="text-[11px] font-mono text-[#60A5FA]">
            {majorRooms.reduce((acc, r) => acc + r.capacity, 0)} puestos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {majorRooms.map((room) => (
            <RoomTile
              key={room.id}
              room={room}
              isSelected={selectedRoomId === room.id || modalRoom?.id === room.id}
              onClick={handleTileClick}
              onSelect={handleTileClick}
            />
          ))}
        </div>
      </div>

      {/* Plano de Cine: Sección Posterior (Salas Colaborativas y Talleres) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#A1A1A6] flex items-center gap-2">
            <span>Sector B: Salas de Innovación, Mentoría y Talleres (Aforo &lt; 25)</span>
          </h3>
          <span className="text-[11px] font-mono text-[#60A5FA]">
            {collabRooms.reduce((acc, r) => acc + r.capacity, 0)} puestos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {collabRooms.map((room) => (
            <RoomTile
              key={room.id}
              room={room}
              isSelected={selectedRoomId === room.id || modalRoom?.id === room.id}
              onClick={handleTileClick}
              onSelect={handleTileClick}
            />
          ))}
        </div>
      </div>

      {/* Modal interactivo de detalle de sala */}
      <RoomDetails
        room={modalRoom}
        isOpen={Boolean(modalRoom)}
        onClose={() => setModalRoom(null)}
        onReserve={(room) => {
          setModalRoom(null);
          window.location.href = `/reservations?space_id=${room.id}`;
        }}
        onReportIncident={(room) => {
          setModalRoom(null);
          window.location.href = `/incidents?space_id=${room.id}`;
        }}
      />
    </section>
  );
}

export { RoomTile, RoomLegend, RoomDetails };
