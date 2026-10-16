/**
 * Input minimalista con foco sutil y soporte para errores y etiquetas accesibles.
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
          className="block text-xs font-medium uppercase tracking-wider text-zinc-600"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        required={required}
        className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-zinc-900 transition-colors duration-150 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 ${
          error
            ? 'border-rose-400 focus:border-rose-500'
            : 'border-zinc-200 hover:border-zinc-300 focus:border-zinc-900'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-zinc-400">{helperText}</p>}
    </div>
  )
})

export default Input
