import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as spacesApi from '../api/spaces';
import RoomMap, { OFFICIAL_CAMPUS_ROOMS } from '../components/spaces/RoomMap';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import LoadingState from '../components/feedback/LoadingState';
import EmptyState from '../components/feedback/EmptyState';
import ErrorMessage from '../components/feedback/ErrorMessage';

/**
 * SpacesPage: Conexión dinámica del Mapa de Salas con API y gestión de estados (HU-18).
 * Consume GET /spaces con filtros de franja (date, start_at, end_at) y maneja carga, error y vacío.
 */
export default function SpacesPage() {
  // 1. Estado reactivo para filtros (por defecto fecha actual en formato ISO)
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startAt, setStartAt] = useState('08:00');
  const [endAt, setEndAt] = useState('10:00');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [minCapacity, setMinCapacity] = useState('');

  // 2. Estados de ciclo de vida de datos
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 3. Invocación desacoplada a la API de espacios
  const fetchSpacesData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const client = spacesApi.getSpacesApi || spacesApi.getSpaces;
      if (typeof client === 'function') {
        const params = {
          date,
          start_at: startAt,
          end_at: endAt,
          start_time: startAt,
          end_time: endAt,
        };
        const response = await getSpacesClient(params);
        const data = Array.isArray(response) ? response : response?.data || response?.items || [];

        if (Array.isArray(data) && data.length > 0) {
          setRooms(data);
        } else {
          setRooms([]);
        }
      } else {
        // Fallback controlado si la API de Guerra aún no está exportada
        await new Promise((resolve) => setTimeout(resolve, 300));
        setRooms(OFFICIAL_CAMPUS_ROOMS);
      }
    } catch (err) {
      // Registrar error con mensaje legible para el usuario
      const errMessage =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Error al conectar con el servicio de espacios de Campuslands.';
      setError(errMessage);
    } finally {
      setIsLoading(false);
    }
  }, [date, startAt, endAt]);

  // Invocar al montar y al cambiar fecha o franjas horarias
  useEffect(() => {
    fetchSpacesData();
  }, [fetchSpacesData]);

  // Filtrado reactivo en cliente (búsqueda, aforo y estado)
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchSearch =
        room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.id?.toLowerCase().includes(searchTerm.toLowerCase());

      const normalizedStatus = (room.status || (room.is_blocked ? 'disabled' : 'available')).toLowerCase();
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'available' && normalizedStatus === 'available') ||
        (statusFilter === 'occupied' && (normalizedStatus === 'occupied' || normalizedStatus === 'busy')) ||
        (statusFilter === 'incident' && normalizedStatus === 'incident') ||
        (statusFilter === 'disabled' && (normalizedStatus === 'disabled' || normalizedStatus === 'maintenance'));

      const minCap = parseInt(minCapacity, 10);
      const matchCap = isNaN(minCap) || (room.capacity || 0) >= minCap;

      return matchSearch && matchStatus && matchCap;
    });
  }, [rooms, searchTerm, statusFilter, minCapacity]);

  // Contadores dinámicos del payload devuelto
  const totalCapacity = rooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
  const availableCount = rooms.filter((r) => r.status === 'available' && !r.is_blocked).length;
  const occupiedCount = rooms.filter((r) => r.status === 'occupied' || r.status === 'busy').length;
  const disabledCount = rooms.filter((r) => r.status === 'disabled' || r.status === 'maintenance' || r.is_blocked).length;

  return (
    <div className="space-y-6 animate-fluid-enter" role="region" aria-label="Supervisión de Salas">
      {/* Cabecera y Sincronización */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[rgba(255,255,255,0.08)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F5F5F7]">
              Salas y Disponibilidad
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#2563EB]/20 text-[#60A5FA] font-bold border border-[#2563EB]/30">
              HU-18 &bull; Conexión API
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#A1A1A6] mt-1">
            Plano interactivo tipo cine con aforos oficiales ({totalCapacity} plazas) y verificación en tiempo real de solapamientos.
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSpacesData}
            isLoading={isLoading}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            Actualizar
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

      {/* Selector Reactivo de Franja de Disponibilidad (date, start_at, end_at) */}
      <div className="p-4 rounded-[1.25rem] bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <label htmlFor="space-date" className="text-xs font-bold text-[#A1A1A6] uppercase tracking-wider shrink-0">
              Fecha:
            </label>
            <input
              id="space-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-[#2C2C2E] text-[#F5F5F7] text-xs font-semibold px-3 py-2 rounded-[0.75rem] border border-[rgba(255,255,255,0.08)] outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="space-start" className="text-xs font-bold text-[#A1A1A6] uppercase tracking-wider shrink-0">
              Desde:
            </label>
            <input
              id="space-start"
              type="time"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="bg-[#2C2C2E] text-[#F5F5F7] text-xs font-semibold px-3 py-2 rounded-[0.75rem] border border-[rgba(255,255,255,0.08)] outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="space-end" className="text-xs font-bold text-[#A1A1A6] uppercase tracking-wider shrink-0">
              Hasta:
            </label>
            <input
              id="space-end"
              type="time"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="bg-[#2C2C2E] text-[#F5F5F7] text-xs font-semibold px-3 py-2 rounded-[0.75rem] border border-[rgba(255,255,255,0.08)] outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>
        </div>

        <div className="text-xs text-[#A1A1A6] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#30D158]" />
          <span>Calculando disponibilidad en franja consultada</span>
        </div>
      </div>

      {/* Barra de KPIs Resumen Dinámico */}
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
            <span className="text-[11px] text-[#A1A1A6] uppercase tracking-wider block font-semibold">Ocupadas</span>
            <span className="text-xl font-extrabold text-[#FF9F0A]">{occupiedCount} salas</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF9F0A]" />
        </div>

        <div className="p-3.5 rounded-[1.25rem] bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#A1A1A6] uppercase tracking-wider block font-semibold">Inhabilitadas</span>
            <span className="text-xl font-extrabold text-[#FF453A]">{disabledCount} salas</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF453A]" />
        </div>

        <div className="p-3.5 rounded-[1.25rem] bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#A1A1A6] uppercase tracking-wider block font-semibold">Aforo Franja</span>
            <span className="text-xl font-extrabold text-[#F5F5F7]">{totalCapacity}</span>
          </div>
          <span className="text-xs text-[#A1A1A6]">asistentes</span>
        </div>
      </div>

      {/* Barra de Filtros de Texto y Estado */}
      <div className="p-4 rounded-[1.25rem] bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] flex flex-col lg:flex-row items-center gap-3.5">
        <div className="w-full lg:w-72">
          <Input
            placeholder="Buscar sala por nombre o ID (ej. Spooki)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
          {[
            { id: 'ALL', label: 'Todas' },
            { id: 'available', label: 'Disponibles' },
            { id: 'occupied', label: 'Ocupadas' },
            { id: 'disabled', label: 'Inhabilitadas' },
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

      {/* Manejo de los 3 estados obligatorios: Cargando, Error, Vacío/Éxito */}
      {isLoading ? (
        <LoadingState message="Consultando disponibilidad de salas en backend..." />
      ) : error ? (
        <div className="space-y-4">
          <ErrorMessage
            title="Fallo al obtener espacios"
            message={error}
            onRetry={fetchSpacesData}
          />
          <div className="text-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null);
                setRooms(OFFICIAL_CAMPUS_ROOMS);
              }}
            >
              Cargar datos locales del SEED (Modo Contingencia)
            </Button>
          </div>
        </div>
      ) : filteredRooms.length === 0 ? (
        <EmptyState
          title="Sin salas para la franja seleccionada"
          description="No se encontraron salas que cumplan con los criterios de búsqueda o capacidad para este horario."
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
          loading={false}
          error={null}
          onRetry={fetchSpacesData}
        />
      )}
    </div>
  );
}
