/**
 * Página: Formulario y Gestión de Reservas (HU-03, HU-04, HU-22)
 * Permite seleccionar sala, fecha, horario y asistentes con validación estricta de aforo y solapamiento.
 * Responsable: GUERRA
 */

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { getSpacesApi, getSpaceReservationsApi } from '../api/spaces'
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
import SpaceConciergeModal from '../components/spaces/SpaceConciergeModal'
import RoomScheduleCalendar from '../components/spaces/RoomScheduleCalendar'
import { ROOM_PHOTO_MAP } from '../components/spaces/CampusMap'


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
  const { user } = useAuth()
  const userName = user?.name || user?.email?.split('@')[0] || 'Camper'

  // Listados
  const [spaces, setSpaces] = useState([])
  const [myReservations, setMyReservations] = useState([])
  const [roomReservations, setRoomReservations] = useState([])
  const [calendarKnown, setCalendarKnown] = useState(false)

  // Campos del formulario
  const [spaceId, setSpaceId] = useState(pre.preselectedSpaceId ? String(pre.preselectedSpaceId) : 'SAL-002')
  const [date, setDate] = useState(pre.preselectedDate || new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState(pre.preselectedStartTime || '08:00')
  const [endTime, setEndTime] = useState(pre.preselectedEndTime || '10:00')
  const [attendees, setAttendees] = useState(20)
  const [title, setTitle] = useState('')

  // Estados de interfaz y Concierge IA
  const [isConciergeOpen, setIsConciergeOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleApplyRecommendation = ({ spaceId: recSpaceId, attendees: recAttendees, title: recTitle }) => {
    if (recSpaceId) setSpaceId(String(recSpaceId))
    if (recAttendees) setAttendees(Number(recAttendees))
    if (recTitle) setTitle(recTitle)
    const matched = spaces.find((s) => String(s.id) === String(recSpaceId))
    setSuccess(`Sala sugerida aplicada: ${matched?.name || recSpaceId} (${recAttendees || attendees} asistentes).`)
  }

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

      const resList = Array.isArray(resData) ? resData : resData?.reservations || []
      setMyReservations(resList)
    } catch (err) {
      setError(err?.message || 'No fue posible cargar las salas y reservas.')
      setSpaces([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [date])

  useEffect(() => {
    let active = true
    setCalendarKnown(false)
    setRoomReservations([])
    if (spaceId && date) {
      getSpaceReservationsApi(spaceId, date)
        .then((items) => {
          if (active) {
            setRoomReservations(Array.isArray(items) ? items : [])
            setCalendarKnown(true)
          }
        })
        .catch(() => { if (active) setCalendarKnown(false) })
    }
    return () => { active = false }
  }, [spaceId, date, myReservations])

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
      render: (r) => <span className="font-mono font-bold text-[#22d3ee]">#{r.id}</span>,
    },
    {
      header: 'Sala',
      accessor: 'space_name',
      render: (r) => (
        <span className="font-semibold text-white">
          {r.space_name || r.space_id || 'Sala'}
        </span>
      ),
    },
    {
      header: 'Fecha y Horario',
      accessor: 'date',
      render: (r) => (
        <span className="text-[#a1a1a6] font-mono text-xs">
          {r.date} ({r.start_time} - {r.end_time})
        </span>
      ),
    },
    {
      header: 'Asistentes',
      accessor: 'attendees',
      render: (r) => <span className="text-[#e4e2e4]">{r.attendees} personas</span>,
    },
    {
      header: 'Estado',
      accessor: 'status',
      render: (r) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            r.status === 'cancelled'
              ? 'bg-[#2a2a2c] text-[#8d90a0] border border-white/[0.06]'
              : 'bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/30'
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
            className="text-xs text-[#ff453a] hover:text-[#ffdad6] hover:bg-[#93000a]/20"
            onClick={() => handleCancelReservation(r.id)}
          >
            Cancelar
          </Button>
        ) : null,
    },
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* SECCIÓN 1: CABECERA Y TELEMETRÍA */}
      <section className="flex flex-col gap-3">
        {/* Breadcrumbs estilo macOS / SF */}
        <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-xs text-[#8d90a0]">
          <span className="hover:text-white transition-colors cursor-pointer">Inicio</span>
          <span className="text-white/20">/</span>
          <span className="hover:text-white transition-colors cursor-pointer">Reservas</span>
          <span className="text-white/20">/</span>
          <span className="text-white font-semibold">Nueva reserva telemática</span>
        </nav>

        {/* Encabezado de página */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Reservar sala
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#2a2a2c] text-[#22d3ee] text-[11px] font-mono font-medium tracking-wide border border-white/[0.08]">
                ID-EXP: MOD-RES-2025
              </span>
            </div>
            <p className="text-sm text-[#a1a1a6] max-w-3xl leading-relaxed">
              Gestión y reserva de espacios físicos para actividades académicas con asignación telemática instantánea.
            </p>
          </div>

          {/* Acceso rápido al asistente de salas */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsConciergeOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600/30 via-cyan-500/20 to-blue-600/30 hover:from-blue-600/45 hover:to-cyan-500/35 text-white text-xs font-semibold border border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.25)] hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] active:scale-95 transition-all cursor-pointer"
            >
              <span className="text-cyan-300">✨</span>
              <span>Asistente de salas</span>
            </button>
          </div>
        </div>
      </section>

      {error && <ErrorMessage message={error} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess(null)} />}

      {/* SECCIÓN 2: FORMULARIO PRINCIPAL DE RESERVA (Bento Grid 2 Columnas) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Formulario Interactivo (5 cols) */}
        <div className="lg:col-span-5 bg-[#1c1c1e] rounded-[20px] p-6 sm:p-7 border-t border-white/[0.09] border-x border-white/[0.04] border-b border-black/50 shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] mb-5">
            <div className="flex items-center gap-2.5">
              <span className="text-base text-[#22d3ee]">🏛️</span>
              <h2 className="text-base font-semibold text-white tracking-tight">Detalles de la Reserva</h2>
            </div>
            <span className="text-xs text-[#8d90a0] font-mono">Campos obligatorios *</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Banner del asistente de salas */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/40 via-[#1c1c1e] to-cyan-950/30 border border-blue-500/25 flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(37,99,235,0.1)]">
              <div className="flex items-center gap-2.5">
                <span className="text-base text-cyan-400">✨</span>
                <div>
                  <p className="text-xs font-semibold text-white">¿Dudas sobre qué sala elegir?</p>
                  <p className="text-[11px] text-[#a1a1a6]">Consulta salas según aforo y disponibilidad real</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConciergeOpen(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shrink-0 active:scale-95 transition-all cursor-pointer shadow-[0_0_10px_rgba(37,99,235,0.3)]"
              >
                Recomendar
              </button>
            </div>

            {/* Selector de Sala */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#a1a1a6] mb-1.5">
                Sala Académica *
              </label>
              <select
                value={spaceId}
                onChange={(e) => setSpaceId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-[12px] bg-[#2c2c2e] text-[#f5f5f7] text-sm border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#2563eb] transition-all cursor-pointer"
                disabled={isSubmitting || isLoading}
              >
                {spaces.map((space) => (
                  <option key={space.id} value={space.id} className="bg-[#1c1c1e] text-white">
                    {space.name} · {space.capacity} personas
                  </option>
                ))}
              </select>
              {selectedSpace && (
                <div className="mt-2 flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-[#2a2a2c] border border-white/[0.06]">
                  <span className="text-[#a1a1a6]">Capacidad máxima permitida:</span>
                  <span className="font-bold text-[#22d3ee] font-mono">{selectedSpace.capacity} personas</span>
                </div>
              )}
            </div>

            <Input
              label="Título o Propósito de la actividad"
              placeholder="Ej. Taller de Algoritmos en Python"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />

            {/* Fecha de la reserva */}
            <Input
              label="Fecha de la reserva"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isSubmitting}
            />

            {/* Selector Rediseñado de Horarios: 06:00 a 22:00 (G-01, G-02) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#a1a1a6]">
                  Franja Horaria * (06:00 - 22:00)
                </label>
                <span className="text-[11px] font-mono text-[#22d3ee]">
                  {startTime} - {endTime}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Hora de Inicio */}
                <div>
                  <span className="block text-[10px] text-zinc-400 font-mono mb-1">Hora Inicio</span>
                  <select
                    value={startTime}
                    onChange={(e) => {
                      const newStart = e.target.value
                      setStartTime(newStart)
                      if (newStart >= endTime) {
                        const [h] = newStart.split(':').map(Number)
                        const nextHour = `${String(Math.min(22, h + 1)).padStart(2, '0')}:00`
                        setEndTime(nextHour)
                      }
                    }}
                    className="w-full h-11 px-3 rounded-xl bg-[#2c2c2e] text-[#f5f5f7] text-sm font-mono border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#2563eb] cursor-pointer"
                  >
                    {[
                      '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
                      '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
                      '18:00', '19:00', '20:00', '21:00'
                    ].map((t) => (
                      <option key={t} value={t} className="bg-[#1c1c1e] text-white">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hora de Fin */}
                <div>
                  <span className="block text-[10px] text-zinc-400 font-mono mb-1">Hora Fin</span>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-[#2c2c2e] text-[#f5f5f7] text-sm font-mono border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#2563eb] cursor-pointer"
                  >
                    {[
                      '07:00', '08:00', '09:00', '10:00', '11:00',
                      '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
                      '18:00', '19:00', '20:00', '21:00', '22:00'
                    ].map((t) => {
                      const isDisabled = t <= startTime
                      return (
                        <option
                          key={t}
                          value={t}
                          disabled={isDisabled}
                          className={isDisabled ? 'bg-[#18181a] text-zinc-600' : 'bg-[#1c1c1e] text-white'}
                        >
                          {t} {isDisabled ? '(Inválida)' : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Campo de Asistentes con Stepper - y + sin control nativo (G-08) */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#a1a1a6]">
                <span>Número de Asistentes *</span>
                <span className="text-[11px] font-mono text-zinc-400 font-normal">
                  Capacidad sala: {selectedSpace?.capacity || 100}
                </span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAttendees((prev) => Math.max(1, Number(prev) - 1))}
                  className="w-11 h-11 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] active:scale-95 text-white font-bold text-lg border border-white/[0.08] flex items-center justify-center transition-colors cursor-pointer select-none"
                  aria-label="Disminuir asistentes"
                >
                  −
                </button>

                <div className="flex-1 relative">
                  <input
                    type="number"
                    min="1"
                    max={selectedSpace?.capacity || 200}
                    value={attendees}
                    onChange={(e) => setAttendees(e.target.value)}
                    disabled={isSubmitting}
                    className={`w-full h-11 rounded-xl bg-[#2c2c2e] text-center font-mono text-base font-bold text-white border transition-all focus:outline-none ${
                      isOverCapacity
                        ? 'border-[#ff453a] focus:ring-2 focus:ring-[#ff453a]/30'
                        : 'border-white/[0.08] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/40'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-medium pointer-events-none">
                    pers.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setAttendees((prev) => Math.min(selectedSpace?.capacity || 100, Number(prev) + 1))}
                  className="w-11 h-11 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] active:scale-95 text-white font-bold text-lg border border-white/[0.08] flex items-center justify-center transition-colors cursor-pointer select-none"
                  aria-label="Aumentar asistentes"
                >
                  +
                </button>
              </div>

              {isOverCapacity && (
                <p className="text-xs text-[#ff8077] font-medium flex items-center gap-1 animate-fluid-enter">
                  <span>•</span> Excede la capacidad autorizada ({selectedSpace?.capacity} personas)
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full h-12 rounded-xl mt-3 text-sm font-semibold tracking-wide"
              isLoading={isSubmitting}
              disabled={isOverCapacity}
            >
              {isSubmitting ? 'Confirmando reserva…' : 'Confirmar Reserva en Sala'}
            </Button>
          </form>
        </div>

        {/* Columna Derecha: Detalles EXCLUSIVOS de la sala seleccionada y Google Calendar (G-04, G-05) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Detalles Exclusivos de la Sala Seleccionada (G-05) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#161618] border border-white/[0.08] shadow-lg">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Imagen disponible de la sala seleccionada */}
              <div className="w-36 h-28 sm:w-44 sm:h-28 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-[#1c1c1e] relative group">
                {ROOM_PHOTO_MAP[selectedSpace?.id] && <img
                  src={ROOM_PHOTO_MAP[selectedSpace?.id]}
                  alt={selectedSpace?.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />}
                <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/70 backdrop-blur-md text-[#22d3ee] border border-white/10">
                  {selectedSpace?.id}
                </span>
              </div>

              {/* Información y Aforo de la Sala */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {selectedSpace?.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    {selectedSpace?.status === 'disabled' ? 'Inhabilitada' : selectedSpace?.status === 'occupied' ? 'Ocupada' : 'Disponible'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Capacidad máxima: <strong className="text-white font-mono">{selectedSpace?.capacity} personas</strong>
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Ubicación: <span className="text-zinc-200">Pabellón Principal • Campuslands</span>
                </p>
                <div className="mt-3 flex items-center justify-center sm:justify-start gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300">
                    {spaces.findIndex((s) => s.id === selectedSpace?.id) + 1} de {spaces.length} salas
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const currIdx = spaces.findIndex((s) => s.id === spaceId)
                      const next = spaces[(currIdx + 1) % spaces.length]
                      setSpaceId(String(next.id))
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#2563eb]/20 text-[#22d3ee] hover:bg-[#2563eb]/30 transition-colors cursor-pointer"
                  >
                    Cambiar sala →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Calendario Google Calendar para la Sala Seleccionada (G-04, G-06) */}
          <RoomScheduleCalendar
            room={selectedSpace}
            date={date}
            reservations={roomReservations}
            availabilityKnown={calendarKnown}
            userRole={user?.role || 'teacher'}
            selectedStart={startTime}
            selectedEnd={endTime}
            onSelectSlot={(slotStart, slotEnd) => {
              setStartTime(slotStart)
              setEndTime(slotEnd)
            }}
          />

          {/* Listado de reservas registradas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#a1a1a6]">
                Historial de Reservas ({myReservations.length})
              </h3>
            </div>

            {isLoading ? (
              <div className="p-8 rounded-[20px] bg-[#1c1c1e] border border-white/[0.08]">
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

      {/* Modal Concierge IA Groq */}
      <SpaceConciergeModal
        isOpen={isConciergeOpen}
        onClose={() => setIsConciergeOpen(false)}
        userName={userName}
        initialAttendees={attendees}
        initialTitle={title}
        date={date}
        startTime={startTime}
        endTime={endTime}
        onApplyRecommendation={handleApplyRecommendation}
      />
    </div>
  )
}
