/**
 * Input minimalista con foco suave y soporte para errores y etiquetas accesibles.
 * Área: UI Compartida (MAFE placeholder funcional para consumo de GUERRA).
 */

import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    id,
    type = 'text',
    className = '',
    required = false,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#a1a1a6]"
        >
          <span>
            {label} {required && <span className="text-[#ff453a] font-bold">*</span>}
          </span>
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        required={required}
        className={`w-full rounded-[12px] border bg-[#2c2c2e] px-3.5 py-2.5 text-sm text-[#f5f5f7] shadow-inner transition-all duration-150 ease-out placeholder:text-[#636366] focus:outline-none ${
          error
            ? 'border-[#ff453a] focus:border-[#ff453a] focus:ring-2 focus:ring-[#ff453a]/20'
            : 'border-white/[0.08] hover:border-white/[0.15] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/40'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-[#ffb4ab] font-medium flex items-center gap-1 animate-fluid-enter">
          <span>•</span> {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-[11px] text-[#8d90a0] font-normal leading-normal">{helperText}</p>
      )}
    </div>
  )
})

export default Input
