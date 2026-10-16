import React from 'react';
import Button from '../ui/Button';

/**
 * Accessible Error Message feedback banner or card.
 */
export default function ErrorMessage({
  title = 'Ha ocurrido un error',
  message,
  onRetry,
  onClose,
  className = '',
}) {
  if (!message && !title) return null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-[0.75rem] bg-[#FF453A]/10 border border-[#FF453A]/30 text-[#F5F5F7] ${className}`}
    >
      <div className="shrink-0 text-[#FF453A] mt-0.5">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        {title && <h4 className="text-sm font-semibold text-[#FF453A]">{title}</h4>}
        {message && <p className="text-xs sm:text-sm text-[#F5F5F7]/90 mt-0.5 break-words">{message}</p>}
        {onRetry && (
          <div className="mt-3">
            <Button size="sm" variant="danger" onClick={onRetry}>
              Reintentar
            </Button>
          </div>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-[#A1A1A6] hover:text-[#F5F5F7] p-1 rounded hover:bg-[#FF453A]/20 transition-colors"
          aria-label="Cerrar alerta"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
