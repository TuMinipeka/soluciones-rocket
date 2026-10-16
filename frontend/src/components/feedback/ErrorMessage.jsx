/**
 * Mensaje y banner de error con diseño sobrio y opción de reintento.
 * Área: Feedback Compartido (MAFE placeholder funcional para consumo de GUERRA).
 */

export default function ErrorMessage({
  title = 'Ocurrió un error',
  message,
  onRetry,
  className = '',
}) {
  if (!message) return null

  return (
    <div
      role="alert"
      className={`rounded-xl border border-rose-200 bg-rose-50/75 p-4 text-rose-900 transition-all ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="inline-block mt-0.5 text-rose-600 font-bold">⚠️</span>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-800">
              {title}
            </h4>
            <p className="mt-0.5 text-xs text-rose-700 leading-relaxed">{message}</p>
          </div>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-xs font-semibold text-rose-800 underline hover:text-rose-950 shrink-0"
          >
            Reintentar
          </button>
        )}
      </div>
    </div>
  )
}
