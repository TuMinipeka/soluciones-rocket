/**
 * Leyenda accesible de estados de sala (disponible, ocupado, incidencia, inhabilitado).
 * Área: MAFE (HU-18).
 */

export default function RoomLegend() {
  const items = [
    { label: 'Disponible', dot: 'bg-[#30d158]', border: 'border-[#30d158]/40' },
    { label: 'Ocupada', dot: 'bg-[#8d90a0]', border: 'border-white/[0.1]' },
    { label: 'Incidencia reportada', dot: 'bg-[#ff9f0a]', border: 'border-[#ff9f0a]/40' },
    { label: 'Inhabilitada', dot: 'bg-[#ff453a]', border: 'border-[#ff453a]/40' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-4 py-2 text-xs">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${item.dot} border ${item.border}`} />
          <span className="text-[#a1a1a6] font-medium">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
