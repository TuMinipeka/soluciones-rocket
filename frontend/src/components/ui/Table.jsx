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
    <div className={`overflow-x-auto rounded-xl border border-zinc-200/80 bg-white shadow-sm ${className}`}>
      <table className="min-w-full divide-y divide-zinc-200/80 text-left text-sm">
        <thead className="bg-zinc-50/75">
          <tr>
            {columns.map((col, index) => (
              <th
                key={col.key || index}
                scope="col"
                className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500 ${col.headerClassName || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm text-zinc-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={keyExtractor(row, rowIndex)}
                className="hover:bg-zinc-50/50 transition-colors"
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={col.key || colIndex}
                    className={`px-4 py-3 text-zinc-700 whitespace-nowrap ${col.cellClassName || ''}`}
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
