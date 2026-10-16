import React, { useState, useEffect, useCallback } from 'react';
import * as dashboardApi from '../api/dashboard';
import StatCard from '../components/dashboard/StatCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingState from '../components/feedback/LoadingState';
import EmptyState from '../components/feedback/EmptyState';
import ErrorMessage from '../components/feedback/ErrorMessage';

// Fallback temporal estructurado según especificación técnica
const FALLBACK_DASHBOARD_DATA = {
  spaces_free: 6,
  spaces_occupied: 4,
  spaces_total: 10,
  active_loans: 14,
  disabled_resources: 2,
  open_incidents: 2,
  in_progress_incidents: 1,
  total_operations_today: 48,
  ai_recommendation_pending: true,
  contingency_alert: {
    room_id: 'SAL-005',
    room_name: 'Apolo',
    target_id: 'SAL-004',
    target_name: 'Spooki',
    reason: 'Falla térmica en Apolo. Spooki cuenta con 38 puestos disponibles y climatización óptima.',
  },
  recent_events: [
    { id: '1', time: '10:05', text: 'Reserva confirmada en Cosmos (SAL-002)', user: 'Prof. Carlos Silva' },
    { id: '2', time: '09:40', text: 'Incidencia reportada en Apolo (SAL-005)', user: 'Soporte Técnico' },
    { id: '3', time: '09:15', text: 'Préstamo de 2x Workstations', user: 'Laura Méndez' },
    { id: '4', time: '08:30', text: 'Apertura de Auditorio para Hackatón', user: 'Coordinación' },
  ],
};

/**
 * DashboardPage: Panel de control operativo conectado a GET /dashboard/summary (HU-19).
 * Incluye auto-refresco por foco/pestaña, selector dinámico y manejo defensivo de estados.
 */
