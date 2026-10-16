/**
 * Estado vacío cuando no hay registros ni resultados.
 * Área: Feedback Compartido (MAFE placeholder funcional para consumo de GUERRA).
 */

export default function EmptyState({
  title = 'No hay información disponible',
  description = 'No se encontraron registros para el criterio seleccionado.',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 sm:p-12 text-center">
      <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3 text-sm font-semibold">
        ∅
      </div>
      <h3 className="text-sm font-semibold text-zinc-800 tracking-tight">{title}</h3>
      <p className="mt-1 text-xs text-zinc-500 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
