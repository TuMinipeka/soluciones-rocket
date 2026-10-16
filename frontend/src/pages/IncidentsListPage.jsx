import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getIncidentsApi } from '../api/incidents';
import { confirmReallocationApi } from '../api/reservations';
import { useAuth } from '../auth/useAuth';
import IncidentCard from '../components/incidents/IncidentCard';
import RecommendationCard from '../components/incidents/RecommendationCard';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import EmptyState from '../components/feedback/EmptyState';
import LoadingState from '../components/feedback/LoadingState';
import SuccessMessage from '../components/feedback/SuccessMessage';
import ErrorMessage from '../components/feedback/ErrorMessage';

/**
 * Incidencias y Triaje con IA y Reglas Deterministas (HU-20).
 * Protege la confirmación de reubicación exclusivamente para rol 'admin'.
 * Área: MAFE & GUERRA
 */
export default function IncidentsListPage() {
  const { user } = useAuth();

  const [incidents, setIncidents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Consumir getIncidents() de la API de Guerra
  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (typeof getIncidentsApi === 'function') {
        const response = await getIncidentsApi();
        const data = Array.isArray(response) ? response : response?.data || response?.items || response?.incidents;
        if (Array.isArray(data)) {
          setIncidents(data);
        } else {
          throw new Error('La respuesta de incidencias no tiene el formato esperado.');
        }
      } else {
        throw new Error('El cliente de incidencias no está disponible.');
      }
    } catch (err) {
      setIncidents([]);
      setErrorMessage(err?.message || 'No se pudieron consultar las incidencias guardadas.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Filtrado reactivo en cliente
  const filteredIncidents = useMemo(() => {
    return incidents.filter((item) => {
      const title = item.title || item.description || '';
      const space = item.spaceName || item.space_name || item.space_id || '';
      const id = String(item.id || '');

      const matchSearch =
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        space.toLowerCase().includes(searchTerm.toLowerCase()) ||
        id.toLowerCase().includes(searchTerm.toLowerCase());

      const normPriority = (item.priority || '').toLowerCase();
      const matchPriority =
        priorityFilter === 'ALL' ||
        (priorityFilter === 'high' && (normPriority === 'high' || normPriority === 'critical' || normPriority === 'alta')) ||
        (priorityFilter === 'medium' && (normPriority === 'medium' || normPriority === 'media')) ||
        (priorityFilter === 'low' && (normPriority === 'low' || normPriority === 'baja'));

      const normStatus = (item.status || '').toLowerCase();
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'open' && (normStatus === 'open' || normStatus === 'abierta')) ||
        (statusFilter === 'in_progress' && (normStatus === 'in_progress' || normStatus === 'en mitigación')) ||
        (statusFilter === 'resolved' && (normStatus === 'resolved' || normStatus === 'resuelta'));

      return matchSearch && matchPriority && matchStatus;
    });
  }, [incidents, searchTerm, priorityFilter, statusFilter]);

  // Ejecución de reubicación administrativa (SOLO ADMIN, HU-20 / HU-05)
  const handleConfirmRelocation = async (recommendation, incident) => {
    if (user?.role?.toLowerCase() !== 'admin') {
      setErrorMessage('Acción restringida: Solo un usuario con rol de Administrador puede confirmar reubicaciones transaccionales.');
      return;
    }

    setIsConfirming(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    const reservationId = incident?.reservation_id || incident?.affected_reservation_id;
    const targetSpaceId = recommendation?.targetRoomId || recommendation?.target_room_id;
    if (!reservationId || !targetSpaceId) {
      setErrorMessage('La recomendación no contiene una reserva y una sala verificadas para reubicar.');
      setIsConfirming(false);
      return;
    }

    try {
      await confirmReallocationApi(reservationId, {
        new_space_id: targetSpaceId,
        notes: recommendation.reason || `Reubicación confirmada por administrador ${user?.name || user?.email}`,
      });

      await fetchIncidents();

      setFeedbackMessage({
        title: 'Reubicación Confirmada Transaccionalmente',
        message: `La reserva #${reservationId} fue reubicada a ${recommendation.targetRoomName || targetSpaceId}.`,
      });
    } catch (err) {
      setErrorMessage(
        err?.message || 'Error al ejecutar la reubicación de la reserva. Verifique la conectividad con el backend.'
      );
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="space-y-6 animate-fluid-enter" role="region" aria-label="Gestión de Incidencias y Continuidad">
      {/* Cabecera de Página */}
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
            Triaje de fallas técnicas, clasificación inteligente y mitigación de continuidad operativa (HU-20).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchIncidents}
            isLoading={isLoading}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            Sincronizar
          </Button>

          <a href="/incidents">
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

      {/* Banners de Feedback Contextual */}
      {feedbackMessage && (
        <SuccessMessage
          title={feedbackMessage.title}
          message={feedbackMessage.message}
          onDismiss={() => setFeedbackMessage(null)}
        />
      )}

      {errorMessage && (
        <ErrorMessage
          title="Atención Operativa"
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {/* Tarjeta de Recomendación Activa con Triaje IA vs Reglas */}
      {incidents.some((i) => typeof i.recommendation === 'object' && i.recommendation && i.reservation_id && (i.status === 'open' || i.status === 'in_progress')) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#22D3EE] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0891B2] animate-ping" />
              Recomendación de Reubicación Pendiente de Aprobación
            </h3>
            <span className="text-[11px] text-[#A1A1A6]">
              Sesión activa: <strong className="text-white uppercase font-mono">{user?.role || 'sin sesión'}</strong>
            </span>
          </div>

          {incidents
            .filter((i) => typeof i.recommendation === 'object' && i.recommendation && i.reservation_id && (i.status === 'open' || i.status === 'in_progress'))
            .slice(0, 1)
            .map((inc) => (
              <RecommendationCard
                key={inc.id}
                incident={inc}
                recommendation={inc.recommendation}
                user={user}
                onConfirm={(rec) => handleConfirmRelocation(rec, inc)}
                isConfirming={isConfirming}
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

        {/* Prioridades */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'ALL', label: 'Todas las Prioridades' },
            { id: 'high', label: 'Alta' },
            { id: 'medium', label: 'Media' },
            { id: 'low', label: 'Baja' },
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

        {/* Estados */}
        <div className="flex items-center gap-1.5 w-full md:w-auto md:ml-auto">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'open', label: 'Abiertas' },
            { id: 'in_progress', label: 'En Mitigación' },
            { id: 'resolved', label: 'Resueltas' },
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
        <LoadingState message="Cargando incidencias registradas…" />
      ) : errorMessage ? null : filteredIncidents.length === 0 ? (
        <EmptyState
          title="No hay incidencias reportadas"
          description="Todas las instalaciones y equipos operan con normalidad o no coinciden con los filtros aplicados."
        />
      ) : (
        <div className="space-y-4">
          {filteredIncidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={{
                ...incident,
                space_name: incident.space_name || incident.spaceName || incident.space_id,
                spaceName: incident.spaceName || incident.space_name || incident.space_id,
                hasRecommendation: Boolean(incident.recommendation),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
