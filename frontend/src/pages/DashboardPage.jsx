import React, { useState, useEffect } from 'react';
import StatCard from '../components/dashboard/StatCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingState from '../components/feedback/LoadingState';
import EmptyState from '../components/feedback/EmptyState';
import ErrorMessage from '../components/feedback/ErrorMessage';

// Modelo de fallback estructurado para desacoplamiento con GET /dashboard/summary
const MOCK_SUMMARIES_BY_SLOT = {
  CURRENT: {
    slotLabel: 'Franja Actual (10:00 - 12:00)',
    spacesFree: 6,
    spacesOccupied: 4,
    spacesTotal: 10,
    activeLoans: 14,
    availableLoans: 36,
    disabledResources: 2,
    openIncidents: 2,
    inProgressIncidents: 1,
    aiRecommendationAvailable: true,
    recentEvents: [
      { id: 'EVT-1', time: '10:05', title: 'Reserva activa confirmada', room: 'Cosmos (SAL-002)', user: 'Prof. Silva', type: 'reservation' },
      { id: 'EVT-2', time: '09:40', title: 'Incidencia técnica reportada', room: 'Apolo (SAL-005)', user: 'Soporte Clima', type: 'incident' },
      { id: 'EVT-3', time: '09:15', title: 'Préstamo de 2 Laptops Lenovo', room: 'Recepción Central', user: 'Laura M.', type: 'loan' },
      { id: 'EVT-4', time: '08:30', title: 'Auditorio verificado para evento', room: 'Auditorio (SAL-001)', user: 'Admin Campus', type: 'space' },
    ],
  },
  MORNING: {
    slotLabel: 'Mañana (08:00 - 12:00)',
    spacesFree: 4,
    spacesOccupied: 6,
    spacesTotal: 10,
    activeLoans: 22,
    availableLoans: 28,
    disabledResources: 2,
    openIncidents: 2,
    inProgressIncidents: 1,
    aiRecommendationAvailable: true,
    recentEvents: [
      { id: 'EVT-M1', time: '08:00', title: 'Inicio de Bootcamps Matutinos', room: 'Spooki & Cosmos', user: 'Coordinación', type: 'reservation' },
      { id: 'EVT-M2', time: '08:25', title: 'Falla aire reportada', room: 'Apolo (SAL-005)', user: 'Docente Gómez', type: 'incident' },
    ],
  },
  AFTERNOON: {
    slotLabel: 'Tarde (14:00 - 18:00)',
    spacesFree: 7,
    spacesOccupied: 3,
    spacesTotal: 10,
    activeLoans: 11,
    availableLoans: 39,
    disabledResources: 1,
    openIncidents: 1,
    inProgressIncidents: 1,
    aiRecommendationAvailable: false,
    recentEvents: [
      { id: 'EVT-A1', time: '14:00', title: 'Taller de Innovación y UI', room: 'Artemis (SAL-010)', user: 'Mentora Ana', type: 'reservation' },
      { id: 'EVT-A2', time: '15:30', title: 'Devolución de Proyector Láser', room: 'Soporte', user: 'Carlos R.', type: 'loan' },
    ],
  },
  NIGHT: {
    slotLabel: 'Noche (18:00 - 22:00)',
    spacesFree: 9,
    spacesOccupied: 1,
    spacesTotal: 10,
    activeLoans: 4,
    availableLoans: 46,
    disabledResources: 1,
    openIncidents: 0,
    inProgressIncidents: 0,
    aiRecommendationAvailable: false,
    recentEvents: [
      { id: 'EVT-N1', time: '18:30', title: 'Clase Nocturna Especialización', room: 'Cosmos (SAL-002)', user: 'Prof. Vega', type: 'reservation' },
    ],
  },
};

