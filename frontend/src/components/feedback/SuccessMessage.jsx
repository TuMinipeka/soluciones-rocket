/**
 * Mensaje de confirmación y éxito.
 * Área: Feedback Compartido (MAFE placeholder funcional para consumo de GUERRA).
 */

export default function SuccessMessage({
  title = 'Operación exitosa',
  message,
  onDismiss,
  className = '',
}) {
  if (!message) return null

  return (
    <div
      role="status"
      className={`rounded-xl border border-[#30d158]/30 bg-[#30d158]/15 p-4 text-[#30d158] transition-all ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="inline-block mt-0.5 text-[#30d158] font-bold">✓</span>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#30d158]">
              {title}
            </h4>
            <p className="mt-0.5 text-xs text-[#e4e2e4] leading-relaxed">{message}</p>
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-[#a1a1a6] hover:text-white text-sm font-semibold"
            aria-label="Cerrar mensaje"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
