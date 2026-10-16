import React, { useState, useMemo } from 'react'

/**
 * Campus Control — Componente `CampusMap` (HU-18, HU-17, HU-21, HU-22)
 *
 * Arquitectura:
 * - Minimalismo táctico de alta gama (Swiss Design / Apple Pro Dark)
 * - Obsidiana mate, tipografía monoespaciada de precisión y microindicadores de estado
 * - Compatible con Tailwind CSS e integrado con la API FastAPI
 * - Accesibilidad plena WCAG 2.1 AA (navegación por teclado, roles ARIA, focus ring visible)
 */

// Semilla oficial de las 10 salas del SEED Campus Control con metadatos de ubicación
export const INITIAL_ROOMS_SEED = [
  {
    id: 'SAL-001',
    name: 'Auditorio',
    capacity: 100,
    building: 'Edificio Central',
    floor: 'Planta Baja',
    status: 'available',
    currentSession: {
      subject: 'Conferencia Magistral de Nanotecnología',
      responsible: 'Dr. Julián Sotomayor',
      until: '12:30',
    },
    equipmentCount: 6,
  },
  {
    id: 'SAL-002',
    name: 'Cosmos',
    capacity: 25,
    building: 'Pabellón A',
    floor: 'Nivel 2',
    status: 'available',
    equipmentCount: 4,
  },
  {
    id: 'SAL-003',
    name: 'Skilab',
    capacity: 20,
    building: 'Edificio Innovación',
    floor: 'Nivel 1',
    status: 'available',
    equipmentCount: 5,
  },
  {
    id: 'SAL-004',
    name: 'Spooki',
    capacity: 38,
    building: 'Pabellón A',
    floor: 'Nivel 1',
    status: 'available',
    currentSession: {
      subject: 'Reporte técnico: Falla en conmutador HDMI',
      responsible: 'Soporte Bedelía',
      until: '15:00',
    },
    equipmentCount: 3,
  },
  {
    id: 'SAL-005',
    name: 'Apolo',
    capacity: 34,
    building: 'Pabellón B',
    floor: 'Nivel 2',
    status: 'available',
    equipmentCount: 4,
  },
  {
    id: 'SAL-006',
    name: 'Blanca',
    capacity: 12,
    building: 'Edificio Central',
    floor: 'Nivel 3',
    status: 'available',
    equipmentCount: 2,
  },
  {
    id: 'SAL-007',
    name: 'Azul',
    capacity: 10,
    building: 'Edificio Central',
    floor: 'Nivel 3',
    status: 'available',
    currentSession: {
      subject: 'Reunión de Consejo Académico',
      responsible: 'Dra. Carmen Valenzuela',
      until: '11:15',
    },
    equipmentCount: 2,
  },
  {
    id: 'SAL-008',
    name: 'Amarillas',
    capacity: 6,
    building: 'Biblioteca Norte',
    floor: 'Nivel 1',
    status: 'available',
    equipmentCount: 1,
  },
  {
    id: 'SAL-009',
    name: 'Verdes',
    capacity: 6,
    building: 'Biblioteca Norte',
    floor: 'Nivel 1',
    status: 'available',
    currentSession: {
      subject: 'Mantenimiento de climatización preventiva',
      responsible: 'Infraestructura Campus',
      until: '18:00',
    },
    equipmentCount: 1,
  },
  {
    id: 'SAL-010',
    name: 'Artemis',
    capacity: 32,
    building: 'Pabellón B',
    floor: 'Nivel 1',
    status: 'available',
    equipmentCount: 4,
  },
]

// Configuración de microindicadores de estado (HU-18)
export const STATUS_CONFIG = {
  available: {
    label: 'Disponible',
    dotClass: 'bg-emerald-400',
    textClass: 'text-emerald-400/90',
    badgeBorder: 'border-emerald-500/20',
  },
  occupied: {
    label: 'Ocupado',
    dotClass: 'bg-blue-400',
    textClass: 'text-blue-400/90',
    badgeBorder: 'border-blue-500/20',
  },
  issue: {
    label: 'Incidencia',
    dotClass: 'bg-amber-400',
    textClass: 'text-amber-400/90',
    badgeBorder: 'border-amber-500/20',
  },
  incident: {
    label: 'Incidencia',
    dotClass: 'bg-amber-400',
    textClass: 'text-amber-400/90',
    badgeBorder: 'border-amber-500/20',
  },
  disabled: {
    label: 'Inhabilitado',
    dotClass: 'bg-zinc-500',
    textClass: 'text-zinc-500',
    badgeBorder: 'border-zinc-700/30',
  },
}

