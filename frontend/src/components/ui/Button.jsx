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
      'bg-[#2563eb] text-white hover:bg-blue-600 active:bg-blue-700 shadow-[0_2px_12px_rgba(37,99,235,0.3)] focus-visible:ring-[#2563eb]',
    secondary:
      'bg-[#2c2c2e] text-[#f5f5f7] hover:bg-[#3a3a3c] active:bg-[#434655] border border-white/[0.08] focus-visible:ring-[#8d90a0]',
    outline:
      'border border-white/[0.12] text-[#e4e2e4] bg-[#1c1c1e] hover:bg-[#2c2c2e] active:bg-[#353437] shadow-sm focus-visible:ring-[#8d90a0]',
    ghost:
      'text-[#a1a1a6] bg-transparent hover:bg-white/[0.06] hover:text-[#f5f5f7] active:bg-white/[0.1] focus-visible:ring-white/20',
    danger:
      'bg-[#93000a] text-white hover:bg-rose-700 active:bg-rose-800 shadow-[0_2px_8px_rgba(225,29,72,0.25)] focus-visible:ring-rose-500',
    ai:
      'bg-gradient-to-r from-[#2563eb] via-indigo-600 to-[#2fd9f4] text-white hover:opacity-95 shadow-[0_4px_20px_rgba(37,99,235,0.35)] focus-visible:ring-[#2fd9f4]',
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
