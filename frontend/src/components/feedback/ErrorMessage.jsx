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
      className={`rounded-xl border border-[#ffb4ab]/30 bg-[#93000a]/20 p-4 text-[#ffdad6] transition-all ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="inline-block mt-0.5 text-[#ffb4ab] font-bold">⚠️</span>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#ffb4ab]">
              {title}
            </h4>
            <p className="mt-0.5 text-xs text-[#ffdad6] leading-relaxed">{message}</p>
          </div>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-xs font-semibold text-[#ffb4ab] underline hover:text-white shrink-0"
          >
            Reintentar
          </button>
        )}
      </div>
    </div>
  )
}
