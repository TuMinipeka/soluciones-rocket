/**
 * Página: Dashboard Operativo (HU-19, G-12)
 * Reorganización de fecha, hora e indicadores de rendimiento operativo en tiempo real.
 */

import { useState, useEffect } from 'react'
import { getDashboardSummaryApi } from '../api/dashboard'
import { useAuth } from '../auth/useAuth'
import StatCard from '../components/dashboard/StatCard'
import LoadingState from '../components/feedback/LoadingState'
import ErrorMessage from '../components/feedback/ErrorMessage'
import EmptyState from '../components/feedback/EmptyState'
import Input from '../components/ui/Input'
import {
  BuildingOffice2Icon,
  UserGroupIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  Cog6ToothIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const { user } = useAuth()
  const [date, setDate] = useState(() =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
  )
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('18:00')
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentTime, setCurrentTime] = useState(() => new Date())

  // Reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const loadSummary = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getDashboardSummaryApi({ date, start_time: startTime, end_time: endTime })
      setSummary(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [date, startTime, endTime])

  const formattedCurrentDate = currentTime.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedCurrentTime = currentTime.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Banner Principal de Bienvenida y Tiempo (G-12 inspired by dashboard.png) */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#1c1c1e] via-[#242428] to-[#1a2333] border border-white/[0.08] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2563eb]/20 border border-[#2563eb]/40 text-[#6cd3f7] text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-[#30d158] animate-pulse" />
              <span>SISTEMA DE GESTIÓN Y MONITOREO ACTIVO</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white capitalize">
              ¡Bienvenido, {user?.name || user?.email?.split('@')[0] || 'Docente'}!
            </h1>
            <p className="text-sm text-[#a1a1a6] max-w-xl">
              Panel central de indicadores de infraestructura, disponibilidad de salas, estado de préstamos tecnológicos e incidencias de campus.
            </p>
          </div>

          {/* Reloj y Fecha Oficial Institucional */}
          <div className="flex flex-col items-start lg:items-end bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/[0.06] space-y-1">
            <span className="text-xs font-mono uppercase tracking-widest text-[#22d3ee] flex items-center gap-1.5">
              <ClockIcon className="w-4 h-4 text-[#22d3ee]" /> Horario del Campus
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-wider">
              {formattedCurrentTime}
            </div>
            <div className="text-xs text-[#a1a1a6] capitalize">
              {formattedCurrentDate}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtro de Ventana Temporal (06:00 - 22:00) */}
      <div className="rounded-[20px] border border-white/[0.08] bg-[#1c1c1e] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-white/[0.06] pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#a1a1a6] flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-[#22d3ee]" /> Intervalo Operativo de Consulta
          </span>
          <span className="text-[11px] font-mono text-[#22d3ee]">
            Rango institucional: 06:00 – 22:00 hrs
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Fecha de consulta"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#a1a1a6] mb-1.5">
              Hora de inicio
            </label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-[#2a2a2c] border border-white/10 text-white text-sm focus:outline-none focus:border-[#2563eb]"
            >
              {['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'].map(t => (
                <option key={t} value={t}>{t} hrs</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#a1a1a6] mb-1.5">
              Hora de fin
            </label>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-[#2a2a2c] border border-white/10 text-white text-sm focus:outline-none focus:border-[#2563eb]"
            >
              {['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'].map(t => (
                <option key={t} value={t}>{t} hrs</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 rounded-[20px] bg-[#1c1c1e] border border-white/[0.08]">
          <LoadingState message="Consolidando métricas operativas del campus en tiempo real…" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
      ) : !summary ? (
        <EmptyState
          title="Sin datos disponibles"
          description="No se obtuvieron indicadores desde el backend para el intervalo seleccionado."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#a1a1a6]">
              Indicadores Principales
            </h2>
            <span className="text-[11px] font-mono text-[#30d158] flex items-center gap-1">
              <CheckCircleIcon className="w-3.5 h-3.5" /> Sincronizado
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Salas Disponibles"
              value={summary.available_spaces}
              trend="Operativas"
              color="emerald"
              icon={<BuildingOffice2Icon className="w-5 h-5 text-[#30d158]" />}
            />
            <StatCard
              title="Salas Ocupadas"
              value={summary.occupied_spaces}
              trend="En uso"
              color="blue"
              icon={<UserGroupIcon className="w-5 h-5 text-[#6cd3f7]" />}
            />
            <StatCard
              title="Préstamos Activos"
              value={summary.active_loans}
              trend="Equipos en uso"
              color="amber"
              icon={<ComputerDesktopIcon className="w-5 h-5 text-[#ff9f0a]" />}
            />
            <StatCard
              title="Incidencias Abiertas"
              value={summary.open_incidents}
              trend={summary.open_incidents > 0 ? 'Atención urgente' : 'Sin pendientes'}
              color={summary.open_incidents > 0 ? 'rose' : 'zinc'}
              icon={<ExclamationTriangleIcon className="w-5 h-5 text-[#ff453a]" />}
            />
            <StatCard
              title="Recursos Inhabilitados"
              value={summary.disabled_resources}
              trend="Mantenimiento"
              color="rose"
              icon={<WrenchScrewdriverIcon className="w-5 h-5 text-[#ff453a]" />}
            />
            <StatCard
              title="Incidencias En Proceso"
              value={summary.in_progress_incidents}
              trend="Brigada asignada"
              color="amber"
              icon={<Cog6ToothIcon className="w-5 h-5 text-[#ff9f0a]" />}
            />
          </div>
        </div>
      )}
    </div>
  )
}
