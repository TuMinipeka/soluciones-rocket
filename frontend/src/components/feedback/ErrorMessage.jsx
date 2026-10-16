/**
 * Mensaje de error accesible, visible y cerrable (G-07).
 * Se presenta cerca de la acción con diseño sobrio y botón de cierre claro sin bloquear la pantalla.
 * Responsable: GUERRA
 */

export default function ErrorMessage({
  title = 'Aviso del Sistema',
  message,
  onRetry,
  onDismiss,
  className = '',
}) {
  if (!message) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`rounded-2xl border border-[#ff453a]/40 bg-[#1e1313] p-4 text-[#ffdad6] shadow-xl shadow-red-950/20 backdrop-blur-md animate-fluid-enter transition-all ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#ff453a]/15 text-[#ff453a] flex items-center justify-center font-bold text-base shrink-0 border border-[#ff453a]/25">
            ⚠️
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#ff8077]">
              {title}
            </h4>
            <p className="mt-1 text-xs text-[#f5f5f7] leading-relaxed font-medium">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              Reintentar
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Cerrar notificación de error"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-sm font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
