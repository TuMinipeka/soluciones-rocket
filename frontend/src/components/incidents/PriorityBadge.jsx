import React from 'react';

/**
 * PriorityBadge: Mapea prioridades operativas a colores exactos de diseño (HU-20).
 * Alta: #FF453A, Media: #FF9F0A, Baja: #30D158.
 */
export default function PriorityBadge({ priority = 'MEDIA', className = '' }) {
  const normalized = String(priority).toUpperCase();

  const configs = {
    ALTA: {
      label: 'Alta',
      bg: 'bg-[#FF453A]/15',
      border: 'border-[#FF453A]/30',
      text: 'text-[#FF453A]',
      dot: 'bg-[#FF453A]',
    },
    CRITICA: {
      label: 'Crítica',
      bg: 'bg-[#FF453A]/25',
      border: 'border-[#FF453A]/50',
      text: 'text-[#FF453A]',
      dot: 'bg-[#FF453A] animate-ping',
    },
    MEDIA: {
      label: 'Media',
      bg: 'bg-[#FF9F0A]/15',
      border: 'border-[#FF9F0A]/30',
      text: 'text-[#FF9F0A]',
      dot: 'bg-[#FF9F0A]',
    },
    BAJA: {
      label: 'Baja',
      bg: 'bg-[#30D158]/15',
      border: 'border-[#30D158]/30',
      text: 'text-[#30D158]',
      dot: 'bg-[#30D158]',
    },
  };

  const current = configs[normalized] || configs.MEDIA;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${current.bg} ${current.border} ${current.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  );
}
