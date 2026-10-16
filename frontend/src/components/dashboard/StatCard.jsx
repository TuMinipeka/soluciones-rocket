import React from 'react';
import Card from '../ui/Card';

/**
 * StatCard: Tarjeta de métricas clave (KPI) de alto impacto (HU-19).
 * Incluye foco accesible, valor grande en #F5F5F7, iconos temáticos y microinteracciones.
 */
export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'primary', // 'primary' | 'secondary' | 'ok' | 'busy' | 'incident' | 'danger'
  onClick,
  className = '',
}) {
  const colorMap = {
    primary: {
      text: 'text-[#60A5FA]',
      bg: 'bg-[#2563EB]/15 border-[#2563EB]/30',
      dot: 'bg-[#2563EB]',
      glow: 'group-hover:border-[#2563EB]/40 group-hover:shadow-[0_0_20px_rgba(37,99,235,0.25)]',
    },
    secondary: {
      text: 'text-[#22D3EE]',
      bg: 'bg-[#0891B2]/15 border-[#0891B2]/30',
      dot: 'bg-[#0891B2]',
      glow: 'group-hover:border-[#0891B2]/40 group-hover:shadow-[0_0_20px_rgba(8,145,178,0.25)]',
    },
    ok: {
      text: 'text-[#30D158]',
      bg: 'bg-[#30D158]/15 border-[#30D158]/30',
      dot: 'bg-[#30D158]',
      glow: 'group-hover:border-[#30D158]/40 group-hover:shadow-[0_0_20px_rgba(48,209,88,0.25)]',
    },
    busy: {
      text: 'text-[#FF9F0A]',
      bg: 'bg-[#FF9F0A]/15 border-[#FF9F0A]/30',
      dot: 'bg-[#FF9F0A]',
      glow: 'group-hover:border-[#FF9F0A]/40 group-hover:shadow-[0_0_20px_rgba(255,159,10,0.25)]',
    },
    incident: {
      text: 'text-[#FF6B35]',
      bg: 'bg-[#FF6B35]/15 border-[#FF6B35]/30',
      dot: 'bg-[#FF6B35]',
      glow: 'group-hover:border-[#FF6B35]/40 group-hover:shadow-[0_0_20px_rgba(255,107,53,0.25)]',
    },
    danger: {
      text: 'text-[#FF453A]',
      bg: 'bg-[#FF453A]/15 border-[#FF453A]/30',
      dot: 'bg-[#FF453A]',
      glow: 'group-hover:border-[#FF453A]/40 group-hover:shadow-[0_0_20px_rgba(255,69,58,0.25)]',
    },
  };

  const current = colorMap[color] || colorMap.primary;

  const handleKeyDown = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : 'region'}
      aria-label={`${title}: ${value}. ${subtitle || ''}`}
      onKeyDown={handleKeyDown}
      onClick={onClick}
      padding="p-5"
      className={`group relative overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-[#000000] ${current.glow} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-bold text-[#A1A1A6] uppercase tracking-wider block">
            {title}
          </span>
          <div className="text-3xl font-extrabold text-[#F5F5F7] tracking-tight mt-1.5 font-sans">
            {value}
          </div>
        </div>

        {icon && (
          <div className={`p-2.5 rounded-xl border ${current.bg} ${current.text} flex items-center justify-center shrink-0`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs">
        <span className="text-[#A1A1A6] font-medium truncate">{subtitle}</span>
        {trend && (
          <span className={`font-semibold shrink-0 flex items-center gap-1 ${trend.positive ? 'text-[#30D158]' : 'text-[#FF453A]'}`}>
            <span aria-hidden="true">{trend.positive ? '↑' : '↓'}</span>
            <span>{trend.label}</span>
          </span>
        )}
      </div>
    </Card>
  );
}
