import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import IncidentCard from '../components/incidents/IncidentCard';
import RecommendationCard from '../components/incidents/RecommendationCard';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import EmptyState from '../components/feedback/EmptyState';
import LoadingState from '../components/feedback/LoadingState';
import SuccessMessage from '../components/feedback/SuccessMessage';
import ErrorMessage from '../components/feedback/ErrorMessage';

// 5 Escenarios Mínimos del SEED oficial según Especificación Técnica
const OFFICIAL_SEED_INCIDENTS = [
  {
    id: 'INC-001',
    title: 'Fallo Crítico en Sistema de Aire Acondicionado',
    description: 'Temperatura ambiental excede los 32°C en el aula técnica; los equipos computacionales corren riesgo de apagado por sobrecalentamiento.',
    spaceId: 'SAL-005',
    spaceName: 'Apolo',
    priority: 'ALTA',
    status: 'OPEN',
    createdAt: 'Hoy, 08:30 AM',
    reportedBy: 'Docente Juan Gómez',
    hasRecommendation: true,
    recommendation: {
      classification_source: 'ai',
      targetRoomId: 'SAL-004',
      targetRoomName: 'Spooki',
      reason: 'Aforo compatible (38 PCs disponibles vs 34 requeridas), climatización en estado óptimo y sin reserva agendada en la franja 10:00 - 13:00.',
      confidence: 0.96,
      affectedReservationsCount: 1,
    },
  },
  {
    id: 'INC-002',
    title: 'Daño en Lámpara Principal de Proyector Láser',
    description: 'La imagen parpadea constantemente e impide la visualización de código en pantalla durante la clase magistral.',
    spaceId: 'SAL-001',
    spaceName: 'Auditorio',
    priority: 'MEDIA',
    status: 'IN_PROGRESS',
    createdAt: 'Hoy, 09:10 AM',
    reportedBy: 'Soporte Audiovisual',
    hasRecommendation: true,
    recommendation: {
      classification_source: 'rules',
      targetRoomId: 'SAL-010',
      targetRoomName: 'Artemis',
      reason: 'Regla de contingencia audiovisual R-204: espacio con proyector de repuesto activo y capacidad para dividir el aforo.',
      ruleName: 'Regla Fallback Audiovisual R-204',
      confidence: 0.88,
      affectedReservationsCount: 1,
    },
  },
  {
    id: 'INC-003',
    title: 'Pérdida de Conectividad LAN en Switch Principal',
    description: '12 puestos de trabajo sin acceso a la red interna ni a repositorios durante evaluación práctica.',
    spaceId: 'SAL-003',
    spaceName: 'Skilab',
    priority: 'ALTA',
    status: 'OPEN',
    createdAt: 'Ayer, 04:45 PM',
    reportedBy: 'Docente Carlos Ruiz',
    hasRecommendation: false,
  },
  {
    id: 'INC-004',
    title: 'Mantenimiento Preventivo de Mobiliario y Cableado',
    description: 'Ajuste de canaletas y ergonomía en estaciones de trabajo.',
    spaceId: 'SAL-006',
    spaceName: 'Blanca',
    priority: 'BAJA',
    status: 'IN_PROGRESS',
    createdAt: 'Ayer, 02:00 PM',
    reportedBy: 'Mantenimiento General',
    hasRecommendation: false,
  },
  {
    id: 'INC-005',
    title: 'Interferencia Eléctrica en Tomas Reguladas',
    description: 'Fluctuación en regleta lateral; solventado mediante cambio de pastilla térmica.',
    spaceId: 'SAL-002',
    spaceName: 'Cosmos',
    priority: 'BAJA',
    status: 'RESOLVED',
    createdAt: '15 Oct, 11:20 AM',
    reportedBy: 'Soporte Eléctrico',
    hasRecommendation: false,
  },
];

