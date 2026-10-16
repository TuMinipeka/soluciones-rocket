import React from 'react';

/**
 * EmptyState component for views or lists without records.
 */
export default function EmptyState({
  title = 'No hay registros encontrados',
  description = 'No se encontraron elementos para mostrar en este momento.',
  icon,
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-[1.25rem] border border-dashed border-[rgba(255,255,255,0.12)] bg-[#1C1C1E]/50 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-[#2C2C2E] flex items-center justify-center text-[#A1A1A6] mb-4">
        {icon || (
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-[#F5F5F7] tracking-tight">{title}</h3>
      {description && <p className="mt-1.5 text-xs sm:text-sm text-[#A1A1A6] max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
