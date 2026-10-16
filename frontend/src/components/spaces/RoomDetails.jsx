import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

/**
 * RoomDetails: Modal/Ficha técnica accesible que despliega el detalle de la sala seleccionada (HU-18).
 * Muestra aforo máximo, estado actual, equipamiento y botones de acción.
 * Área: MAFE (HU-18).
 */
export default function RoomDetails({
  room,
  isOpen = true,
  onClose,
  onReserve,
  onBook,
  onReportIncident,
}) {
  if (!room) return null;

  const handleBook = onReserve || onBook;

  const {
    id = 'SAL-001',
    code,
    name = 'Sala',
    capacity = 0,
    status = 'available',
    description = 'Espacio de trabajo colaborativo optimizado para sesiones académicas y talleres técnicos de Campuslands.',
    equipment = room.resources || ['Proyector láser 4K', 'Sistema de audio', 'Pizarra interactiva', 'Conexión Gigabit LAN'],
    currentReservation,
  } = room;

  const isAvailable = status === 'available';

  const statusConfig = {
    available: { label: 'Disponible', color: 'text-[#30D158]', bg: 'bg-[#30D158]/15 border-[#30D158]/30', dot: 'bg-[#30D158]' },
    occupied: { label: 'Ocupada', color: 'text-[#FF9F0A]', bg: 'bg-[#FF9F0A]/15 border-[#FF9F0A]/30', dot: 'bg-[#FF9F0A]' },
    busy: { label: 'Ocupada', color: 'text-[#FF9F0A]', bg: 'bg-[#FF9F0A]/15 border-[#FF9F0A]/30', dot: 'bg-[#FF9F0A]' },
    incident: { label: 'Con Incidencia', color: 'text-[#FF6B35]', bg: 'bg-[#FF6B35]/15 border-[#FF6B35]/30', dot: 'bg-[#FF6B35]' },
    disabled: { label: 'Inhabilitada', color: 'text-[#FF453A]', bg: 'bg-[#FF453A]/15 border-[#FF453A]/30', dot: 'bg-[#FF453A]' },
    maintenance: { label: 'Inhabilitada', color: 'text-[#FF453A]', bg: 'bg-[#FF453A]/15 border-[#FF453A]/30', dot: 'bg-[#FF453A]' },
  };

  const currentStatus = statusConfig[status] || statusConfig.available;
  const displayId = code || id;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${name} — ${displayId}`}
      subtitle="Ficha técnica de espacio y equipamiento"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full">
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          )}
          {onReportIncident && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onReportIncident(room)}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            >
              Reportar Falla
            </Button>
          )}
          {handleBook && isAvailable && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleBook(room)}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            >
              Reservar Espacio
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-5 text-sm text-[#F5F5F7]">
        {/* KPI Grid del Espacio */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-[1.25rem] bg-[#2C2C2E]/60 border border-[rgba(255,255,255,0.06)]">
            <span className="text-[11px] font-semibold text-[#A1A1A6] uppercase tracking-wider block">
              Aforo Máximo
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-[#F5F5F7]">{capacity}</span>
              <span className="text-xs text-[#A1A1A6]">asistentes</span>
            </div>
          </div>

          <div className="p-3.5 rounded-[1.25rem] bg-[#2C2C2E]/60 border border-[rgba(255,255,255,0.06)]">
            <span className="text-[11px] font-semibold text-[#A1A1A6] uppercase tracking-wider block">
              Estado Actual
            </span>
            <div className="mt-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentStatus.bg} ${currentStatus.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot}`} />
                {currentStatus.label}
              </span>
            </div>
          </div>
        </div>

        {/* Reserva en curso si aplica */}
        {currentReservation && (
          <div className="p-4 rounded-[1.25rem] bg-[#FF9F0A]/10 border border-[#FF9F0A]/30">
            <h5 className="text-xs font-bold text-[#FF9F0A] uppercase tracking-wider flex items-center gap-1.5">
              <span>⏱</span>
              <span>Reserva Activa en Franja Actual</span>
            </h5>
            <p className="text-sm font-semibold text-[#F5F5F7] mt-1.5">
              {currentReservation.title || currentReservation}
            </p>
            <p className="text-xs text-[#A1A1A6] mt-0.5">
              Horario asignado: {currentReservation.start || '08:00'} - {currentReservation.end || '12:00'}
            </p>
          </div>
        )}

        {/* Descripción funcional */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#A1A1A6] mb-1">
            Propósito del Espacio
          </h4>
          <p className="text-xs sm:text-sm text-[#F5F5F7]/85 leading-relaxed bg-[#2C2C2E]/30 p-3 rounded-[0.75rem] border border-[rgba(255,255,255,0.04)]">
            {description}
          </p>
        </div>

        {/* Equipamiento disponible */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#A1A1A6] mb-2 flex items-center justify-between">
            <span>Equipamiento Técnico Asignado</span>
            <span className="text-[11px] font-mono text-[#60A5FA] font-normal">{equipment.length} elementos</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {equipment.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2.5 rounded-[0.75rem] bg-[#2C2C2E]/50 border border-[rgba(255,255,255,0.06)] text-xs"
              >
                <span className="text-[#30D158] font-bold">✓</span>
                <span className="text-[#F5F5F7] font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
