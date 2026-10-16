import React from 'react';

/**
 * Accessible Success Message feedback banner.
 */
export default function SuccessMessage({
  title = 'Operación exitosa',
  message,
  onClose,
  className = '',
}) {
  if (!message && !title) return null;

  return (
    <div
      role="status"
      className={`flex items-start gap-3 p-4 rounded-[0.75rem] bg-[#30D158]/10 border border-[#30D158]/30 text-[#F5F5F7] ${className}`}
    >
      <div className="shrink-0 text-[#30D158] mt-0.5">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        {title && <h4 className="text-sm font-semibold text-[#30D158]">{title}</h4>}
        {message && <p className="text-xs sm:text-sm text-[#F5F5F7]/90 mt-0.5">{message}</p>}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-[#A1A1A6] hover:text-[#F5F5F7] p-1 rounded hover:bg-[#30D158]/20 transition-colors"
          aria-label="Cerrar notificación"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
