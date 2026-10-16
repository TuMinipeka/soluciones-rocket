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

// Catálogo oficial de las 10 salas del campus (Fuente: backend/app/services/availability.py)
const DEFAULT_OFFICIAL_SPACES = [
  { id: 'SAL-001', code: 'SAL-001', name: 'Auditorio', capacity: 100, status: 'available', resources: ['Proyector láser', 'Sistema de sonido', 'Micrófonos inalámbricos', 'Escenario'] },
  { id: 'SAL-002', code: 'SAL-002', name: 'Cosmos', capacity: 25, status: 'available', resources: ['Smart TV 75"', 'Cámaras de videoconferencia', 'Pizarra acrílica'] },
  { id: 'SAL-003', code: 'SAL-003', name: 'Skilab', capacity: 20, status: 'available', resources: ['Estaciones de trabajo iMac', 'Tabletas gráficas', 'Conectividad Gigabit'] },
  { id: 'SAL-004', code: 'SAL-004', name: 'Spooki', capacity: 38, status: 'available', resources: ['Proyector FHD', 'Aire acondicionado doble', 'Pizarra panorámica'] },
  { id: 'SAL-005', code: 'SAL-005', name: 'Apolo', capacity: 34, status: 'available', resources: ['Pizarra interactiva', 'Audio distribuido', 'Conexiones HDMI individuales'] },
  { id: 'SAL-006', code: 'SAL-006', name: 'Blanca', capacity: 12, status: 'available', resources: ['Mesa de directorio', 'Pantalla 55"', 'Cámara 4K'] },
  { id: 'SAL-007', code: 'SAL-007', name: 'Azul', capacity: 10, status: 'available', resources: ['Pizarra de cristal', 'Videoconferencia Polycom'] },
  { id: 'SAL-008', code: 'SAL-008', name: 'Amarillas', capacity: 6, status: 'available', resources: ['Monitor 43"', 'Mesa redonda'] },
  { id: 'SAL-009', code: 'SAL-009', name: 'Verdes', capacity: 6, status: 'available', resources: ['Monitor 43"', 'Pizarra pequeña'] },
  { id: 'SAL-010', code: 'SAL-010', name: 'Artemis', capacity: 32, status: 'available', resources: ['Laptops de desarrollo', 'Proyector 4K', 'Audio envolvente'] },
]

export default function SpacesPage() {
  const navigate = useNavigate()
  const [spaces, setSpaces] = useState(DEFAULT_OFFICIAL_SPACES)
  const [selectedRoom, setSelectedRoom] = useState(DEFAULT_OFFICIAL_SPACES[1]) // Cosmos preseleccionado
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
        setSpaces(list)
        if (selectedRoom) {
          const updated = list.find((s) => s.id === selectedRoom.id)
          if (updated) setSelectedRoom(updated)
        }
      }
    } catch {
      // Si la API aún no tiene endpoint de salas montado por Conde, usamos el catálogo oficial como base determinista
      setSpaces(DEFAULT_OFFICIAL_SPACES)
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

      {error && <ErrorMessage message={error} onRetry={loadSpaces} />}

      {isLoading ? (
        <LoadingState message="Consultando disponibilidad de salas…" />
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
