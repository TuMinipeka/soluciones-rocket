/**
 * Tabla de datos limpia y minimalista.
 * Área: UI Compartida (MAFE placeholder funcional para consumo de GUERRA).
 */

export default function Table({
  columns = [],
  data = [],
  keyExtractor = (item, index) => item.id || index,
  emptyMessage = 'No hay registros disponibles',
  className = '',
}) {
  return (
    <div className={`overflow-x-auto rounded-[20px] bg-[#1c1c1e] border-t border-white/[0.09] border-x border-white/[0.04] border-b border-black/50 shadow-[0_12px_32px_rgba(0,0,0,0.4)] ${className}`}>
      <table className="min-w-full divide-y divide-white/[0.08] text-left text-sm">
        <thead className="bg-[#131315]/90">
          <tr>
            {columns.map((col, index) => (
              <th
                key={col.key || index}
                scope="col"
                className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#a1a1a6] ${col.headerClassName || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06] bg-[#1c1c1e]">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm text-[#8d90a0]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={keyExtractor(row, rowIndex)}
                className="hover:bg-[#262a31] transition-colors"
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={col.key || colIndex}
                    className={`px-4 py-3.5 text-[#e4e2e4] whitespace-nowrap ${col.cellClassName || ''}`}
                  >
                    {col.render ? col.render(row, rowIndex) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
