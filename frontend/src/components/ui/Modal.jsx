/**
 * Modal accesible y fluido con fondo difuminado y escala física 0.95 -> 1.0 (sin scale-0).
 * Área: UI Compartida (MAFE placeholder funcional para consumo de GUERRA).
 */

import { useEffect } from 'react'

export default function Modal({
  isOpen,
  onClose,
  title,
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
      {/* Fondo difuminado */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity"
      />

      {/* Caja del modal */}
      <div
        className={`relative w-full ${maxWidth} rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200/90 transform transition-all duration-200 ease-out animate-in fade-in zoom-in-95`}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
          <h3 className="text-lg font-semibold text-zinc-900 tracking-tight">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 rounded-lg p-1 transition-colors"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
