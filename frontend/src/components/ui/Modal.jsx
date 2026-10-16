import React, { useEffect } from 'react';

/**
 * Accessible modal dialog with backdrop blur and modal pop-in animation.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-lg',
  className = '',
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm transition-opacity duration-200"
      />

      {/* Modal Card */}
      <div
        className={`relative w-full ${maxWidth} bg-[#1C1C1E] border border-[rgba(255,255,255,0.12)] rounded-[1.25rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden z-10 animate-modal-pop ${className}`}
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="px-6 py-5 flex items-start justify-between border-b border-[rgba(255,255,255,0.08)] bg-[#2C2C2E]/40">
            <div>
              {title && <h3 className="text-lg font-semibold text-[#F5F5F7] tracking-tight">{title}</h3>}
              {subtitle && <p className="text-xs sm:text-sm text-[#A1A1A6] mt-0.5">{subtitle}</p>}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar modal"
                className="text-[#A1A1A6] hover:text-[#F5F5F7] p-1.5 rounded-lg hover:bg-[#2C2C2E] transition-colors -mr-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 max-h-[calc(85vh-8rem)] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 bg-[#2C2C2E]/30 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
