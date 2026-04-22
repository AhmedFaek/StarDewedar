import { Card } from './Card'

export const TableCard = ({ 
  title, 
  columns, 
  data,
  actions,
  viewAllLink,
  footerContent
}) => {
  return (
    <Card>
      {/* Header */}
      <div className="px-8 py-6 border-b border-outline-variant border-opacity-10 flex justify-between items-center">
        <h3 className="font-headline font-black text-xl uppercase tracking-tight text-primary">
          {title}
        </h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-8 py-4 text-xs font-bold font-headline uppercase tracking-widest text-secondary"
                >
                  {column.label}
                </th>
              ))}
              {actions && <th className="px-8 py-4 text-right"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant divide-opacity-5">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-surface-container-low transition-colors group"
              >
                {columns.map((column) => (
                  <td
                    key={`${rowIndex}-${column.key}`}
                    className="px-8 py-5"
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-8 py-5 text-right">
                    <button className="material-symbols-outlined text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                      more_vert
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {footerContent && (
        <div className="px-8 py-4 bg-surface-container-low flex justify-end">
          {footerContent}
        </div>
      )}
    </Card>
  )
}