export default function DashboardPage() {
  const [selectedSlot, setSelectedSlot] = useState('CURRENT');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Consumo desacoplado con soporte de carga, error y fallback a slots
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      if (isMounted) {
        const data = MOCK_SUMMARIES_BY_SLOT[selectedSlot] || null;
        setSummary(data);
        setIsLoading(false);
      }
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedSlot, selectedDate]);

  return (
    <div className="space-y-8 animate-fluid-enter" role="region" aria-label="Dashboard Operativo">
      {/* Cabecera del Dashboard */}
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
            Supervisión ejecutiva de ocupación por franjas, inventario de préstamos y triaje de incidencias (HU-19).
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-3">
          <a href="/spaces">
            <Button variant="outline" size="sm">
              Ver Plano de Cine
            </Button>
          </a>
          <a href="/incidents">
            <Button variant="danger" size="sm">
              Gestión de Incidencias
            </Button>
          </a>
        </div>
      </div>

      {/* Selector Dinámico de Franja Horaria y Fecha (HU-19) */}
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

        <div className="flex items-center gap-2 w-full md:w-auto">
          <label htmlFor="dashboard-date" className="text-xs font-semibold text-[#A1A1A6] shrink-0">
            Fecha:
          </label>
          <input
            id="dashboard-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[#2C2C2E] text-[#F5F5F7] text-xs font-medium px-3 py-1.5 rounded-[0.75rem] border border-[rgba(255,255,255,0.08)] outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>
      </div>

      {/* Manejo de Estados: Loading, Error, Empty, Success */}
      {isLoading ? (
        <LoadingState message="Consultando métricas operativas de la franja..." />
      ) : error ? (
        <ErrorMessage
          title="Error al consultar resumen operativo"
          message={error}
          onRetry={() => setSelectedSlot('CURRENT')}
        />
      ) : !summary ? (
        <EmptyState
          title="Sin datos reportados en esta franja"
          description="No se registran actividades ni asignaciones para la fecha y franja seleccionadas."
          action={
            <Button size="sm" variant="outline" onClick={() => setSelectedSlot('CURRENT')}>
              Volver a la Franja Actual
            </Button>
          }
        />
      ) : (
        <>
          {/* Grid de las 4 Métricas Principales (HU-19) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Espacios libres vs. ocupados */}
            <StatCard
              title="Espacios Libres vs. Ocupados"
              value={`${summary.spacesFree} / ${summary.spacesTotal}`}
              subtitle={`${summary.spacesOccupied} salas ocupadas en franja`}
              color="ok"
              trend={{ positive: summary.spacesFree >= 5, label: `${summary.spacesFree * 10}% libre` }}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />

            {/* 2. Préstamos de equipos activos */}
            <StatCard
              title="Préstamos Activos"
              value={summary.activeLoans}
              subtitle={`${summary.availableLoans} equipos en stock`}
              color="secondary"
              trend={{ positive: true, label: 'Inventario OK' }}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />

            {/* 3. Recursos inhabilitados por fallas */}
            <StatCard
              title="Recursos Inhabilitados"
              value={summary.disabledResources}
              subtitle="Bloqueados por seguridad técnica"
              color={summary.disabledResources > 0 ? 'incident' : 'ok'}
              trend={{ positive: summary.disabledResources === 0, label: `${summary.disabledResources} bloqueados` }}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              }
            />

            {/* 4. Incidencias abiertas vs. en proceso */}
            <StatCard
              title="Incidencias Abiertas"
              value={`${summary.openIncidents}`}
              subtitle={`${summary.inProgressIncidents} en proceso de mitigación`}
              color="danger"
              trend={{ positive: false, label: 'Triaje Activo' }}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />
          </div>

          {/* Bloque de Continuidad Operativa Inteligente & Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card
                title="Módulo de Continuidad Operativa Inteligente"
                subtitle="Detección de salas inhabilitadas y propuesta de alternativas compatibles"
                action={
                  <a href="/incidents">
                    <Button size="sm" variant="secondary">
                      Ver Triaje
                    </Button>
                  </a>
                }
              >
                {summary.aiRecommendationAvailable ? (
                  <div className="p-4 rounded-[1.25rem] bg-[#2C2C2E]/60 border border-[#0891B2]/30 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="p-2 rounded-xl bg-[#0891B2]/20 text-[#22D3EE] font-extrabold text-xs">
                        AI
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-[#F5F5F7]">
                          Reubicación sugerida para Apolo (SAL-005)
                        </h4>
                        <p className="text-xs text-[#A1A1A6] mt-0.5 leading-relaxed">
                          La sala Apolo reportó incidencia de aire acondicionado. El motor clasificó la incidencia y recomienda mover la reserva de 34 asistentes a <strong className="text-[#60A5FA]">Spooki (SAL-004)</strong> disponible en la misma franja.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
                      <a href="/incidents">
                        <Button size="sm" variant="ok">
                          Revisar en Incidencias
                        </Button>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-[1.25rem] bg-[#2C2C2E]/30 border border-[rgba(255,255,255,0.04)] text-center text-xs text-[#A1A1A6]">
                    ✓ No hay contingencias activas pendientes en esta franja horaria.
                  </div>
                )}

                {/* Submétricas de arquitectura */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-[0.75rem] bg-[#2C2C2E]/40 border border-[rgba(255,255,255,0.04)]">
                    <span className="text-[#A1A1A6] block">Aforo Total Campus</span>
                    <span className="text-base font-bold text-[#F5F5F7] mt-0.5 block">263 puestos</span>
                  </div>
                  <div className="p-3 rounded-[0.75rem] bg-[#2C2C2E]/40 border border-[rgba(255,255,255,0.04)]">
                    <span className="text-[#A1A1A6] block">Base de Datos</span>
                    <span className="text-base font-bold text-[#30D158] mt-0.5 block">SQLite Persistente</span>
                  </div>
                  <div className="p-3 rounded-[0.75rem] bg-[#2C2C2E]/40 border border-[rgba(255,255,255,0.04)]">
                    <span className="text-[#A1A1A6] block">Backend API</span>
                    <span className="text-base font-bold text-[#22D3EE] mt-0.5 block">FastAPI Modular</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Feed de Eventos Recientes de la Franja */}
            <div>
              <Card
                title="Eventos Recientes"
                subtitle={summary.slotLabel}
              >
                <div className="space-y-3">
                  {summary.recentEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 rounded-[0.75rem] bg-[#2C2C2E]/50 border border-[rgba(255,255,255,0.04)] text-xs flex items-start gap-2.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#F5F5F7] truncate">{evt.title}</p>
                        <p className="text-[#A1A1A6] truncate">{evt.room}</p>
                        <span className="text-[10px] text-[#A1A1A6]/70 mt-0.5 block">
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
