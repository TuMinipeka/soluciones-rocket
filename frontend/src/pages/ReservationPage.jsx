/**
 * Página: Formulario y Gestión de Reservas (HU-03, HU-04, HU-22)
 * Permite seleccionar sala, fecha, horario y asistentes con validación estricta de aforo y solapamiento.
 * Responsable: GUERRA
 */

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getSpacesApi } from '../api/spaces'
import {
  createReservationApi,
  getReservationsApi,
  cancelReservationApi,
} from '../api/reservations'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Table from '../components/ui/Table'
import LoadingState from '../components/feedback/LoadingState'
import ErrorMessage from '../components/feedback/ErrorMessage'
import SuccessMessage from '../components/feedback/SuccessMessage'

// Catálogo oficial de las 10 salas del campus (Fuente: backend/app/services/availability.py)
const DEFAULT_OFFICIAL_SPACES = [
  { id: 'SAL-001', name: 'Auditorio', capacity: 100 },
  { id: 'SAL-002', name: 'Cosmos', capacity: 25 },
  { id: 'SAL-003', name: 'Skilab', capacity: 20 },
  { id: 'SAL-004', name: 'Spooki', capacity: 38 },
  { id: 'SAL-005', name: 'Apolo', capacity: 34 },
  { id: 'SAL-006', name: 'Blanca', capacity: 12 },
  { id: 'SAL-007', name: 'Azul', capacity: 10 },
  { id: 'SAL-008', name: 'Amarillas', capacity: 6 },
  { id: 'SAL-009', name: 'Verdes', capacity: 6 },
  { id: 'SAL-010', name: 'Artemis', capacity: 32 },
]

