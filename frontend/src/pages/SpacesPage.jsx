/**
 * Página: Mapa Interactivo de Salas y Espacios del Campus (HU-18, HU-17, HU-21)
 * Integra el plano arquitectónico 2D de Campuslands y la vista tipo cine interactiva con consulta en tiempo real:
 * - Filtros superiores de Fecha, Hora Inicial y Hora Final conectados a GET /spaces.
 * - Doble vista alternable: Plano Arquitectónico Real & Butacas de Cine.
 * - Acciones directas para Reservar Sala (HU-22) y Reportar Incidencia con IA (HU-24).
 * Responsables: GUERRA & MAFE & DANIEL
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSpacesApi } from '../api/spaces';
import CampusRealFloorplan, {
  CAMPUS_FLOORPLAN_SPACES,
} from '../components/spaces/CampusRealFloorplan';
import RoomMap, { OFFICIAL_CAMPUS_ROOMS } from '../components/spaces/RoomMap';
import LoadingState from '../components/feedback/LoadingState';
import ErrorMessage from '../components/feedback/ErrorMessage';
import EmptyState from '../components/feedback/EmptyState';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function SpacesPage() {
  const navigate = useNavigate();

  // Vista activa: 'floorplan' (Plano Arquitectónico) | 'cinema' (Butacas Cine)
  const [activeView, setActiveView] = useState('floorplan');

  // Filtros de consulta
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Estados de datos
  const [spaces, setSpaces] = useState(CAMPUS_FLOORPLAN_SPACES);
  const [selectedSpaceId, setSelectedSpaceId] = useState('SAL-005');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSpaces = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (typeof getSpacesApi === 'function') {
        const data = await getSpacesApi({
          date,
          start_time: startTime,
          end_time: endTime,
          start_at: startTime,
          end_at: endTime,
        });
        const list = Array.isArray(data) ? data : data?.spaces || data?.data || data?.items || [];
        if (list.length > 0) {
          // Enriquecer salas recibidas del backend con los metadatos de ubicación del plano
          const merged = CAMPUS_FLOORPLAN_SPACES.map((floorSpace) => {
            const apiRoom = list.find((s) => s.id === floorSpace.id || s.name?.toLowerCase() === floorSpace.name?.toLowerCase());
            return apiRoom ? { ...floorSpace, ...apiRoom } : floorSpace;
          });
          setSpaces(merged);
        } else {
          setSpaces(CAMPUS_FLOORPLAN_SPACES);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setSpaces(CAMPUS_FLOORPLAN_SPACES);
      }
    } catch (err) {
      setError(err?.message || 'No se pudo consultar la disponibilidad telemática de salas.');
      setSpaces(CAMPUS_FLOORPLAN_SPACES);
    } finally {
      setIsLoading(false);
    }
  }, [date, startTime, endTime]);

  useEffect(() => {
    loadSpaces();
  }, [loadSpaces]);

  // Manejadores de navegación transaccional
  const handleBookRoom = (room) => {
    navigate('/reservations', {
      state: {
        preselectedSpaceId: room.id,
        preselectedDate: date,
        preselectedStartTime: startTime,
        preselectedEndTime: endTime,
      },
    });
  };

  const handleReportIncident = (room) => {
    navigate('/incidents', {
      state: {
        preselectedSpaceId: room.id,
      },
    });
  };

  // Filtrado reactivo para la vista cine
  const filteredSpaces = useMemo(() => {
    return spaces.filter((room) => {
      const matchSearch =
        room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.id?.toLowerCase().includes(searchTerm.toLowerCase());

      const normStatus = (room.status || (room.is_blocked ? 'disabled' : 'available')).toLowerCase();
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'available' && normStatus === 'available') ||
        (statusFilter === 'occupied' && (normStatus === 'occupied' || normStatus === 'busy')) ||
        (statusFilter === 'disabled' && (normStatus === 'disabled' || normStatus === 'maintenance'));

      return matchSearch && matchStatus;
    });
  }, [spaces, searchTerm, statusFilter]);

  const availableCount = spaces.filter((r) => r.status === 'available' && !r.is_blocked).length;
  const occupiedCount = spaces.filter((r) => r.status === 'occupied' || r.status === 'busy').length;
  const disabledCount = spaces.filter((r) => r.status === 'disabled' || r.is_blocked).length;
  const totalCapacity = spaces.reduce((acc, r) => acc + (r.capacity || 0), 0);

  return (
    <div className="space-y-6 animate-fluid-enter" role="region" aria-label="Salas y Espacios del Campus">
      {/* Cabecera Principal con Identidad y Enclave */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Salas y Espacios del Campus
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1C1C1E] text-[#22D3EE] border border-white/[0.08] uppercase tracking-wider">
              Enclave Activo
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#A1A1A6] mt-1">
            Plano arquitectónico interactivo con evaluación de disponibilidad horaria y aforos ({totalCapacity} plazas) en tiempo real.
          </p>
        </div>

        {/* Acciones Rápidas y Selector de Vista */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tabs de Vista */}
          <div className="flex items-center bg-[#1C1C1E] p-1 rounded-xl border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setActiveView('floorplan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'floorplan'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#A1A1A6] hover:text-white'
              }`}
            >
              Plano 2D
            </button>
            <button
              type="button"
              onClick={() => setActiveView('cinema')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'cinema'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#A1A1A6] hover:text-white'
              }`}
            >
              Butacas Cine
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadSpaces}
            isLoading={isLoading}
            icon={
              <svg className="w-3.5 h-3.5 text-[#22D3EE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            Actualizar
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/reservations')}
          >
            Nueva Reserva
          </Button>
        </div>
      </div>

      {/* Barra de Control de Disponibilidad Horaria (HU-18) */}
      <div className="p-4 rounded-[1.25rem] bg-[#16181F] border border-white/[0.08] shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Fecha de consulta"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            label="Hora de inicio"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <Input
            label="Hora de fin"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#1C1C1E] border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#A1A1A6] uppercase tracking-wider block font-semibold">Disponibles</span>
            <span className="text-xl font-extrabold text-[#30D158]">{availableCount} salas</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-[#30D158]" />
        </div>

        <div className="p-3.5 rounded-xl bg-[#1C1C1E] border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#A1A1A6] uppercase tracking-wider block font-semibold">Ocupadas</span>
            <span className="text-xl font-extrabold text-[#FF9F0A]">{occupiedCount} salas</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF9F0A]" />
        </div>

        <div className="p-3.5 rounded-xl bg-[#1C1C1E] border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#A1A1A6] uppercase tracking-wider block font-semibold">Inhabilitadas</span>
            <span className="text-xl font-extrabold text-[#FF453A]">{disabledCount} salas</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF453A]" />
        </div>

        <div className="p-3.5 rounded-xl bg-[#1C1C1E] border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#A1A1A6] uppercase tracking-wider block font-semibold">Aforo Franja</span>
            <span className="text-xl font-extrabold text-[#F5F5F7]">{totalCapacity} plazas</span>
          </div>
          <span className="text-xs text-[#22D3EE] font-mono">100%</span>
        </div>
      </div>

      {/* Estados de Carga, Error y Vistas */}
      {isLoading ? (
        <LoadingState message="Consultando disponibilidad telemática de salas en tiempo real…" />
      ) : error ? (
        <div className="space-y-4">
          <ErrorMessage message={error} onRetry={loadSpaces} />
          {activeView === 'floorplan' ? (
            <CampusRealFloorplan
              spaces={spaces}
              selectedSpaceId={selectedSpaceId}
              onSelectSpace={(s) => setSelectedSpaceId(s.id)}
              onBook={handleBookRoom}
              onReportIncident={handleReportIncident}
            />
          ) : (
            <RoomMap
              rooms={spaces}
              loading={false}
              error={null}
              onRetry={loadSpaces}
            />
          )}
        </div>
      ) : spaces.length === 0 ? (
        <EmptyState
          title="Sin salas registradas"
          description="No se encontraron salas en el catálogo del campus."
        />
      ) : activeView === 'floorplan' ? (
        <CampusRealFloorplan
          spaces={spaces}
          selectedSpaceId={selectedSpaceId}
          onSelectSpace={(room) => setSelectedSpaceId(room.id)}
          onBook={handleBookRoom}
          onReportIncident={handleReportIncident}
        />
      ) : (
        <div className="space-y-4">
          {/* Barra de Filtros para vista cine */}
          <div className="p-4 rounded-xl bg-[#1C1C1E] border border-white/[0.08] flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:w-72">
              <Input
                placeholder="Buscar sala por nombre o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              {[
                { id: 'ALL', label: 'Todas' },
                { id: 'available', label: 'Disponibles' },
                { id: 'occupied', label: 'Ocupadas' },
                { id: 'disabled', label: 'Inhabilitadas' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setStatusFilter(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === item.id
                      ? 'bg-[#2563EB] text-white shadow-sm'
                      : 'bg-[#2C2C2E] text-[#A1A1A6] hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <RoomMap
            rooms={filteredSpaces}
            loading={false}
            error={null}
            onRetry={loadSpaces}
          />
        </div>
      )}
    </div>
  );
}
