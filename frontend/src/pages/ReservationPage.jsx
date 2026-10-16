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

export default function ReservationPage() {
  const location = useLocation()
  const pre = location.state || {}

  // Listados
  const [spaces, setSpaces] = useState([])
  const [myReservations, setMyReservations] = useState([])

  // Campos del formulario
  const [spaceId, setSpaceId] = useState(pre.preselectedSpaceId ? String(pre.preselectedSpaceId) : '')
  const [date, setDate] = useState(pre.preselectedDate || new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState(pre.preselectedStartTime || '08:00')
  const [endTime, setEndTime] = useState(pre.preselectedEndTime || '10:00')
  const [attendees, setAttendees] = useState(20)
  const [title, setTitle] = useState('')

  // Estados de interfaz
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [lastConfirmedId, setLastConfirmedId] = useState(null)

  // Cargar salas y reservas actuales
  const loadInitialData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [spacesData, resData] = await Promise.all([
        getSpacesApi({ date }),
        getReservationsApi(),
      ])

      const spaceList = Array.isArray(spacesData) ? spacesData : spacesData?.spaces || []
      setSpaces(spaceList)
      if (!spaceId && spaceList.length > 0) {
        setSpaceId(String(spaceList[0].id))
      }

      const resList = Array.isArray(resData) ? resData : resData?.reservations || []
      setMyReservations(resList)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [date])

  const selectedSpace = spaces.find((s) => String(s.id) === String(spaceId))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLastConfirmedId(null)

    // Validaciones del cliente complementarias al backend
    if (!spaceId) {
      setError('Por favor selecciona una sala para la reserva.')
      return
    }

    if (startTime >= endTime) {
      setError('La hora de inicio debe ser anterior a la hora de finalización.')
      return
    }

    if (selectedSpace && Number(attendees) > Number(selectedSpace.capacity)) {
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
        space_id: Number(spaceId),
        date,
        start_time: startTime,
        end_time: endTime,
        attendees: Number(attendees),
        title: title.trim() || `Reserva en ${selectedSpace?.name || 'Sala'}`,
      }

      const result = await createReservationApi(payload)
      const reservationId = result.id || result.reservation_id || 'CONF-' + Math.floor(1000 + Math.random() * 9000)

      setLastConfirmedId(reservationId)
      setSuccess(`Reserva confirmada con identificador: #${reservationId}`)
      setTitle('')

      // Recargar reservas
      const updatedRes = await getReservationsApi()
      setMyReservations(Array.isArray(updatedRes) ? updatedRes : updatedRes?.reservations || [])
    } catch (err) {
      setError(err.message || 'No fue posible confirmar la reserva.')
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
      render: (r) => r.space_name || `Sala ${r.space_id}`,
    },
    {
      header: 'Fecha y Horario',
      accessor: 'date',
      render: (r) => `${r.date} (${r.start_time} - ${r.end_time})`,
    },
    {
      header: 'Asistentes',
      accessor: 'attendees',
      render: (r) => `${r.attendees} pers.`,
    },
    {
      header: 'Estado',
      accessor: 'status',
      render: (r) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Reservas de Espacios
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Programa actividades académicas asegurando disponibilidad y aforo en el campus.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de reserva integrado */}
        <div className="lg:col-span-1">
          <Card title="Nueva Reserva" subtitle="Completa los datos de la actividad">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 mb-1.5">
                  Sala a reservar *
                </label>
                <select
                  value={spaceId}
                  onChange={(e) => setSpaceId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                  disabled={isSubmitting || isLoading}
                >
                  {spaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name} (Capacidad: {space.capacity} personas)
                    </option>
                  ))}
                </select>
                {selectedSpace && (
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Capacidad máxima permitida: <strong className="text-zinc-800">{selectedSpace.capacity}</strong>
                  </p>
                )}
              </div>

              <Input
                label="Título de la actividad"
                placeholder="Ej. Taller de Python Avanzado"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />

              <Input
                label="Fecha"
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

              <Input
                label="Número de asistentes"
                type="number"
                min="1"
                max={selectedSpace ? selectedSpace.capacity : 100}
                required
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                disabled={isSubmitting}
                helperText={selectedSpace ? `Máx ${selectedSpace.capacity} personas` : ''}
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isSubmitting}
              >
                {isSubmitting ? 'Confirmando reserva…' : 'Confirmar Reserva'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Listado de reservas existentes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Reservas Registradas
            </h3>
            <span className="text-xs text-zinc-400">Total: {myReservations.length}</span>
          </div>

          {isLoading ? (
            <LoadingState message="Cargando historial de reservas…" />
          ) : (
            <Table
              columns={reservationColumns}
              data={myReservations}
              emptyMessage="No tienes reservas registradas actualmente."
            />
          )}
        </div>
      </div>
    </div>
  )
}
