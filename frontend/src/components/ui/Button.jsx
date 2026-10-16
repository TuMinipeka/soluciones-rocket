/**
 * Botón interactivo minimalista con microinteracciones físicas (Emil Kowalski / Apple design).
 * Área: UI Compartida (MAFE placeholder funcional para consumo de GUERRA).
 */

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  ...props
}) {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 ease-out select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed'

  const variants = {
    primary:
      'bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-950 shadow-[0_1px_2px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_5px_rgba(0,0,0,0.15),0_6px_14px_rgba(0,0,0,0.08)] focus-visible:ring-zinc-900',
    secondary:
      'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:bg-zinc-300 border border-zinc-200/60 focus-visible:ring-zinc-400',
    outline:
      'border border-zinc-200 text-zinc-800 bg-white/80 hover:bg-zinc-50 active:bg-zinc-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)] focus-visible:ring-zinc-400',
    ghost:
      'text-zinc-600 bg-transparent hover:bg-zinc-100/80 hover:text-zinc-900 active:bg-zinc-200/80 focus-visible:ring-zinc-400',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-[0_1px_2px_rgba(225,29,72,0.2)] focus-visible:ring-rose-600',
    ai:
      'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-[0_2px_8px_rgba(124,58,237,0.25)] hover:shadow-[0_4px_16px_rgba(124,58,237,0.35)] focus-visible:ring-violet-500',
  }

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 tracking-tight',
    md: 'text-sm px-4 py-2 gap-2 tracking-tight',
    lg: 'text-base px-5 py-2.5 gap-2.5 tracking-tight font-semibold',
  }

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-0.5 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      ) : Icon ? (
        <Icon className="h-4 w-4" />
      ) : null}
      <span>{children}</span>
    </button>
  )
}
