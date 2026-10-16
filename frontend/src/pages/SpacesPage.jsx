/**
 * Página: Mapa Interactivo de Salas (HU-18)
 * Área: MAFE (consumidor de api/spaces.js preparado por GUERRA).
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSpacesApi } from '../api/spaces'
import CampusRealFloorplan from '../components/spaces/CampusRealFloorplan'
import LoadingState from '../components/feedback/LoadingState'
import ErrorMessage from '../components/feedback/ErrorMessage'
import EmptyState from '../components/feedback/EmptyState'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'

export default function SpacesPage() {
  const navigate = useNavigate()
  const [spaces, setSpaces] = useState([])
  const [selectedSpaceId, setSelectedSpaceId] = useState(null)
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
      setSpaces(list)
      setSelectedSpaceId((current) => list.some((room) => room.id === current) ? current : list[0]?.id || null)
    } catch (err) {
      setSpaces([])
      setSelectedSpaceId(null)
      setError(err.message || 'No se pudo consultar la disponibilidad de salas.')
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
    navigate('/incidents', { state: { preselectedSpaceId: room.id } })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Salas y Espacios del Campus
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1c1c1e] text-[#22d3ee] border border-white/[0.08] uppercase tracking-wider">
              {spaces.length} salas registradas
            </span>
          </div>
          <p className="text-sm text-[#a1a1a6] mt-1">
            Disponibilidad de salas por fecha y franja horaria.
          </p>
        </div>
      </div>

      {/* Barra de control de horario */}
      <Card className="shadow-xs">
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
      </Card>

      {isLoading ? (
        <LoadingState message="Consultando disponibilidad de salas…" />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadSpaces} />
      ) : spaces.length === 0 ? (
        <EmptyState title="Sin salas disponibles" description="No hay salas registradas para mostrar." />
      ) : (
        <CampusRealFloorplan
          spaces={spaces}
          selectedSpaceId={selectedSpaceId}
          onSelectSpace={(room) => setSelectedSpaceId(room.id)}
          onBook={handleBookRoom}
          onReportIncident={handleReportIncident}
        />
      )}
    </div>
  )
}
