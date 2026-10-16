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

export default function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadSummary = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getDashboardSummaryApi()
      setSummary(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Dashboard Operativo
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Resumen consolidado del estado de salas, inventario e incidencias en tiempo real.
        </p>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadSummary} />}

      {isLoading ? (
        <LoadingState message="Consolidando métricas operativas del campus…" />
      ) : !summary ? (
        <EmptyState
          title="Sin datos disponibles"
          description="No se obtuvieron indicadores desde el backend."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Salas Disponibles"
            value={summary.available_spaces ?? summary.spaces_available ?? 10}
            trend="Operativas"
            color="emerald"
            icon="🏛️"
          />
          <StatCard
            title="Salas Ocupadas"
            value={summary.occupied_spaces ?? summary.spaces_occupied ?? 0}
            trend="En uso"
            color="blue"
            icon="👥"
          />
          <StatCard
            title="Préstamos Activos"
            value={summary.active_loans ?? 0}
            trend="Equipos prestados"
            color="amber"
            icon="💻"
          />
          <StatCard
            title="Incidencias Abiertas"
            value={summary.open_incidents ?? summary.incidents_open ?? 0}
            trend="Requieren atención"
            color={summary.open_incidents > 0 ? 'rose' : 'zinc'}
            icon="⚠️"
          />
        </div>
      )}
    </div>
  )
}
