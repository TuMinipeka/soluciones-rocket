/**
 * Página: Dashboard Operativo (HU-19)
 * Área: MAFE (consumidor de api/dashboard.js preparado por GUERRA).
 */

import { useState, useEffect } from 'react'
import { getDashboardSummaryApi } from '../api/dashboard'
import StatCard from '../components/dashboard/StatCard'
import LoadingState from '../components/feedback/LoadingState'
import ErrorMessage from '../components/feedback/ErrorMessage'
import EmptyState from '../components/feedback/EmptyState'
import Input from '../components/ui/Input'

export default function DashboardPage() {
  const [date, setDate] = useState(() =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
  )
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('10:00')
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Dashboard Operativo
        </h1>
        <p className="text-sm text-[#a1a1a6] mt-1">
          Resumen consolidado del estado de salas, inventario e incidencias en tiempo real.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-[20px] border border-white/[0.08] bg-[#1c1c1e] p-4">
        <Input label="Fecha" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <Input label="Desde" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
        <Input label="Hasta" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
      </div>

      {isLoading ? (
        <LoadingState message="Consolidando métricas operativas del campus…" />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadSummary} />
      ) : !summary ? (
        <EmptyState
          title="Sin datos disponibles"
          description="No se obtuvieron indicadores desde el backend."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Salas Disponibles"
            value={summary.available_spaces}
            trend="Operativas"
            color="emerald"
            icon="🏛️"
          />
          <StatCard
            title="Salas Ocupadas"
            value={summary.occupied_spaces}
            trend="En uso"
            color="blue"
            icon="👥"
          />
          <StatCard
            title="Préstamos Activos"
            value={summary.active_loans}
            trend="Equipos prestados"
            color="amber"
            icon="💻"
          />
          <StatCard
            title="Incidencias Abiertas"
            value={summary.open_incidents}
            trend="Requieren atención"
            color={summary.open_incidents > 0 ? 'rose' : 'zinc'}
            icon="⚠️"
          />
          <StatCard
            title="Recursos Inhabilitados"
            value={summary.disabled_resources}
            trend="Fuera de servicio"
            color="rose"
            icon="🛠️"
          />
          <StatCard
            title="Incidencias En Proceso"
            value={summary.in_progress_incidents}
            trend="En atención"
            color="amber"
            icon="🔧"
          />
        </div>
      )}
    </div>
  )
}
