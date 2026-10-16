import React from 'react';

/**
 * Atomic Card component with Dark Enclave styling (#1C1C1E surface, radius-card 1.25rem).
 */
export default function Card({
  children,
  variant = 'surface', // 'surface' | 'elevated' | 'glass'
  hoverable = false,
  padding = 'p-5 sm:p-6',
  className = '',
  title,
  subtitle,
  action,
  headerClassName = '',
  ...props
}) {
  const variantStyles = {
    surface: 'bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] shadow-[0_8px_24px_rgba(0,0,0,0.5)]',
    elevated: 'bg-[#2C2C2E] border border-[rgba(255,255,255,0.12)] shadow-[0_12px_32px_rgba(0,0,0,0.6)]',
    glass: 'bg-[rgba(28,28,30,0.7)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] shadow-[0_8px_30px_rgba(0,0,0,0.4)]',
  };

  const hoverStyles = hoverable
    ? 'transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(255,255,255,0.18)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.7)] cursor-pointer'
    : '';

  return (
    <div
      className={`rounded-[1.25rem] text-[#F5F5F7] overflow-hidden ${variantStyles[variant] || variantStyles.surface} ${hoverStyles} ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className={`px-5 pt-5 pb-3 sm:px-6 sm:pt-6 flex items-start justify-between gap-4 border-b border-[rgba(255,255,255,0.06)] ${headerClassName}`}>
          <div>
            {title && <h3 className="text-base sm:text-lg font-semibold tracking-tight text-[#F5F5F7]">{title}</h3>}
            {subtitle && <p className="text-xs sm:text-sm text-[#A1A1A6] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={padding}>
        {children}
      </div>
    </div>
  );
}
