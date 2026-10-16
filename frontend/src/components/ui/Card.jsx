/**
 * Tarjeta contenedor con estética Apple / Emil Kowalski (bordes suaves, sombras por capas).
 * Área: UI Compartida (MAFE placeholder funcional para consumo de GUERRA).
 */

export default function Card({
  children,
  className = '',
  title,
  subtitle,
  badge,
  action,
  footer,
  ...props
}) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200/75 bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_20px_rgba(0,0,0,0.02)] transition-all duration-150 ${className}`}
      {...props}
    >
      {(title || subtitle || action || badge) && (
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-zinc-100/80 pb-3.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              {title && (
                <h3 className="text-base font-semibold text-zinc-900 tracking-tight">
                  {title}
                </h3>
              )}
              {badge && <div>{badge}</div>}
            </div>
            {subtitle && <p className="text-xs text-zinc-500 font-normal">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div>{children}</div>
      {footer && <div className="mt-5 border-t border-zinc-100/80 pt-3.5">{footer}</div>}
    </div>
  )
}
