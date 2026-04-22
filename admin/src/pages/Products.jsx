import { useState } from 'react'
import { Button, Badge } from '../components'
import { Pagination } from '../components/ui/Pagination'
import { products } from '../data/mockData'

export default function Products() {
  const [productData] = useState(products)
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 4
  const totalPages = Math.ceil(productData.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const displayedData = productData.slice(startIdx, startIdx + itemsPerPage)

  return (
    <div className="max-w-full">
      {/* Hero Header Section */}
      <div className="flex justify-between items-end mb-12">
        <div>
          <span className="text-tertiary font-bold tracking-widest text-xs uppercase mb-2 block">
            System Inventory
          </span>
          <h2 className="text-5xl font-black font-headline tracking-tighter text-primary leading-none">
            PRODUCTS<span className="text-tertiary">.</span>
          </h2>
        </div>
        <Button
          variant="tertiary"
          size="lg"
          icon="add_circle"
          className="flex items-center gap-2"
        >
          Add Product
        </Button>
      </div>

      {/* Table Section */}
      <div className="bg-surface-container-lowest border border-surface-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-surface-variant">
                <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary">
                  # ID
                </th>
                <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary">
                  Product Name
                </th>
                <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary">
                  Category
                </th>
                <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary text-right">
                  Price
                </th>
                <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-surface-variant">
              {displayedData.map((item) => (
                <tr
                  key={item.id}
                  className="group hover:bg-surface-container-low transition-colors"
                >
                  <td className="px-8 py-6 text-xs font-mono text-slate-400">
                    {String(item.id).padStart(3, '0')}
                  </td>
                  <td className="px-8 py-6">
                    <span className="block font-bold text-primary font-headline tracking-tight">
                      {item.name}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm text-secondary">
                    {item.category}
                  </td>
                  <td className="px-8 py-6 text-right font-bold text-primary">
                    EGP {item.price.toLocaleString()}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-4">
                      <button className="text-primary hover:text-tertiary transition-colors flex items-center gap-1 text-xs font-bold font-headline uppercase tracking-widest">
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Edit
                      </button>
                      <button className="text-error hover:opacity-70 transition-opacity flex items-center gap-1 text-xs font-bold font-headline uppercase tracking-widest">
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalDisplayed={displayedData.length}
          totalItems={productData.length}
          variant="table"
        />
      </div>
    </div>
  )
}