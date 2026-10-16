import React from 'react';

/**
 * Atomic Button component compliant with Campus Control Design System.
 * Supports variants: primary, secondary, outline, ghost, danger, ok.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  isLoading = false,
  icon = null,
  className = '',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#000000] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-[0.75rem] gap-1.5',
    md: 'text-sm px-4 py-2.5 rounded-[0.75rem] gap-2',
    lg: 'text-base px-5 py-3 rounded-[0.75rem] gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-[#2563EB] hover:bg-[#3B82F6] text-[#FFFFFF] shadow-sm hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] focus:ring-[#2563EB]',
    secondary: 'bg-[#0891B2] hover:bg-[#06B6D4] text-[#FFFFFF] shadow-sm hover:shadow-[0_0_15px_rgba(8,145,178,0.4)] focus:ring-[#0891B2]',
    outline: 'border border-[rgba(255,255,255,0.12)] bg-transparent hover:bg-[#2C2C2E] text-[#F5F5F7] focus:ring-[rgba(255,255,255,0.2)]',
    ghost: 'bg-transparent hover:bg-[#2C2C2E] text-[#A1A1A6] hover:text-[#F5F5F7] focus:ring-[#2C2C2E]',
    danger: 'bg-[#FF453A] hover:bg-[#FF6961] text-[#FFFFFF] shadow-sm hover:shadow-[0_0_15px_rgba(255,69,58,0.4)] focus:ring-[#FF453A]',
    ok: 'bg-[#30D158] hover:bg-[#34C759] text-[#000000] font-semibold shadow-sm hover:shadow-[0_0_15px_rgba(48,209,88,0.4)] focus:ring-[#30D158]',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Cargando...</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
