/**
 * Página: Mapa Interactivo de Salas (HU-18)
 * Área: MAFE (consumidor de api/spaces.js preparado por GUERRA).
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSpacesApi } from '../api/spaces'
import RoomMap from '../components/spaces/RoomMap'
import RoomDetails from '../components/spaces/RoomDetails'
import LoadingState from '../components/feedback/LoadingState'
import ErrorMessage from '../components/feedback/ErrorMessage'
import EmptyState from '../components/feedback/EmptyState'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'

export default function SpacesPage() {
  const navigate = useNavigate()
  const [spaces, setSpaces] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
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
      setSelectedRoom((current) => list.find((room) => room.id === current?.id) || null)
    } catch (err) {
      setSpaces([])
      setSelectedRoom(null)
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Salas y Espacios del Campus
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1c1c1e] text-[#22d3ee] border border-white/[0.08] uppercase tracking-wider">
              10 Salas Oficiales
            </span>
          </div>
          <p className="text-sm text-[#a1a1a6] mt-1">
            Visualización interactiva tipo cine por fecha y franja horaria.
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <RoomMap
              spaces={spaces}
              selectedRoomId={selectedRoom?.id}
              onSelectRoom={setSelectedRoom}
            />
          </div>
          <div className="sticky top-20">
            {selectedRoom ? (
              <RoomDetails
                room={selectedRoom}
                onBook={handleBookRoom}
                onClose={() => setSelectedRoom(null)}
              />
            ) : (
              <div className="h-64 flex flex-col items-center justify-center p-8 rounded-[20px] border border-dashed border-white/[0.1] text-center text-xs text-[#8d90a0] bg-[#141416]/60">
                <span className="text-2xl mb-2 text-[#22d3ee]">🏛️</span>
                <span>Selecciona una sala del mapa para inspeccionar sus características y aforo.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
