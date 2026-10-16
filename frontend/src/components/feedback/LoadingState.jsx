/**
 * Estado de carga minimalista.
 * Área: Feedback Compartido (MAFE placeholder funcional para consumo de GUERRA).
 */

export default function LoadingState({
  message = 'Cargando datos…',
  size = 'md',
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="relative flex items-center justify-center mb-3">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-200 border-t-zinc-900 animate-spin" />
      </div>
      <p className="text-xs font-medium text-zinc-500 tracking-wide uppercase">
        {message}
      </p>
    </div>
  )
}
