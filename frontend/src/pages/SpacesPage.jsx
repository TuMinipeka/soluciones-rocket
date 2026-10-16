import React, { useState, useMemo } from 'react';
import RoomMap, { OFFICIAL_CAMPUS_ROOMS } from '../components/spaces/RoomMap';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import EmptyState from '../components/feedback/EmptyState';

/**
 * SpacesPage: Vista principal de supervisión de espacios y plano interactivo (HU-18).
 * Admite filtrado dinámico por aforo, estado, franja horaria y búsqueda por texto.
 */
export default function SpacesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [minCapacity, setMinCapacity] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('CURRENT');
  const [rooms, setRooms] = useState(OFFICIAL_CAMPUS_ROOMS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simulación de sincronización desacoplada con backend / GET /spaces
  const handleSync = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simular latencia de red para inspección de UX
      await new Promise((resolve) => setTimeout(resolve, 500));
      setRooms([...OFFICIAL_CAMPUS_ROOMS]);
    } catch (err) {
      setError('No se pudo sincronizar la disponibilidad con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrado reactivo en memoria
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchSearch =
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'available' && room.status === 'available') ||
        (statusFilter === 'busy' && room.status === 'busy') ||
        (statusFilter === 'incident' && (room.status === 'incident' || room.status === 'maintenance'));

      const minCap = parseInt(minCapacity, 10);
      const matchCap = isNaN(minCap) || room.capacity >= minCap;

      return matchSearch && matchStatus && matchCap;
    });
  }, [rooms, searchTerm, statusFilter, minCapacity]);

  // Totales
  const totalCapacity = rooms.reduce((acc, r) => acc + r.capacity, 0);
  const availableCount = rooms.filter((r) => r.status === 'available').length;
  const busyCount = rooms.filter((r) => r.status === 'busy').length;
  const incidentCount = rooms.filter((r) => r.status === 'incident' || r.status === 'maintenance').length;

  return (
    <div className="space-y-6 animate-fluid-enter">
      {/* Cabecera de Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[rgba(255,255,255,0.08)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F5F5F7]">
              Salas y Espacios Tecnológicos
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#2563EB]/20 text-[#60A5FA] font-bold border border-[#2563EB]/30">
              10 Aulas Oficiales
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#A1A1A6] mt-1">
            Supervisión visual tipo cine del aforo oficial ({totalCapacity} puestos en campus) y ocupación en tiempo real.
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            isLoading={isLoading}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            Sincronizar
          </Button>

          <a href="/reservations">
            <Button
              variant="primary"
              size="sm"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            >
              Nueva Reserva
            </Button>
          </a>
        </div>
      </div>

      {/* Barra de KPIs Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-[1.25rem] bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#A1A1A6] uppercase tracking-wider block font-semibold">Disponibles</span>
            <span className="text-xl font-extrabold text-[#30D158]">{availableCount} salas</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-[#30D158]" />
        </div>

        <div className="p-3.5 rounded-[1.25rem] bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#A1A1A6] uppercase tracking-wider block font-semibold">En Uso</span>
            <span className="text-xl font-extrabold text-[#FF9F0A]">{busyCount} salas</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF9F0A]" />
        </div>

        <div className="p-3.5 rounded-[1.25rem] bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#A1A1A6] uppercase tracking-wider block font-semibold">Inhabilitadas</span>
            <span className="text-xl font-extrabold text-[#FF6B35]">{incidentCount} salas</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B35]" />
        </div>

        <div className="p-3.5 rounded-[1.25rem] bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#A1A1A6] uppercase tracking-wider block font-semibold">Aforo Global</span>
            <span className="text-xl font-extrabold text-[#F5F5F7]">{totalCapacity}</span>
          </div>
          <span className="text-xs text-[#A1A1A6]">asistentes</span>
        </div>
      </div>

      {/* Barra de Filtros Multifunción */}
      <div className="p-4 rounded-[1.25rem] bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] flex flex-col lg:flex-row items-center gap-3.5">
        {/* Buscador */}
        <div className="w-full lg:w-72">
          <Input
            placeholder="Buscar por nombre o ID (ej. Auditorio)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        {/* Filtros de Estado */}
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
          {[
            { id: 'ALL', label: 'Todas' },
            { id: 'available', label: 'Disponibles' },
            { id: 'busy', label: 'Ocupadas' },
            { id: 'incident', label: 'Incidencias' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`px-3 py-2 rounded-[0.75rem] text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                statusFilter === item.id
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'bg-[#2C2C2E] text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#3A3A3C]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Selector de Franja Horaria */}
        <div className="flex items-center gap-1.5 w-full lg:w-auto">
          {[
            { id: 'CURRENT', label: 'Franja Actual' },
            { id: 'MORNING', label: 'Mañana (08:00 - 12:00)' },
            { id: 'AFTERNOON', label: 'Tarde (14:00 - 18:00)' },
          ].map((slot) => (
            <button
              key={slot.id}
              onClick={() => setSelectedSlot(slot.id)}
              className={`hidden sm:inline-block px-2.5 py-2 rounded-[0.75rem] text-xs font-medium transition-colors border ${
                selectedSlot === slot.id
                  ? 'bg-[#0891B2]/20 border-[#0891B2]/40 text-[#22D3EE]'
                  : 'bg-[#2C2C2E]/50 border-transparent text-[#A1A1A6] hover:text-[#F5F5F7]'
              }`}
            >
              {slot.label}
            </button>
          ))}
        </div>

        {/* Filtro por aforo mínimo */}
        <div className="w-full lg:w-36 lg:ml-auto">
          <Input
            type="number"
            placeholder="Aforo mín..."
            value={minCapacity}
            onChange={(e) => setMinCapacity(e.target.value)}
            min="0"
          />
        </div>
      </div>

      {/* Renderizado de Sala o EmptyState */}
      {filteredRooms.length === 0 ? (
        <EmptyState
          title="Ninguna sala coincide con los filtros"
          description="Intenta reducir el aforo mínimo o limpiar los términos de búsqueda."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setMinCapacity('');
              }}
            >
              Restablecer Filtros
            </Button>
          }
        />
      ) : (
        <RoomMap
          rooms={filteredRooms}
          loading={isLoading}
          error={error}
          onRetry={handleSync}
        />
      )}
    </div>
  );
}
