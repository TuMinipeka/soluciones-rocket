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
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'

export default function SpacesPage() {
  const navigate = useNavigate()
  const [spaces, setSpaces] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('10:00')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadSpaces = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getSpacesApi({ date, start_time: startTime, end_time: endTime })
      // Si la API devuelve un array directo o un objeto { spaces: [...] }
      const list = Array.isArray(data) ? data : data?.spaces || []
      setSpaces(list)
      if (selectedRoom) {
        const updated = list.find((s) => s.id === selectedRoom.id)
        if (updated) setSelectedRoom(updated)
      }
    } catch (err) {
      setError(err.message)
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
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Salas y Espacios del Campus
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Consulta visual interactiva de disponibilidad por fecha y franja horaria.
          </p>
        </div>
      </div>

      {/* Filtros de horario */}
      <Card>
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

      {error && <ErrorMessage message={error} onRetry={loadSpaces} />}

      {isLoading ? (
        <LoadingState message="Consultando disponibilidad de salas…" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RoomMap
              spaces={spaces}
              selectedRoomId={selectedRoom?.id}
              onSelectRoom={setSelectedRoom}
            />
          </div>
          <div>
            {selectedRoom ? (
              <RoomDetails
                room={selectedRoom}
                onBook={handleBookRoom}
                onClose={() => setSelectedRoom(null)}
              />
            ) : (
              <div className="h-full flex items-center justify-center p-8 rounded-2xl border border-dashed border-zinc-200 text-center text-xs text-zinc-400">
                Selecciona una sala del mapa para inspeccionar sus características y capacidad.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