export function CampusMap({
  rooms = INITIAL_ROOMS_SEED,
  onSelectRoom,
  onReserveSpace,
  onReportIncident,
  className = '',
}) {
  const [selectedRoomId, setSelectedRoomId] = useState('SAL-002') // Cosmos por defecto
  const [filterStatus, setFilterStatus] = useState('all')

  // Normalizar el estado si viene como 'incident' desde backend
  const normalizedRooms = useMemo(() => {
    return rooms.map((r) => {
      let st = r.status || 'available'
      if (st === 'incident') st = 'issue'
      return { ...r, status: st }
    })
  }, [rooms])

  // Filtrado reactivo en memoria
  const filteredRooms = useMemo(() => {
    if (filterStatus === 'all') return normalizedRooms
    return normalizedRooms.filter((r) => r.status === filterStatus)
  }, [normalizedRooms, filterStatus])

  // Sala seleccionada actualmente
  const selectedRoom = useMemo(() => {
    return normalizedRooms.find((r) => r.id === selectedRoomId) || null
  }, [normalizedRooms, selectedRoomId])

  // Métricas agregadas para telemetría superior
  const metrics = useMemo(() => {
    return {
      total: normalizedRooms.length,
      available: normalizedRooms.filter((r) => r.status === 'available').length,
      occupied: normalizedRooms.filter((r) => r.status === 'occupied').length,
      issue: normalizedRooms.filter((r) => r.status === 'issue' || r.status === 'incident').length,
      disabled: normalizedRooms.filter((r) => r.status === 'disabled').length,
    };
  }, [normalizedRooms])

  const handleCardClick = (room) => {
    setSelectedRoomId((prev) => (prev === room.id ? null : room.id))
    if (onSelectRoom) {
      onSelectRoom(room)
    }
  }

  const handleKeyDown = (e, room) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleCardClick(room)
    }
  }

  const handleReserveClick = () => {
    if (selectedRoom && onReserveSpace) {
      onReserveSpace(selectedRoom)
    }
  }

  const handleIncidentClick = () => {
    if (selectedRoom && onReportIncident) {
      onReportIncident(selectedRoom)
    }
  }

  return (
    <div
      className={`relative min-h-[580px] w-full bg-[#0a0a0c] text-zinc-100 font-sans antialiased pb-28 selection:bg-zinc-800 rounded-2xl border border-zinc-900/80 overflow-hidden ${className}`}
    >
      {/* 1. Header de Telemetría Táctica y Filtros de Estado */}
      <header className="px-6 pt-6 pb-5 border-b border-zinc-900/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0e0e12]/60 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">
              Campus Control // Map
            </span>
            <span className="text-zinc-700 text-xs">/</span>
            <span className="text-xs font-mono text-zinc-400">10 Salas Operativas</span>
          </div>
          <h1 className="text-lg font-medium tracking-tight text-zinc-100 mt-1">
            Gestión y Disponibilidad de Espacios
          </h1>
        </div>

        {/* Filtros sutiles estilo Swiss/Apple */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#121215] p-1 rounded-lg border border-zinc-900">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-zinc-800/90 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            Todas ({metrics.total})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('available')}
            className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
              filterStatus === 'available'
                ? 'bg-zinc-800/90 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Disponibles ({metrics.available})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('occupied')}
            className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
              filterStatus === 'occupied'
                ? 'bg-zinc-800/90 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Ocupadas ({metrics.occupied})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('issue')}
            className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
              filterStatus === 'issue'
                ? 'bg-zinc-800/90 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Incidencias ({metrics.issue})</span>
          </button>
        </div>
      </header>

      {/* 2. Grid de 10 Salas Oficiales (lg:grid-cols-5) */}
      <main className="p-6">
        <div
          role="grid"
          aria-label="Matriz de salas del campus educativo"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5"
        >
          {filteredRooms.map((room) => {
            const isSelected = selectedRoomId === room.id
            const statusMeta = STATUS_CONFIG[room.status] || STATUS_CONFIG.available

            return (
              <div
                key={room.id}
                role="gridcell"
                tabIndex={0}
                aria-selected={isSelected}
                aria-label={`Sala ${room.name}, código ${room.id}, aforo ${room.capacity} personas, estado ${statusMeta.label}`}
                onClick={() => handleCardClick(room)}
                onKeyDown={(e) => handleKeyDown(e, room)}
                className={`group relative flex flex-col justify-between p-4 rounded-xl bg-[#121215] cursor-pointer transition-all duration-150 outline-none
                  border ${
                    isSelected
                      ? 'border-zinc-400 ring-1 ring-zinc-400/50 bg-[#16161b]'
                      : 'border-zinc-900 hover:border-zinc-700/80 hover:bg-[#141418]'
                  }
                  focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400
                `}
              >
                {/* Cabecera de la tarjeta: ID mono y microindicador de estado */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-[11px] text-zinc-500 tracking-wider">
                    {room.id}
                  </span>

                  {/* Microindicador de estado (HU-18: w-1.5 h-1.5 rounded-full) */}
                  <div className="flex items-center gap-1.5" title={statusMeta.label}>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass} ${
                        room.status === 'issue' || room.status === 'incident' ? 'animate-pulse' : ''
                      }`}
                      aria-hidden="true"
                    />
                    <span className={`text-[11px] font-mono capitalize ${statusMeta.textClass}`}>
                      {statusMeta.label}
                    </span>
                  </div>
                </div>

                {/* Cuerpo: Nombre de sala y Aforo */}
                <div className="space-y-1 my-1">
                  <h3 className="text-sm font-medium tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                    {room.name}
                  </h3>
                  <div className="flex items-baseline gap-1 text-zinc-400">
                    <span className="font-mono text-xs text-zinc-200 font-medium">
                      {room.capacity}
                    </span>
                    <span className="text-[11px] text-zinc-500">plazas de aforo</span>
                  </div>
                </div>

                {/* Pie de tarjeta: Ubicación resumida */}
                <div className="mt-4 pt-2.5 border-t border-zinc-900/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <span className="truncate max-w-[110px]" title={room.building || 'Campus Central'}>
                    {room.building || 'Campus Central'}
                  </span>
                  <span className="text-zinc-600">
                    {(room.floor || 'Nivel 1').replace('Nivel ', 'N').replace('Planta ', 'P')}
                  </span>
                </div>

                {/* Sutil halo de selección */}
                {isSelected && (
                  <span
                    className="absolute -top-px -left-px -right-px h-0.5 bg-zinc-300 rounded-t-xl"
                    aria-hidden="true"
                  />
                )}
              </div>
            )
          })}
        </div>
      </main>

      {/* 3. Panel de Acción Inferior Desplegable */}
      {selectedRoom && (
        <aside
          aria-label="Detalles de la sala seleccionada y acciones de reserva"
          className="fixed bottom-0 left-0 right-0 z-40 bg-[#121215]/95 backdrop-blur-xl border-t border-zinc-800/90 px-6 py-4 transition-all duration-200 ease-out shadow-2xl shadow-black/80"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Metadatos estructurales de la sala */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                  {selectedRoom.id}
                </span>
                <span className="text-base font-medium tracking-tight text-zinc-100">
                  {selectedRoom.name}
                </span>
              </div>

              <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="text-zinc-500">Aforo:</span>
                <span className="font-mono text-zinc-200 font-medium">
                  {selectedRoom.capacity} personas
                </span>
              </div>

              <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="text-zinc-500">Ubicación:</span>
                <span className="text-zinc-200">
                  {selectedRoom.building || 'Campus Central'} · {selectedRoom.floor || 'Nivel 1'}
                </span>
              </div>

              <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

              {/* Indicador de estado actual */}
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    (STATUS_CONFIG[selectedRoom.status] || STATUS_CONFIG.available).dotClass
                  }`}
                />
                <span
                  className={`font-mono text-xs ${
                    (STATUS_CONFIG[selectedRoom.status] || STATUS_CONFIG.available).textClass
                  }`}
                >
                  {(STATUS_CONFIG[selectedRoom.status] || STATUS_CONFIG.available).label}
                </span>
                {selectedRoom.currentSession?.until && (
                  <span className="text-zinc-500 font-mono text-[11px]">
                    (hasta {selectedRoom.currentSession.until})
                  </span>
                )}
              </div>
            </div>

            {/* Acciones directas (Botones planos, sobrios y sofisticados) */}
            <div className="flex items-center gap-2.5 self-end md:self-auto">
              <button
                type="button"
                onClick={() => setSelectedRoomId(null)}
                className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors focus:ring-1 focus:ring-zinc-400 rounded-lg outline-none cursor-pointer"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={handleIncidentClick}
                className="px-3.5 py-2 text-xs font-medium rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/30 transition-all outline-none cursor-pointer"
              >
                Reportar Falla
              </button>

              <button
                type="button"
                disabled={selectedRoom.status === 'disabled'}
                onClick={handleReserveClick}
                className={`px-4 py-2 text-xs font-medium rounded-lg tracking-wide transition-all duration-150 outline-none cursor-pointer ${
                  selectedRoom.status === 'disabled'
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-800'
                    : 'bg-zinc-100 text-zinc-900 hover:bg-white active:bg-zinc-200 focus:ring-2 focus:ring-zinc-300 shadow-sm'
                }`}
              >
                {selectedRoom.status === 'disabled'
                  ? 'Espacio inhabilitado'
                  : selectedRoom.status === 'occupied'
                  ? 'Programar próxima reserva'
                  : 'Reservar espacio'}
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}

export default CampusMap
