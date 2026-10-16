import React, { forwardRef } from 'react';

/**
 * Atomic Input component supporting labels, icons, error messages, and control tokens.
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon = null,
    endIcon = null,
    className = '',
    containerClassName = '',
    id,
    type = 'text',
    disabled = false,
    ...props
  },
  ref
) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs sm:text-sm font-medium text-[#A1A1A6] select-none">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3.5 text-[#A1A1A6] pointer-events-none flex items-center justify-center">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          className={`w-full bg-[#1C1C1E] text-[#F5F5F7] placeholder-[#636366] text-sm rounded-[0.75rem] border transition-all duration-200 outline-none
            ${icon ? 'pl-10' : 'pl-3.5'}
            ${endIcon ? 'pr-10' : 'pr-3.5'}
            py-2.5
            ${error
              ? 'border-[#FF453A] focus:border-[#FF453A] focus:ring-2 focus:ring-[#FF453A]/20'
              : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/25'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {endIcon && (
          <span className="absolute right-3.5 text-[#A1A1A6] flex items-center justify-center">
            {endIcon}
          </span>
        )}
      </div>
      {error && (
        <p className="text-xs text-[#FF453A] flex items-center gap-1 mt-0.5">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </p>
      )}
      {!error && helperText && (
        <p className="text-xs text-[#A1A1A6] mt-0.5">{helperText}</p>
      )}
    </div>
  );
});

export default Input;
