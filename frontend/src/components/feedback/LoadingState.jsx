import React from 'react';

/**
 * Feedback component displaying loading indicator and status message.
 */
export default function LoadingState({
  message = 'Cargando información...',
  submessage = 'Por favor espera un momento',
  fullPage = false,
  className = '',
}) {
  const content = (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-[rgba(255,255,255,0.08)] border-t-[#2563EB] animate-spin" />
        <div className="absolute w-6 h-6 rounded-full border-2 border-[rgba(255,255,255,0.04)] border-b-[#0891B2] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
      </div>
      {message && <h4 className="mt-4 text-base font-medium text-[#F5F5F7]">{message}</h4>}
      {submessage && <p className="mt-1 text-xs text-[#A1A1A6]">{submessage}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
