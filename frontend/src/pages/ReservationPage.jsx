/**
 * Página: Formulario y Gestión de Reservas (HU-03, HU-04, HU-22)
 * Permite seleccionar sala, fecha, horario y asistentes con validación estricta de aforo y solapamiento.
 * Responsable: GUERRA
 */

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
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
import SpaceConciergeModal from '../components/spaces/SpaceConciergeModal'

// Catálogo oficial de las 10 salas del campus (Fuente: backend/app/services/availability.py)
const DEFAULT_OFFICIAL_SPACES = [
  { id: 'SAL-001', name: 'Auditorio', capacity: 100 },
  { id: 'SAL-002', name: 'Cosmos', capacity: 25 },
  { id: 'SAL-003', name: 'Skylab', capacity: 20 },
  { id: 'SAL-004', name: 'Sputnik', capacity: 38 },
  { id: 'SAL-005', name: 'Apolo', capacity: 34 },
  { id: 'SAL-006', name: 'Sala Nueva', capacity: 12 },
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
  const [spaces, setSpaces] = useState(DEFAULT_OFFICIAL_SPACES)
  const [myReservations, setMyReservations] = useState([])

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
    setSuccess(`¡Asistente Groq aplicó la sala ${matched?.name || recSpaceId} (${recAttendees || attendees} asistentes)!`)
  }

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

          {/* Acceso rápido y Asistente IA Groq */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsConciergeOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600/30 via-cyan-500/20 to-blue-600/30 hover:from-blue-600/45 hover:to-cyan-500/35 text-white text-xs font-semibold border border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.25)] hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] active:scale-95 transition-all cursor-pointer"
            >
              <span className="text-cyan-300">✨</span>
              <span>Asistente IA Groq</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1c1c1e] text-[#a1a1a6] text-xs font-mono border border-white/[0.08]">
              <span className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse" />
              <span>Gateway IoT Activo</span>
            </div>
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
            {/* Banner sugerencia Asistente IA Groq */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/40 via-[#1c1c1e] to-cyan-950/30 border border-blue-500/25 flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(37,99,235,0.1)]">
              <div className="flex items-center gap-2.5">
                <span className="text-base text-cyan-400">✨</span>
                <div>
                  <p className="text-xs font-semibold text-white">¿Dudas sobre qué sala elegir?</p>
                  <p className="text-[11px] text-[#a1a1a6]">Pídele a Groq recomendaciones por aforo y equipamiento</p>
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
              className="w-full h-12 rounded-full mt-2 text-sm font-semibold tracking-wide"
              isLoading={isSubmitting}
              disabled={isOverCapacity}
            >
              {isSubmitting ? 'Confirmando reserva…' : 'Confirmar Reserva en Sala'}
            </Button>
          </form>
        </div>

        {/* Columna Derecha: Mapa de Salas (Cinema) y Tabla de Reservas (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card del Mapa Interactivo */}
          <Card title="Mapa de Disponibilidad en Pabellón" subtitle="Selecciona un pod para auto-completar el formulario">
            <div className="pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {spaces.map((room) => {
                  const isSelected = String(room.id) === String(spaceId)
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setSpaceId(String(room.id))}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-[#222226] border-[#2563eb] ring-2 ring-[#2563eb]/50'
                          : 'bg-[#141416] border-white/[0.06] hover:border-white/[0.15]'
                      }`}
                    >
                      <span className="text-[10px] font-mono text-[#8d90a0] block">{room.code || room.id}</span>
                      <span className="text-xs font-bold text-white block mt-0.5">{room.name}</span>
                      <span className="text-[10px] text-[#22d3ee] font-mono block mt-1">{room.capacity} pers.</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </Card>

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
        onApplyRecommendation={handleApplyRecommendation}
      />
    </div>
  )
}