export default function IncidentsListPage() {
  // Contexto del Layout (rol de usuario y emisor de toast global)
  let outletContext = {};
  try {
    outletContext = useOutletContext() || {};
  } catch (e) {
    // Sin router context
  }

  const userRole = outletContext.userRole || 'ADMIN';
  const setGlobalFeedback = outletContext.setGlobalFeedback;

  const [incidents, setIncidents] = useState(OFFICIAL_SEED_INCIDENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isConfirming, setIsConfirming] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filtrado reactivo
  const filteredIncidents = useMemo(() => {
    return incidents.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.spaceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchPriority = priorityFilter === 'ALL' || item.priority === priorityFilter;
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;

      return matchSearch && matchPriority && matchStatus;
    });
  }, [incidents, searchTerm, priorityFilter, statusFilter]);

  // Manejo de confirmación administrativa de reubicación (HU-20)
  const handleConfirmRelocation = async (recommendation) => {
    setIsConfirming(true);
    setErrorMessage(null);

    try {
      // Simular latencia de confirmación transaccional
      await new Promise((resolve) => setTimeout(resolve, 750));

      setIncidents((prev) =>
        prev.map((inc) =>
          inc.recommendation === recommendation
            ? { ...inc, status: 'RESOLVED', hasRecommendation: false }
            : inc
        )
      );

      const msg = {
        title: 'Reubicación Transaccional Exitosa',
        message: `La reserva afectada ha sido transferida a ${recommendation.targetRoomName} (${recommendation.targetRoomId}). El aforo y recursos fueron actualizados.`,
      };

      setFeedbackMessage(msg);
      if (setGlobalFeedback) {
        setGlobalFeedback({ type: 'success', ...msg });
      }
    } catch (err) {
      const errTxt = 'No se pudo confirmar la reubicación en el servidor.';
      setErrorMessage(errTxt);
      if (setGlobalFeedback) {
        setGlobalFeedback({ type: 'error', title: 'Error Operativo', message: errTxt });
      }
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="space-y-6 animate-fluid-enter" role="region" aria-label="Gestión de Incidencias">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[rgba(255,255,255,0.08)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F5F5F7]">
              Incidencias y Continuidad Operativa
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#0891B2]/20 text-[#22D3EE] font-extrabold border border-[#0891B2]/40 flex items-center gap-1">
              <span>⚡</span> Motor IA & Reglas
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#A1A1A6] mt-1">
            Triaje automatizado de fallas técnicas, salas inhabilitadas y mitigación de continuidad (HU-20).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a href="/incidents/new">
            <Button
              variant="danger"
              size="sm"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Reportar Falla
            </Button>
          </a>
        </div>
      </div>

      {/* Feedback contextual */}
      {feedbackMessage && (
        <SuccessMessage
          title={feedbackMessage.title}
          message={feedbackMessage.message}
          onClose={() => setFeedbackMessage(null)}
        />
      )}

      {errorMessage && (
        <ErrorMessage
          title="Error en la gestión de incidencia"
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}

      {/* Recomendación Activa Destacada para Administrador */}
      {incidents.some((i) => i.hasRecommendation && i.status === 'OPEN') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#22D3EE] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0891B2] animate-ping" />
              Recomendación de Reubicación Pendiente de Aprobación
            </h3>
            <span className="text-[11px] text-[#A1A1A6]">
              Rol actual: <strong className="text-white uppercase">{userRole}</strong>
            </span>
          </div>
          {incidents
            .filter((i) => i.hasRecommendation && i.status === 'OPEN')
            .slice(0, 1)
            .map((inc) => (
              <RecommendationCard
                key={inc.id}
                recommendation={inc.recommendation}
                onConfirm={handleConfirmRelocation}
                isConfirming={isConfirming}
                userRole={userRole}
              />
            ))}
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="p-4 rounded-[1.25rem] bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] flex flex-col md:flex-row items-center gap-3.5">
        <div className="w-full md:w-80">
          <Input
            placeholder="Buscar por ID, sala o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        {/* Filtros de Prioridad */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'ALL', label: 'Todas las Prioridades' },
            { id: 'ALTA', label: 'Alta' },
            { id: 'MEDIA', label: 'Media' },
            { id: 'BAJA', label: 'Baja' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPriorityFilter(item.id)}
              className={`px-3 py-2 rounded-[0.75rem] text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                priorityFilter === item.id
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'bg-[#2C2C2E] text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#3A3A3C]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Filtros de Estado */}
        <div className="flex items-center gap-1.5 w-full md:w-auto md:ml-auto">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'OPEN', label: 'Abiertas' },
            { id: 'RESOLVED', label: 'Resueltas' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`px-3 py-2 rounded-[0.75rem] text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#0891B2] ${
                statusFilter === item.id
                  ? 'bg-[#0891B2] text-white shadow-sm'
                  : 'bg-[#2C2C2E] text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#3A3A3C]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Manejo de Estados: Loading, Empty, Lista */}
      {isLoading ? (
        <LoadingState message="Cargando incidencias registradas..." />
      ) : filteredIncidents.length === 0 ? (
        <EmptyState
          title="No hay incidencias que coincidan"
          description="Todos los servicios del campus se encuentran en estado óptimo bajo estos criterios de búsqueda."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setPriorityFilter('ALL');
                setStatusFilter('ALL');
              }}
            >
              Restablecer Filtros
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredIncidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              onResolve={(inc) => {
                if (inc.recommendation) {
                  handleConfirmRelocation(inc.recommendation);
                } else {
                  setIncidents((prev) =>
                    prev.map((i) => (i.id === inc.id ? { ...i, status: 'RESOLVED' } : i))
                  );
                  const msg = {
                    title: 'Incidencia Marcada como Resuelta',
                    message: `La falla técnica en ${inc.spaceName} ha sido resuelta satisfactoriamente.`,
                  };
                  setFeedbackMessage(msg);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
