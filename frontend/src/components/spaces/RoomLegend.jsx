import React from 'react';

/**
 * RoomLegend: Leyenda accesible con indicador de color, icono y etiqueta textual (HU-18).
 */
export default function RoomLegend({ className = '' }) {
  const items = [
    {
      label: 'Disponible',
      color: 'bg-[#30D158]',
      textColor: 'text-[#30D158]',
      icon: '✓',
      desc: 'Libre para reservar',
      badge: 'border-[#30D158]/30 bg-[#30D158]/10',
    },
    {
      label: 'Ocupada',
      color: 'bg-[#FF9F0A]',
      textColor: 'text-[#FF9F0A]',
      icon: '⏳',
      desc: 'Con reserva activa',
      badge: 'border-[#FF9F0A]/30 bg-[#FF9F0A]/10',
    },
    {
      label: 'Con Incidencia',
      color: 'bg-[#FF6B35]',
      textColor: 'text-[#FF6B35]',
      icon: '⚠️',
      desc: 'Reporte técnico en mitigación',
      badge: 'border-[#FF6B35]/30 bg-[#FF6B35]/10',
    },
    {
      label: 'Inhabilitada / Mantenimiento',
      color: 'bg-[#FF453A]',
      textColor: 'text-[#FF453A]',
      icon: '⛔',
      desc: 'Bloqueada por seguridad',
      badge: 'border-[#FF453A]/30 bg-[#FF453A]/10',
    },
  ];

  return (
    <div
      role="region"
      aria-label="Leyenda de estados de ocupación de salas"
      className={`flex flex-wrap items-center justify-between gap-3 sm:gap-4 p-3.5 rounded-[1.25rem] bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-[#A1A1A6] uppercase tracking-wider">
          Estados:
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {items.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-[0.75rem] border ${item.badge}`}
          >
            <span className={`w-2 h-2 rounded-full ${item.color} shadow-sm shrink-0`} />
            <span className="text-xs" aria-hidden="true">{item.icon}</span>
            <span className={`text-xs font-semibold ${item.textColor}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