export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('CURRENT');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(() => new Date().toLocaleTimeString());

  // Consulta dinámica a la API
  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setError(null);

    const client = dashboardApi.getDashboardSummaryApi || dashboardApi.getDashboardSummary;

    try {
      if (typeof client === 'function') {
        const response = await client({ date: selectedDate, time_slot: selectedSlot });
        if (response === null) {
          setSummary(null);
        } else {
          const data = response?.data !== undefined ? response.data : response;
          if (data && typeof data === 'object' && Object.keys(data).length > 0) {
            setSummary(data);
          } else if (data === null) {
            setSummary(null);
          } else {
            setSummary(FALLBACK_DASHBOARD_DATA);
          }
        }
      } else {
        // Fallback defensivo si la API aún no está disponible
        await new Promise((resolve) => setTimeout(resolve, 350));
        setSummary(FALLBACK_DASHBOARD_DATA);
      }
      setLastRefreshedAt(new Date().toLocaleTimeString());
    } catch (err) {
      if (err?.status === 404 || err?.response?.status === 404) {
        setSummary(FALLBACK_DASHBOARD_DATA);
      } else {
        const errMsg = err?.message || 'Error al actualizar las métricas operativas.';
        setError(errMsg);
      }
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [selectedDate, selectedSlot]);

  // Invocar al montar y al cambiar filtros
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Refresco automático cuando el usuario regresa a la pestaña (Page Visibility API)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchDashboardData]);

  return (
    <div className="space-y-8 animate-fluid-enter" role="region" aria-label="Dashboard Operativo Campus Control">
      {/* Cabecera y Botón de Refresco Manual */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[rgba(255,255,255,0.08)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F5F5F7]">
              Panel de Control Operativo
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#30D158]/20 text-[#30D158] font-bold border border-[#30D158]/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse" />
              Continuidad Activa
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#A1A1A6] mt-1">
            Supervisión consolidada de espacios, préstamos de recursos y triaje con IA (HU-19).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData(false)}
            isLoading={isLoading}
            aria-label="Actualizar métricas del campus"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            Actualizar métricas
          </Button>

          <a href="/spaces">
            <Button variant="primary" size="sm">
              Ver Plano de Cine
            </Button>
          </a>
        </div>
      </div>

      {/* Selector Dinámico de Franja Horaria y Fecha */}
      <div className="p-4 rounded-[1.25rem] bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-[#A1A1A6] uppercase tracking-wider mr-1">
            Franja Horaria:
          </span>
          {[
            { id: 'CURRENT', label: 'Actual' },
            { id: 'MORNING', label: 'Mañana (08-12h)' },
            { id: 'AFTERNOON', label: 'Tarde (14-18h)' },
            { id: 'NIGHT', label: 'Noche (18-22h)' },
          ].map((slot) => (
            <button
              key={slot.id}
              onClick={() => setSelectedSlot(slot.id)}
              className={`px-3 py-1.5 rounded-[0.75rem] text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                selectedSlot === slot.id
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'bg-[#2C2C2E] text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#3A3A3C]'
              }`}
            >
              {slot.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <label htmlFor="dashboard-date" className="text-xs font-semibold text-[#A1A1A6] shrink-0">
              Fecha:
            </label>
            <input
              id="dashboard-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#2C2C2E] text-[#F5F5F7] text-xs font-semibold px-3 py-1.5 rounded-[0.75rem] border border-[rgba(255,255,255,0.08)] outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <span className="text-[11px] font-mono text-[#A1A1A6] hidden sm:inline-block">
            Última sync: {lastRefreshedAt}
          </span>
        </div>
      </div>

      {/* Manejo de Estados: Loading, Error, Empty, Success */}
      {isLoading && !summary ? (
        <LoadingState message="Cargando métricas consolidadas del campus..." />
      ) : error ? (
        <ErrorMessage
          title="Fallo al obtener resumen operativo"
          message={error}
          onRetry={() => fetchDashboardData(false)}
        />
      ) : !summary ? (
        <EmptyState
          title="No se encontraron métricas operativas"
          description="El servidor no devolvió datos para la franja seleccionada."
          action={
            <Button size="sm" variant="outline" onClick={() => fetchDashboardData(false)}>
              Reintentar
            </Button>
          }
        />
      ) : (
        <>
          {/* 4 Métricas Principales en StatCard.jsx */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Espacios libres vs. ocupados */}
            <StatCard
              title="Espacios Libres vs. Ocupados"
              value={`${summary.spaces_free ?? 0} / ${summary.spaces_total ?? 10}`}
              subtitle={`${summary.spaces_occupied ?? 0} salas ocupadas actualmente`}
              color="ok"
              trend={{
                positive: (summary.spaces_free ?? 0) >= 5,
                label: `${(summary.spaces_free ?? 0) * 10}% libres`,
              }}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />

            {/* 2. Préstamos activos vs. recursos inhabilitados */}
            <StatCard
              title="Préstamos Activos"
              value={`${summary.active_loans ?? 0}`}
              subtitle={`${summary.disabled_resources ?? 0} recursos inhabilitados`}
              color="secondary"
              trend={{
                positive: (summary.disabled_resources ?? 0) === 0,
                label: `${summary.disabled_resources ?? 0} bloqueados`,
              }}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />

            {/* 3. Incidencias abiertas vs. en proceso */}
            <StatCard
              title="Incidencias Técnicas"
              value={`${summary.open_incidents ?? 0}`}
              subtitle={`${summary.in_progress_incidents ?? 0} en proceso de mitigación`}
              color="danger"
              trend={{ positive: false, label: 'Triaje Activo' }}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />

            {/* 4. Total de operaciones del día */}
            <StatCard
              title="Operaciones del Día"
              value={`${summary.total_operations_today ?? 0}`}
              subtitle="Reservas, préstamos e incidencias"
              color="primary"
              trend={{ positive: true, label: 'Actividad OK' }}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            />
          </div>

          {/* Módulo de Continuidad Operativa Inteligente */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card
                title="Continuidad Operativa Inteligente"
                subtitle="Detección de salas inhabilitadas y reubicación automatizada"
                action={
                  <a href="/incidents">
                    <Button size="sm" variant="secondary">
                      Revisar Incidencias
                    </Button>
                  </a>
                }
              >
                {summary.contingency_alert ? (
                  <div className="p-4 rounded-[1.25rem] bg-[#2C2C2E]/60 border border-[#0891B2]/30 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="p-2 rounded-xl bg-[#0891B2]/20 text-[#22D3EE] font-extrabold text-xs">
                        AI
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-[#F5F5F7]">
                          Propuesta de Reubicación para {summary.contingency_alert.room_name} ({summary.contingency_alert.room_id})
                        </h4>
                        <p className="text-xs text-[#A1A1A6] mt-0.5 leading-relaxed">
                          {summary.contingency_alert.reason}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
                      <a href="/incidents">
                        <Button size="sm" variant="ok">
                          Gestionar en Incidencias
                        </Button>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-[1.25rem] bg-[#2C2C2E]/30 border border-[rgba(255,255,255,0.04)] text-center text-xs text-[#A1A1A6]">
                    ✓ No existen contingencias pendientes ni salas bloqueadas en este momento.
                  </div>
                )}

                {/* Submétricas arquitectónicas */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-[0.75rem] bg-[#2C2C2E]/40 border border-[rgba(255,255,255,0.04)]">
                    <span className="text-[#A1A1A6] block">Aforo Global Campus</span>
                    <span className="text-base font-bold text-[#F5F5F7] mt-0.5 block">263 plazas</span>
                  </div>
                  <div className="p-3 rounded-[0.75rem] bg-[#2C2C2E]/40 border border-[rgba(255,255,255,0.04)]">
                    <span className="text-[#A1A1A6] block">Base de Datos</span>
                    <span className="text-base font-bold text-[#30D158] mt-0.5 block">SQLite Persistente</span>
                  </div>
                  <div className="p-3 rounded-[0.75rem] bg-[#2C2C2E]/40 border border-[rgba(255,255,255,0.04)]">
                    <span className="text-[#A1A1A6] block">Backend API</span>
                    <span className="text-base font-bold text-[#22D3EE] mt-0.5 block">FastAPI v1</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Feed de Eventos */}
            <div>
              <Card
                title="Eventos Recientes"
                subtitle="Historial de operaciones del campus"
              >
                <div className="space-y-3">
                  {(summary.recent_events || []).map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 rounded-[0.75rem] bg-[#2C2C2E]/50 border border-[rgba(255,255,255,0.04)] text-xs flex items-start gap-2.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#F5F5F7] truncate">{evt.text}</p>
                        <span className="text-[10px] text-[#A1A1A6] mt-0.5 block">
                          {evt.time} &bull; {evt.user}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
