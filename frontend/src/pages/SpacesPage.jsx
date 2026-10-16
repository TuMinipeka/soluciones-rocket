/**
 * Página: Mapa Interactivo de Salas y Espacios del Campus (HU-18, HU-17, HU-21)
 * Integra el plano arquitectónico 2D de Campuslands con consulta en tiempo real:
 * - Filtros superiores de Fecha, Hora Inicial y Hora Final conectados a GET /spaces.
 * - Doble visualización: Plano Arquitectónico Real (Evacuación) y Cuadrícula Resumida.
 * - Acciones directas para Reservar Sala (HU-22) y Reportar Incidencia con IA (HU-24).
 * Responsables: GUERRA & MAFE
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSpacesApi } from '../api/spaces'
import CampusRealFloorplan, {
  CAMPUS_FLOORPLAN_SPACES,
} from '../components/spaces/CampusRealFloorplan'
import LoadingState from '../components/feedback/LoadingState'
import ErrorMessage from '../components/feedback/ErrorMessage'
import Input from '../components/ui/Input'

export default function SpacesPage() {
  const navigate = useNavigate()
  const [spaces, setSpaces] = useState(CAMPUS_FLOORPLAN_SPACES)
  const [selectedSpaceId, setSelectedSpaceId] = useState('SAL-005') // Apolo por defecto

  // Filtros de franja horaria para consulta en tiempo real
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('10:00')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadSpaces = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getSpacesApi({ date, start_time: startTime, end_time: endTime })
      const list = Array.isArray(data) ? data : data?.spaces || []
      if (list.length > 0) {
        // Enriquecer salas recibidas del backend con los metadatos de ubicación del plano
        const merged = CAMPUS_FLOORPLAN_SPACES.map((floorSpace) => {
          const apiRoom = list.find((s) => s.id === floorSpace.id)
          return apiRoom ? { ...floorSpace, ...apiRoom } : floorSpace
        })
        setSpaces(merged)
      } else {
        setSpaces(CAMPUS_FLOORPLAN_SPACES)
      }
    } catch {
      // Fallback determinista con las 10 salas del catálogo oficial
      setSpaces(CAMPUS_FLOORPLAN_SPACES)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSpaces()
  }, [date, startTime, endTime])

  const handleBookRoom = (room) => {
    navigate('/reservations', {
      state: {
        preselectedSpaceId: room.id,
        preselectedDate: date,
        preselectedStartTime: startTime,
        preselectedEndTime: endTime,
      },
    })
  }

  const handleReportIncident = (room) => {
    navigate('/incidents', {
      state: {
        preselectedSpaceId: room.id,
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Cabecera Principal con Identidad y Enclave */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Salas y Espacios del Campus
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1c1c1e] text-[#22d3ee] border border-white/[0.08] uppercase tracking-wider">
              Enclave Activo
            </span>
          </div>
          <p className="text-sm text-[#a1a1a6] mt-1">
            Plano arquitectónico interactivo con evaluación de disponibilidad horaria y aforos en tiempo real.
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSpaces}
            className="px-3.5 py-2 rounded-xl bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer select-none"
          >
            <svg className="w-3.5 h-3.5 text-[#22d3ee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Barra de Control de Disponibilidad Horaria (HU-18) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#16181f] border border-white/[0.08] shadow-lg">
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

      {error && <ErrorMessage message={error} onRetry={loadSpaces} />}

      {/* Plano Arquitectónico 2D Oficial */}
      {isLoading ? (
        <LoadingState message="Consultando disponibilidad telemática de salas en tiempo real…" />
      ) : (
        <CampusRealFloorplan
          spaces={spaces}
          selectedSpaceId={selectedSpaceId}
          onSelectSpace={(s) => setSelectedSpaceId(s.id)}
          onBook={handleBookRoom}
          onReportIncident={handleReportIncident}
        />
      )}
    </div>
  )
}
