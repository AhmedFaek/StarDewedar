import { useState } from 'react'
import { Button, Badge } from '../components'
import { Pagination } from '../components/ui/Pagination'
import { categories as mockCategories } from '../data/mockData'

export default function Categories() {
  const [categoryData, setCategoryData] = useState(mockCategories)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)

  // Pagination Logic
  const itemsPerPage = 4
  const totalPages = Math.ceil(categoryData.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const displayedData = categoryData.slice(startIdx, startIdx + itemsPerPage)

  // Handlers
  const openAddModal = () => {
    setSelectedCategory({ name: '', type: 'Product', createdDate: new Date().toISOString().split('T') })
    setIsModalOpen(true)
  }

  const openEditModal = (category) => {
    setSelectedCategory(category)
    setIsModalOpen(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    // Logic to save/update data would go here
    setIsModalOpen(false)
  }

  return (
    <div className="max-w-full relative">
      {/* Hero Header Section */}
      <div className="flex justify-between items-end mb-12">
        <div>
          <span className="text-tertiary font-bold tracking-widest text-xs uppercase mb-2 block">
            System Inventory
          </span>
          <h2 className="text-5xl font-black font-headline tracking-tighter text-primary leading-none">
            CATEGORIES<span className="text-tertiary">.</span>
          </h2>
        </div>
        <Button
          variant="tertiary"
          size="lg"
          icon="add_circle"
          className="flex items-center gap-2"
          onClick={openAddModal}
        >
          Add Category
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
                  Category Name
                </th>
                <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary">
                  Type
                </th>
                <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary">
                  Created Date
                </th>
                <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary text-right">
                  Engineering Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-surface-variant">
              {displayedData.map((item) => (
                <tr key={item.id} className="group hover:bg-surface-container-low transition-colors">
                  <td className="px-8 py-6 text-xs font-mono text-slate-400">
                    #{String(item.id).padStart(3, '0')}
                  </td>
                  <td className="px-8 py-6">
                    <span className="block font-bold text-primary font-headline tracking-tight uppercase">
                      {item.name}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <Badge
                      variant={item.type === 'Product' ? 'default' : 'warning'}
                      className={item.type === 'Product' 
                        ? 'bg-primary text-[#124170]'    // High contrast white on blue
                        : 'bg-amber-500 text-white'  // High contrast white on orange
                      }
                    >
                      {item.type}
                    </Badge>
                  </td>
                  <td className="px-8 py-6 text-sm text-secondary font-medium">
                    {item.createdDate}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-4">
                      <button 
                        onClick={() => openEditModal(item)}
                        className="text-primary hover:text-tertiary transition-colors flex items-center gap-1 text-xs font-bold font-headline uppercase tracking-widest"
                      >
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
          totalItems={categoryData.length}
          variant="table"
        />
      </div>

      {/* --- CATEGORY MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-surface-container-lowest border border-surface-variant w-full max-w-lg shadow-2xl animate-in zoom-in duration-200">
            <form onSubmit={handleSave}>
              <div className="px-8 py-6 bg-surface-container-low border-b border-surface-variant flex justify-between items-center">
                <h3 className="text-2xl font-black font-headline tracking-tighter text-primary uppercase">
                  {selectedCategory?.id ? 'Edit Category' : 'New Classification'}<span className="text-tertiary">.</span>
                </h3>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-secondary hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">Category Label</label>
                  <input 
                    className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-bold focus:outline-none focus:border-tertiary uppercase" 
                    defaultValue={selectedCategory?.name} 
                    placeholder="e.g. HIGH VOLTAGE"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">Operational Type</label>
                  <select 
                    defaultValue={selectedCategory?.type}
                    className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-bold focus:outline-none focus:border-tertiary uppercase"
                  >
                    <option value="Product">Product</option>
                    <option value="Service">Project</option>
                  </select>
                </div>

                {selectedCategory?.id && (
                  <div className="p-4 bg-surface-container-low border border-surface-variant">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">System Audit</label>
                    <p className="text-xs font-mono text-secondary">Reference ID: {selectedCategory.id}</p>
                    <p className="text-xs font-mono text-secondary">Created: {selectedCategory.createdDate}</p>
                  </div>
                )}
              </div>

              <div className="px-8 py-6 bg-surface-container-low border-t border-surface-variant flex justify-end gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-xs font-bold uppercase tracking-widest text-secondary px-6 hover:text-primary"
                >
                  Cancel
                </button>
                <Button type="submit" variant="tertiary">
                  {selectedCategory?.id ? 'Update System' : 'Authorize Classification'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}