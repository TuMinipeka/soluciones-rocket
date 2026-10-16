/**
 * Tarjeta contenedor con estética Apple / Emil Kowalski (bordes suaves, sombras por capas).
 * Área: UI Compartida (MAFE placeholder funcional para consumo de GUERRA).
 */

export default function Card({
  children,
  className = '',
  title,
  subtitle,
  action,
  footer,
  ...props
}) {
  return (
    <div
      className={`rounded-xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-zinc-100 pb-3">
          <div>
            {title && <h3 className="text-base font-semibold text-zinc-900 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div>{children}</div>
      {footer && <div className="mt-4 border-t border-zinc-100 pt-3">{footer}</div>}
    </div>
  )
}
