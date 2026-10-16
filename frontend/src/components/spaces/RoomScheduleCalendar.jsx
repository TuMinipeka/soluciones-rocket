/**
 * Componente: Calendario Google Calendar para Sala Seleccionada (G-04, G-05, G-06)
 * - Restringe visualmente y lógicamente de 06:00 a 22:00 (G-02).
 * - Bloques ocupados son claramente visibles, no seleccionables e indican horario (G-06).
 * - Para roles no autorizados muestra 'Ocupado' protegiendo privacidad.
 * - Permite seleccionar intervalos disponibles con un clic.
 * Responsable: GUERRA
 */

import React, { useMemo } from 'react'
import { CalendarDaysIcon, LockClosedIcon, CheckIcon } from '@heroicons/react/24/outline'

export const OPERATIONAL_HOURS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00'
]

export default function RoomScheduleCalendar({
  room,
  date,
  reservations = [],
  userRole = 'teacher',
  selectedStart,
  selectedEnd,
  onSelectSlot,
}) {
  // Convertir string de hora 'HH:MM' a minutos desde las 00:00
  const timeToMinutes = (t) => {
    if (!t) return 0
    const [h, m] = t.split(':').map(Number)
    return h * 60 + (m || 0)
  }

  // Filtrar reservas que corresponden a la sala y fecha activa
  const activeReservations = useMemo(() => {
    if (!room || !reservations) return []
    return reservations.filter((r) => {
      const matchRoom = String(r.space_id || r.space?.id) === String(room.id)
      const matchDate = !date || !r.date || r.date === date
      const isConfirmed = r.status !== 'cancelled'
      return matchRoom && matchDate && isConfirmed
    })
  }, [room, reservations, date])

  // Determinar si una hora específica está dentro de alguna reserva confirmada
  const getSlotStatus = (timeStr) => {
    const slotMins = timeToMinutes(timeStr)
    const slotEndMins = slotMins + 60 // Bloques de 1 hora

    for (const res of activeReservations) {
      const resStart = timeToMinutes(res.start_time)
      const resEnd = timeToMinutes(res.end_time)
      // Conflicto si los intervalos se solapan
      if (Math.max(slotMins, resStart) < Math.min(slotEndMins, resEnd)) {
        const canViewDetails = userRole === 'admin'
        return {
          isOccupied: true,
          reservation: res,
          displayTitle: canViewDetails ? (res.title || res.user_name || 'Reservado') : 'Ocupado',
          start: res.start_time,
          end: res.end_time,
        }
      }
    }
    return { isOccupied: false }
  }

  return (
    <div className="w-full bg-[#161618] rounded-2xl border border-white/[0.08] p-4 sm:p-5 shadow-lg select-none">
      {/* Cabecera del Calendario */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-4 border-b border-white/[0.06] gap-2">
        <div className="flex items-center gap-2.5">
          <CalendarDaysIcon className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Disponibilidad: <span className="text-cyan-400">{room?.name || 'Sala'}</span>
            </h3>
            <p className="text-[11px] text-zinc-400 font-mono">
              Franja Operativa: 06:00 a 22:00 • {date}
            </p>
          </div>
        </div>

        {/* Leyenda rápida */}
        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Disponible
          </span>
          <span className="inline-flex items-center gap-1.5 text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Ocupado
          </span>
          <span className="inline-flex items-center gap-1.5 text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> Seleccionado
          </span>
        </div>
      </div>

      {/* Rejilla de Horarios tipo Google Calendar (Slots de 1 hora) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
        {OPERATIONAL_HOURS.slice(0, -1).map((timeStr, idx) => {
          const nextHour = OPERATIONAL_HOURS[idx + 1]
          const { isOccupied, displayTitle, start, end } = getSlotStatus(timeStr)
          const isSelected = selectedStart === timeStr && selectedEnd === nextHour

          return (
            <button
              key={timeStr}
              type="button"
              disabled={isOccupied || room?.status === 'disabled'}
              onClick={() => onSelectSlot && onSelectSlot(timeStr, nextHour)}
              className={`relative p-2 rounded-xl text-left border transition-all duration-150 flex flex-col justify-between min-h-[64px] ${
                isOccupied
                  ? 'bg-blue-950/30 border-blue-500/30 text-blue-200/90 cursor-not-allowed opacity-90'
                  : isSelected
                  ? 'bg-cyan-500/20 border-cyan-400 text-white ring-2 ring-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                  : 'bg-[#1c1c1e] border-white/[0.06] text-zinc-300 hover:border-emerald-500/50 hover:bg-emerald-500/10 cursor-pointer active:scale-95'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-mono text-[11px] font-bold">
                  {timeStr}
                </span>
                <span className="text-[9px] text-zinc-500 font-mono">
                  {nextHour}
                </span>
              </div>

              <div className="mt-1">
                {isOccupied ? (
                  <span className="text-[10px] font-semibold text-blue-300 truncate flex items-center gap-1" title={`${start} - ${end}`}>
                    <LockClosedIcon className="w-3 h-3 shrink-0" /> {displayTitle}
                  </span>
                ) : isSelected ? (
                  <span className="text-[10px] font-semibold text-cyan-300 flex items-center gap-1">
                    <CheckIcon className="w-3 h-3 shrink-0" /> Elegido
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-medium block">
                    Libre
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
