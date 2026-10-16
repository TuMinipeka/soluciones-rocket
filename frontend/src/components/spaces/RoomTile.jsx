import React from 'react';

/**
 * RoomTile: Butaca/Espacio interactivo tipo cine (HU-18).
 * Admite navegación por teclado (Enter / Espacio), aforos numéricos con chip y estados accesibles.
 * El color y diseño se determinan estrictamente del payload devuelto por la API.
 */
export default function RoomTile({
  room,
  isSelected = false,
  onClick,
  className = '',
}) {
  const {
    id = 'SAL-000',
    name = 'Sala',
    capacity = 0,
    status = 'available', // 'available' | 'occupied' | 'busy' | 'incident' | 'disabled' | 'maintenance'
    is_blocked = false,
    currentReservation = null,
    equipment = [],
  } = room || {};

  // Normalizar el estado directamente del payload de la API
  let normalizedStatus = status.toLowerCase();
  if (is_blocked || normalizedStatus === 'disabled') {
    normalizedStatus = 'disabled';
  } else if (normalizedStatus === 'occupied') {
    normalizedStatus = 'occupied';
  } else if (normalizedStatus === 'incident') {
    normalizedStatus = 'incident';
  } else {
    normalizedStatus = 'available';
  }

  const statusConfig = {
    available: {
      label: 'Disponible',
      color: 'text-[#30D158]',
      badgeBg: 'bg-[#30D158]/15 border-[#30D158]/30',
      border: 'border-[rgba(255,255,255,0.08)] hover:border-[#30D158]/60',
      glow: 'hover:shadow-[0_0_20px_rgba(48,209,88,0.25)]',
      dot: 'bg-[#30D158]',
      icon: '✓',
      cardBg: 'bg-[#1C1C1E]',
      desc: 'Disponible para asignación',
    },
    occupied: {
      label: 'Ocupada',
      color: 'text-[#FF9F0A]',
      badgeBg: 'bg-[#FF9F0A]/15 border-[#FF9F0A]/30',
      border: 'border-[rgba(255,255,255,0.08)] hover:border-[#FF9F0A]/60',
      glow: 'hover:shadow-[0_0_20px_rgba(255,159,10,0.25)]',
      dot: 'bg-[#FF9F0A]',
      icon: '⏳',
      cardBg: 'bg-[#1C1C1E]',
      desc: 'Con reserva confirmada',
    },
    incident: {
      label: 'Con Incidencia',
      color: 'text-[#FF6B35]',
      badgeBg: 'bg-[#FF6B35]/15 border-[#FF6B35]/30',
      border: 'border-[#FF6B35]/40 hover:border-[#FF6B35]',
      glow: 'hover:shadow-[0_0_20px_rgba(255,107,53,0.3)]',
      dot: 'bg-[#FF6B35]',
      icon: '⚠️',
      cardBg: 'bg-[#1C1C1E]',
      desc: 'Reporte técnico activo',
    },
    disabled: {
      label: 'Inhabilitada',
      color: 'text-[#FF453A]',
      badgeBg: 'bg-[#FF453A]/15 border-[#FF453A]/30',
      border: 'border-[#FF453A]/30',
      glow: '',
      dot: 'bg-[#FF453A]',
      icon: '⛔',
      cardBg: 'hatch-disabled',
      desc: 'Fuera de servicio / Bloqueada',
    },
  };

  const current = statusConfig[normalizedStatus] || statusConfig.available;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(room);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Sala ${name}, código ${id}, aforo ${capacity} personas, estado ${current.label}`}
      onClick={() => onClick?.(room)}
      onKeyDown={handleKeyDown}
      className={`relative rounded-[1.25rem] p-4 border transition-all duration-200 select-none cursor-pointer flex flex-col justify-between min-h-[145px]
        ${current.cardBg}
        ${isSelected
          ? 'ring-2 ring-[#2563EB] border-transparent shadow-[0_0_25px_rgba(37,99,235,0.45)] scale-[1.02]'
          : current.border
        }
        ${current.glow}
        focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-[#000000]
        active:scale-[0.98]
        ${className}
      `}
    >
      {/* Top Header: ID & Status Badge accesible */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono font-bold tracking-wider text-[#A1A1A6]">
          {id}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${current.badgeBg} ${current.color}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
          <span>{current.label}</span>
        </span>
      </div>

      {/* Middle: Room Name & Occupation Text */}
      <div className="my-2">
        <h4 className="text-base font-bold text-[#F5F5F7] tracking-tight group-hover:text-white flex items-center gap-1.5">
          <span>{name}</span>
        </h4>
        {currentReservation ? (
          <p className="text-xs text-[#FF9F0A] truncate mt-0.5 font-medium flex items-center gap-1">
            <span aria-hidden="true">⏱</span>
            <span>{currentReservation.title || currentReservation}</span>
          </p>
        ) : (
          <p className="text-xs text-[#A1A1A6] mt-0.5 truncate">
            {current.desc}
          </p>
        )}
      </div>

      {/* Bottom: Capacity chip & equipment count */}
      <div className="pt-2.5 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#2C2C2E] border border-[rgba(255,255,255,0.06)]">
          <svg className="w-3.5 h-3.5 text-[#60A5FA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="font-bold text-[#F5F5F7]">{capacity}</span>
          <span className="text-[10px] text-[#A1A1A6]">aforo</span>
        </div>

        {equipment && equipment.length > 0 && (
          <span className="text-[10px] text-[#A1A1A6] font-mono">
            +{equipment.length} rec
          </span>
        )}
      </div>
    </div>
  );
}
