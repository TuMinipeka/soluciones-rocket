/*
 * INSTRUCCIÓN PARA GUERRA:
 * Este componente RoomMap es el contenedor interactivo del mapa tipo cine (HU-18).
 * Debes conectar el hook/llamada a `api/spaces.js` (GET /spaces?start_at=...&end_at=...)
 * e iterar sobre las 10 salas oficiales: Auditorio (100), Cosmos (25), Skilab (20),
 * Spooki (38), Apolo (34), Blanca (12), Azul (10), Amarillas (6), Verdes (6), Artemis (32).
 * Utiliza los componentes <RoomTile/> y <RoomLegend/> aquí exportados.
 */

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
    description: 'Auditorio principal para conferencias magistrales, lanzamientos de proyectos y hackatones.'
  },
  {
    id: 'SAL-004',
    name: 'Spooki',
    capacity: 38,
    status: 'available',
    tier: 'major',
    equipment: ['38 Workstations Dual-Monitor', 'Proyector 4K', 'Pizarra Smart Digital'],
    description: 'Aula especializada en desarrollo de software avanzado y computación gráfica.'
  },
  {
    id: 'SAL-005',
    name: 'Apolo',
    capacity: 34,
    status: 'incident',
    tier: 'major',
    currentReservation: { title: 'Taller de Arquitectura Cloud', start: '10:00', end: '13:00' },
    equipment: ['Proyector 4K', 'Sistema de Climatización', '34 Puestos LAN Gigabit'],
    description: 'Laboratorio de infraestructura en mitigación técnica por sobrecalentamiento.'
  },
  {
    id: 'SAL-010',
    name: 'Artemis',
    capacity: 32,
    status: 'available',
    tier: 'major',
    equipment: ['32 Laptops Workstation', 'Audio de Conferencia', '2x Monitores Guía'],
    description: 'Espacio de innovación y entrenamiento intensivo de bootcamps.'
  },
  {
    id: 'SAL-002',
    name: 'Cosmos',
    capacity: 25,
    status: 'busy',
    tier: 'major',
    currentReservation: { title: 'Bootcamp Backend Python & FastAPI', start: '08:00', end: '12:00' },
    equipment: ['Proyector HD', '25 PCs All-in-One', 'Pizarra Blanca'],
    description: 'Aula para desarrollo intensivo de APIs y bases de datos relacionales.'
  },

  // Fila Inferior: Salas de Trabajo Colaborativo, Mentoría y Workshops
  {
    id: 'SAL-003',
    name: 'Skilab',
    capacity: 20,
    status: 'available',
    tier: 'workshop',
    equipment: ['Monitores Duales', 'Pizarra Smart', 'Mesa de Brainstorming'],
    description: 'Espacio ágil para sprints de diseño de producto y mentorías técnicas.'
  },
  {
    id: 'SAL-006',
    name: 'Blanca',
    capacity: 12,
    status: 'maintenance',
    tier: 'collab',
    equipment: ['Mesa de Reuniones', 'Smart TV 65"', 'Cámara 360°'],
    description: 'Sala de juntas ejecutiva en mantenimiento preventivo de mobiliario.'
  },
  {
    id: 'SAL-007',
    name: 'Azul',
    capacity: 10,
    status: 'available',
    tier: 'collab',
    equipment: ['Monitor 4K', 'Pizarra Magnética', 'Sistema Meet'],
    description: 'Sala de trabajo en equipo para comités evaluadores y defensas de proyectos.'
  },
  {
    id: 'SAL-008',
    name: 'Amarillas',
    capacity: 6,
    status: 'available',
    tier: 'mini',
    equipment: ['Smart TV 50"', 'Cámara HD', 'Mesa Colaborativa'],
    description: 'Espacio cerrado para sesiones de pair programming y entrevistas técnicas.'
  },
  {
    id: 'SAL-009',
    name: 'Verdes',
    capacity: 6,
    status: 'busy',
    tier: 'mini',
    currentReservation: { title: 'Reunión de Coordinación Académica', start: '09:00', end: '11:00' },
    equipment: ['Smart TV 50"', 'Micrófono ambiental'],
    description: 'Espacio reservado para sincronización docente y seguimiento operativo.'
  },
];

export default function RoomMap({
  rooms = OFFICIAL_CAMPUS_ROOMS,
  loading = false,
  error = null,
  selectedRoomId = null,
  onSelectRoom,
  onRetry,
}) {
  const [modalRoom, setModalRoom] = useState(null);

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
  const majorRooms = rooms.filter((r) => r.capacity >= 25);
  const collabRooms = rooms.filter((r) => r.capacity < 25);

  return (
    <section className="space-y-6" aria-label="Plano de distribución de salas">
      {/* Banner / Tarjeta Placeholder con Instrucciones Explícitas para Guerra */}
      <div className="p-4 rounded-[1.25rem] bg-[#2C2C2E]/60 border border-[#0891B2]/30 flex items-start gap-3.5 text-xs sm:text-sm text-[#F5F5F7] shadow-sm">
        <div className="shrink-0 p-2 rounded-xl bg-[#0891B2]/20 text-[#22D3EE] font-extrabold text-sm">
          HU-18
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#22D3EE] flex flex-wrap items-center gap-2">
            <span>Mapa Interactivo de Campuslands (Tipo Cine)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2563EB]/20 text-[#60A5FA] font-mono border border-[#2563EB]/30">
              Desacoplado &bull; Contrato api/spaces.js
            </span>
          </p>
          <p className="text-xs text-[#A1A1A6] mt-1 leading-relaxed">
            Plano interactivo organizado por capacidad: auditorios y laboratorios principales al frente, y espacios colaborativos de mentoría en el sector posterior. Haz clic o presiona Enter en cualquier sala para inspeccionar aforo y equipamiento.
          </p>
        </div>
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
          // Redirección para conectar con el flujo de reservas de Guerra
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
