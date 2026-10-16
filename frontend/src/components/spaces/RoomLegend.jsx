/**
 * Leyenda accesible de estados de sala (disponible, ocupado, incidencia, inhabilitado).
 * Área: MAFE (HU-18).
 */

export default function RoomLegend() {
  const items = [
    { label: 'Disponible', color: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
    { label: 'Ocupada', color: 'bg-zinc-200 border-zinc-300 text-zinc-600' },
    { label: 'Incidencia reportada', color: 'bg-amber-100 border-amber-300 text-amber-800' },
    { label: 'Inhabilitada', color: 'bg-rose-100 border-rose-300 text-rose-800' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-4 py-2 text-xs">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className={`w-3.5 h-3.5 rounded-md border ${item.color}`} />
          <span className="text-zinc-600 font-medium">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
