/**
 * Modal accesible y fluido con fondo difuminado y escala física 0.96 -> 1.0 (sin scale-0).
 * Área: UI Compartida (MAFE placeholder funcional para consumo de GUERRA).
 */

import { useEffect } from 'react'

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Fondo translúcido difuminado con fade suave */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-xl transition-opacity duration-200"
      />

      {/* Caja física del modal: entrada con escala 0.96 a 1.0 (Emil Kowalski) */}
      <div
        className={`relative w-full ${maxWidth} rounded-[24px] bg-[#1c1c1e] p-6 sm:p-7 shadow-[0_24px_64px_rgba(0,0,0,0.8)] border-t border-white/[0.12] border-x border-white/[0.04] border-b border-black/80 text-[#e4e2e4] animate-modal-pop`}
      >
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-[#a1a1a6] mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#a1a1a6] hover:text-white bg-[#2c2c2e] hover:bg-[#3a3a3c] active:scale-95 rounded-full p-1.5 transition-all"
            aria-label="Cerrar modal"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  )
}
