import React from 'react';

/**
 * Reusable data table component with dark theme styling and responsive wrapper.
 */
export default function Table({
  columns = [],
  data = [],
  keyExtractor,
  emptyMessage = 'No hay datos disponibles',
  isLoading = false,
  className = '',
  onRowClick,
}) {
  return (
    <div className={`w-full overflow-x-auto rounded-[1.25rem] border border-[rgba(255,255,255,0.08)] bg-[#1C1C1E] ${className}`}>
      <table className="w-full text-left text-sm text-[#F5F5F7] border-collapse">
        <thead className="bg-[#2C2C2E]/60 text-xs uppercase tracking-wider text-[#A1A1A6] border-b border-[rgba(255,255,255,0.08)]">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                className={`py-3.5 px-4 font-semibold ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-[#A1A1A6]">
                <div className="flex flex-col items-center justify-center gap-2">
                  <svg className="animate-spin h-6 w-6 text-[#2563EB]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Cargando registros...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-10 text-center text-sm text-[#A1A1A6]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => {
              const rowKey = keyExtractor ? keyExtractor(row, rowIdx) : row.id || rowIdx;
              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors duration-150 ${onRowClick ? 'cursor-pointer hover:bg-[#2C2C2E]/60' : 'hover:bg-[#2C2C2E]/30'}`}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.key || colIdx}
                      className={`py-3.5 px-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.cellClassName || ''}`}
                    >
                      {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
