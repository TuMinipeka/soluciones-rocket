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
      className={`rounded-[20px] bg-[#1c1c1e] border-t border-white/[0.09] border-x border-white/[0.04] border-b border-black/50 p-5 sm:p-6 shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition-all duration-150 text-[#e4e2e4] ${className}`}
      {...props}
    >
      {(title || subtitle || action || badge) && (
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-white/[0.06] pb-3.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              {title && (
                <h3 className="text-base font-semibold text-white tracking-tight">
                  {title}
                </h3>
              )}
              {badge && <div>{badge}</div>}
            </div>
            {subtitle && <p className="text-xs text-[#a1a1a6] font-normal">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div>{children}</div>
      {footer && <div className="mt-5 border-t border-white/[0.06] pt-3.5">{footer}</div>}
    </div>
  )
}
