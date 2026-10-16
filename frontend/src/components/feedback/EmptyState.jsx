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
    <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-white/[0.1] bg-[#141416]/60 p-8 sm:p-12 text-center">
      <div className="w-10 h-10 rounded-full bg-[#2a2a2c] flex items-center justify-center text-[#22d3ee] mb-3 text-sm font-semibold">
        ∅
      </div>
      <h3 className="text-sm font-semibold text-white tracking-tight">{title}</h3>
      <p className="mt-1 text-xs text-[#a1a1a6] max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
