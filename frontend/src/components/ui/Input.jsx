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
          className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-500"
        >
          <span>
            {label} {required && <span className="text-rose-500 font-bold">*</span>}
          </span>
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        required={required}
        className={`w-full rounded-xl border bg-white/90 px-3.5 py-2.5 text-sm text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-150 ease-out placeholder:text-zinc-400 focus:outline-none ${
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
            : 'border-zinc-200/90 hover:border-zinc-300 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-rose-600 font-medium flex items-center gap-1 animate-fluid-enter">
          <span>•</span> {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-[11px] text-zinc-400 font-normal leading-normal">{helperText}</p>
      )}
    </div>
  )
})

export default Input
