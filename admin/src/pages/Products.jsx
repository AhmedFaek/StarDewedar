import { useState } from 'react'
import { Button, Badge } from '../components'
import { Pagination } from '../components/ui/Pagination'
import { products as mockProducts } from '../data/mockData'
import { formatCurrency } from '../utils/helpers'

export default function ProductsPage() {
  const [products] = useState(mockProducts)
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // --- PAGINATION LOGIC ---
  const itemsPerPage = 4
  const totalPages = Math.ceil(products.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const displayedData = products.slice(startIdx, startIdx + itemsPerPage)

  // Modal State Logic
  const openAddModal = () => {
    setSelectedProduct({ 
      name: '', 
      description: '', 
      price: '', 
      category_id: '', 
      specifications: [],
      catalogs: [] 
    })
    setIsModalOpen(true)
  }

  const openEditModal = (product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    setIsModalOpen(false)
  }

  return (
    <div className="max-w-full relative">
      <div className="flex justify-between items-end mb-12">
        <div>
          <span className="text-tertiary font-bold tracking-widest text-xs uppercase mb-2 block">System Inventory</span>
          <h2 className="text-5xl font-black font-headline tracking-tighter text-primary leading-none">PRODUCTS.</h2>
        </div>
        <Button variant="tertiary" size="lg" icon="add_box" onClick={openAddModal}>
          Add Product
        </Button>
      </div>

      <div className="bg-surface-container-lowest border border-surface-variant overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-surface-variant">
              <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary">ID</th>
              <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary">Product Name</th>
              <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary text-right">Price</th>
              <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant">
            {/* Map over displayedData instead of products */}
            {displayedData.map((item) => (
              <tr key={item.id} className="hover:bg-surface-container-low transition-colors group">
                <td className="px-8 py-6 text-xs font-mono text-slate-400">#{String(item.id).slice(0, 5)}</td>
                <td className="px-8 py-6">
                  <span className="block font-bold text-primary font-headline uppercase">{item.name}</span>
                </td>
                <td className="px-8 py-6 text-right font-mono font-bold text-primary">
                  {formatCurrency(item.price)}
                </td>
                <td className="px-8 py-6 text-right">
                  <button onClick={() => openEditModal(item)} className="text-tertiary hover:text-primary mr-4 uppercase text-xs font-black transition-colors">Edit</button>
                  <button className="text-error uppercase text-xs font-black hover:opacity-70 transition-opacity">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* --- PAGINATION COMPONENT --- */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalDisplayed={displayedData.length}
          totalItems={products.length}
          variant="table"
        />
      </div>

      {/* --- PRODUCT EDIT/ADD MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-surface-container-lowest border border-surface-variant w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in duration-200">
            <form onSubmit={handleSave}>
              <div className="px-8 py-6 bg-surface-container-low border-b border-surface-variant flex justify-between items-center sticky top-0 z-10">
                <h3 className="text-2xl font-black font-headline tracking-tighter text-primary uppercase">
                  {selectedProduct?.id ? 'Edit Product' : 'New System Entry'}<span className="text-tertiary">.</span>
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-secondary hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Basic Info Section */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">Product Name</label>
                    <input 
                      className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-bold focus:outline-none focus:border-tertiary uppercase" 
                      defaultValue={selectedProduct?.name} 
                      placeholder="e.g. Industrial Transformer X-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">Price (EGP)</label>
                    <input 
                      type="number"
                      className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-mono focus:outline-none focus:border-tertiary" 
                      defaultValue={selectedProduct?.price} 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">Category ID (UUID)</label>
                    <input 
                      className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-mono text-xs focus:outline-none focus:border-tertiary" 
                      defaultValue={selectedProduct?.category_id} 
                    />
                  </div>
                </div>

                {/* --- CATALOG UPLOAD SECTION --- */}
                <div className="pt-4 border-t border-surface-variant">
                  <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-4">Product Catalogs / PDF Documentation</label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex flex-col gap-2">
                      <input 
                        type="text" 
                        placeholder="Catalog Title (e.g. Technical Datasheet 2024)" 
                        className="bg-surface-container-low border border-surface-variant px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:border-tertiary"
                      />
                      <label className="relative cursor-pointer bg-surface-container-low border border-dashed border-surface-variant p-4 text-center hover:bg-surface-container-high transition-colors">
                        <span className="material-symbols-outlined text-tertiary block mb-1">upload_file</span>
                        <span className="text-[10px] font-black uppercase text-secondary">Click to upload PDF</span>
                        <input type="file" className="hidden" accept=".pdf" />
                      </label>
                    </div>
                    
                    {/* Catalog List */}
                    <div className="bg-surface-container-low border border-surface-variant p-4 h-32 overflow-y-auto">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 italic">Attached Files:</p>
                      <div className="flex items-center justify-between bg-surface-container-lowest p-2 border border-surface-variant mb-2">
                        <span className="text-[10px] font-bold text-primary truncate uppercase">Maintenance_Guide_V2.pdf</span>
                        <button type="button" className="text-error material-symbols-outlined text-sm hover:opacity-70 transition-opacity">delete</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Specifications */}
                <div className="pt-4 border-t border-surface-variant">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block">Technical Specifications</label>
                    <button type="button" className="text-[10px] font-black text-primary border border-primary px-2 py-1 uppercase hover:bg-primary hover:text-white transition-all">+ Add Spec</button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input placeholder="Key (e.g. Voltage)" className="flex-1 bg-surface-container-low border border-surface-variant px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:border-tertiary" />
                      <input placeholder="Value (e.g. 220V)" className="flex-1 bg-surface-container-low border border-surface-variant px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:border-tertiary" />
                      <button type="button" className="text-error material-symbols-outlined hover:opacity-70 transition-opacity">delete</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 bg-surface-container-low border-t border-surface-variant flex justify-end gap-4 sticky bottom-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-xs font-bold uppercase tracking-widest text-secondary px-6 hover:text-primary transition-colors">Cancel</button>
                <Button type="submit" variant="tertiary">Confirm & Save Product</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}