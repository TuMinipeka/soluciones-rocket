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
      className={`rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900 transition-all ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="inline-block mt-0.5 text-emerald-600 font-bold">✓</span>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              {title}
            </h4>
            <p className="mt-0.5 text-xs text-emerald-700 leading-relaxed">{message}</p>
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-emerald-500 hover:text-emerald-800 text-sm font-semibold"
            aria-label="Cerrar mensaje"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