export default function ReservationPage() {
  const location = useLocation()
  const pre = location.state || {}

  // Listados
  const [spaces, setSpaces] = useState(DEFAULT_OFFICIAL_SPACES)
  const [myReservations, setMyReservations] = useState([])

  // Campos del formulario
  const [spaceId, setSpaceId] = useState(pre.preselectedSpaceId ? String(pre.preselectedSpaceId) : 'SAL-002')
  const [date, setDate] = useState(pre.preselectedDate || new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState(pre.preselectedStartTime || '08:00')
  const [endTime, setEndTime] = useState(pre.preselectedEndTime || '10:00')
  const [attendees, setAttendees] = useState(20)
  const [title, setTitle] = useState('')

  // Estados de interfaz
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Cargar salas y reservas actuales
  const loadInitialData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [spacesData, resData] = await Promise.all([
        getSpacesApi({ date }).catch(() => DEFAULT_OFFICIAL_SPACES),
        getReservationsApi().catch(() => []),
      ])

      const spaceList = Array.isArray(spacesData) ? spacesData : spacesData?.spaces || DEFAULT_OFFICIAL_SPACES
      setSpaces(spaceList.length > 0 ? spaceList : DEFAULT_OFFICIAL_SPACES)

      const resList = Array.isArray(resData) ? resData : resData?.reservations || []
      setMyReservations(resList)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [date])

  const selectedSpace = spaces.find((s) => String(s.id) === String(spaceId)) || spaces[0]
  const isOverCapacity = selectedSpace && Number(attendees) > Number(selectedSpace.capacity)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validaciones visuales y de negocio inmediatas (HU-03 / HU-22)
    if (!spaceId) {
      setError('Por favor selecciona una sala para la reserva.')
      return
    }

    if (startTime >= endTime) {
      setError('La hora de inicio debe ser estrictamente anterior a la hora de finalización.')
      return
    }

    if (isOverCapacity) {
      setError(
        `Aforo excedido: la sala ${selectedSpace.name} tiene capacidad máxima de ${selectedSpace.capacity} personas (${attendees} solicitados).`
      )
      return
    }

    if (selectedSpace?.status === 'disabled') {
      setError(`La sala ${selectedSpace.name} se encuentra inhabilitada actualmente.`)
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        space_id: spaceId,
        date,
        start_time: startTime,
        end_time: endTime,
        attendees: Number(attendees),
        title: title.trim() || `Reserva en ${selectedSpace?.name || 'Sala'}`,
      }

      const result = await createReservationApi(payload)
      const reservationId = result.id || result.reservation_id || 'RES-' + Math.floor(1000 + Math.random() * 9000)

      setSuccess(`Reserva confirmada con identificador oficial: #${reservationId}`)
      setTitle('')

      // Recargar reservas
      const updatedRes = await getReservationsApi().catch(() => [])
      setMyReservations(Array.isArray(updatedRes) ? updatedRes : updatedRes?.reservations || [])
    } catch (err) {
      setError(err.message || 'No fue posible confirmar la reserva. Verifica posibles conflictos de horario.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelReservation = async (id) => {
    if (!window.confirm('¿Seguro que deseas cancelar esta reserva?')) return

    setError(null)
    try {
      await cancelReservationApi(id)
      setSuccess(`Reserva #${id} cancelada exitosamente.`)
      setMyReservations((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  const reservationColumns = [
    {
      header: 'ID',
      accessor: 'id',
      render: (r) => <span className="font-mono font-bold text-zinc-900">#{r.id}</span>,
    },
    {
      header: 'Sala',
      accessor: 'space_name',
      render: (r) => (
        <span className="font-semibold text-zinc-900">
          {r.space_name || r.space_id || 'Sala'}
        </span>
      ),
    },
    {
      header: 'Fecha y Horario',
      accessor: 'date',
      render: (r) => `${r.date} (${r.start_time} - ${r.end_time})`,
    },
    {
      header: 'Asistentes',
      accessor: 'attendees',
      render: (r) => `${r.attendees} personas`,
    },
    {
      header: 'Estado',
      accessor: 'status',
      render: (r) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            r.status === 'cancelled'
              ? 'bg-zinc-100 text-zinc-500'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {r.status || 'confirmada'}
        </span>
      ),
    },
    {
      header: 'Acción',
      render: (r) =>
        r.status !== 'cancelled' ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-rose-600 hover:text-rose-800"
            onClick={() => handleCancelReservation(r.id)}
          >
            Cancelar
          </Button>
        ) : null,
    },
  ]

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Reserva de Salas y Espacios
          </h1>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200 uppercase tracking-wider">
            HU-22 Integración
          </span>
        </div>
        <p className="text-sm text-zinc-500 mt-1">
          Planifica actividades académicas asegurando disponibilidad en tiempo real y cumplimiento de aforo.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Formulario de reserva integrado */}
        <div className="lg:col-span-1">
          <Card title="Nueva Reserva" subtitle="Programa una franja horaria">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Sala Oficial *
                </label>
                <select
                  value={spaceId}
                  onChange={(e) => setSpaceId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200/90 bg-white/90 px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900"
                  disabled={isSubmitting || isLoading}
                >
                  {spaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name} (Capacidad: {space.capacity} personas)
                    </option>
                  ))}
                </select>
                {selectedSpace && (
                  <div className="mt-2 flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200/60">
                    <span className="text-zinc-500">Capacidad máxima:</span>
                    <span className="font-bold text-zinc-900">{selectedSpace.capacity} personas</span>
                  </div>
                )}
              </div>

              <Input
                label="Título de la actividad"
                placeholder="Ej. Taller de Algoritmos en Python"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />

              <Input
                label="Fecha de la reserva"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isSubmitting}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Hora inicio"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={isSubmitting}
                />
                <Input
                  label="Hora fin"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Input
                  label="Número de asistentes"
                  type="number"
                  min="1"
                  required
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value)}
                  disabled={isSubmitting}
                  error={isOverCapacity ? `Excede la capacidad de ${selectedSpace?.capacity} personas` : null}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                isLoading={isSubmitting}
                disabled={isOverCapacity}
              >
                {isSubmitting ? 'Confirmando reserva…' : 'Confirmar Reserva'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Listado de reservas registradas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Historial de Reservas ({myReservations.length})
            </h3>
          </div>

          {isLoading ? (
            <div className="p-8 rounded-3xl bg-white border border-zinc-200/80">
              <LoadingState message="Cargando reservas vigentes…" />
            </div>
          ) : (
            <Table
              columns={reservationColumns}
              data={myReservations}
              emptyMessage="No hay reservas registradas para esta franja."
            />
          )}
        </div>
      </div>
    </div>
  )
}
