import { useState, useEffect } from 'react'
import { Button, Badge } from '../components'
import { Pagination } from '../components/ui/Pagination'
import * as productService from '../services/productService'
import { formatCurrency } from '../utils/helpers'
import * as categoryService from '../services/categoryService'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: ''
  })

  const [catalogs, setCatalogs] = useState([])
  const [images, setImages] = useState([])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await productService.getAllProducts()
      setProducts(data || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getAllCategories()
      setCategories(data || [])
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  // Pagination
  const itemsPerPage = 4
  const totalPages = Math.ceil(products.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const displayedData = products.slice(startIdx, startIdx + itemsPerPage)

  const openAddModal = () => {
    setSelectedProduct(null)
    setFormData({ name: '', description: '', price: '', category_id: '' })
    setCatalogs([])
    setImages([])
    setIsModalOpen(true)
  }

  const openEditModal = (product) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      category_id: product.category_id || ''
    })
    setCatalogs([])
    setImages([])
    setIsModalOpen(true)
  }

  const handleCatalogChange = (e) => setCatalogs(Array.from(e.target.files))
  const handleImagesChange = (e) => setImages(Array.from(e.target.files))

  const handleSave = async (e) => {
    e.preventDefault()
    setError(null)
    setIsSaving(true)

    try {
      if (selectedProduct?.id) {
        await productService.updateProduct(selectedProduct.id, formData)
        setSuccess('Product updated successfully')
      } else {
        const formDataObj = new FormData()
        formDataObj.append('name', formData.name)
        formDataObj.append('description', formData.description)
        formDataObj.append('price', formData.price)
        formDataObj.append('category_id', formData.category_id)

        images.forEach(img => formDataObj.append('images', img))
        if (catalogs.length > 0) formDataObj.append('catalog', catalogs)

        await productService.createProduct(formDataObj)
        setSuccess('Product created successfully')
      }

      await fetchProducts()
      setIsModalOpen(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save product')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    setError(null)
    try {
      await productService.deleteProduct(id)
      setSuccess('Product deleted successfully')
      await fetchProducts()
      if (currentPage > totalPages - 1) setCurrentPage(Math.max(1, currentPage - 1))
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || 'Failed to delete product')
    }
  }

  return (
    <div className="max-w-full relative">
      {/* Error & Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-error-container border border-error text-on-error-container rounded animate-in fade-in duration-300">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-tertiary-fixed border border-tertiary text-on-tertiary-fixed rounded animate-in fade-in duration-300">
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-end mb-12">
        <div>
          <span className="text-tertiary font-bold tracking-widest text-xs uppercase mb-2 block">System Inventory</span>
          <h2 className="text-5xl font-black font-headline tracking-tighter text-primary leading-none">PRODUCTS.</h2>
        </div>
        <Button variant="tertiary" size="lg" icon="add_box" onClick={openAddModal} disabled={loading}>
          Add Product
        </Button>
      </div>

      {/* Table */}
      {loading && !products.length ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-secondary text-lg">Loading products...</p>
        </div>
      ) : (
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
              {displayedData.length > 0 ? (
                displayedData.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-8 py-6 text-xs font-mono text-slate-400">#{String(item.id).slice(0, 5)}</td>
                    <td className="px-8 py-6">
                      <span className="block font-bold text-primary font-headline uppercase">{item.name}</span>
                    </td>
                    <td className="px-8 py-6 text-right font-mono font-bold text-primary">{formatCurrency(item.price)}</td>
                    <td className="px-8 py-6 text-right">
                      <button onClick={() => openEditModal(item)} className="text-tertiary hover:text-primary mr-4 uppercase text-xs font-black transition-colors">Edit</button>
                      <button onClick={() => handleDelete(item.id)} className="text-error uppercase text-xs font-black hover:opacity-70 transition-opacity">Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-8 py-12 text-center text-secondary">No products found</td>
                </tr>
              )}
            </tbody>
          </table>
          {products.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalDisplayed={displayedData.length}
              totalItems={products.length}
              variant="table"
            />
          )}
        </div>
      )}

      {/* --- PRODUCT EDIT/ADD MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-surface-container-lowest border border-surface-variant w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in duration-200">
            <form onSubmit={handleSave}>
              <div className="px-8 py-6 bg-surface-container-low border-b border-surface-variant flex justify-between items-center sticky top-0 z-10">
                <h3 className="text-2xl font-black font-headline tracking-tighter text-primary uppercase">
                  {selectedProduct?.id ? 'Edit Product' : 'New System Entry'}<span className="text-tertiary">.</span>
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-secondary hover:text-primary transition-colors" disabled={isSaving}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">Product Name</label>
                    <input 
                      className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-bold focus:outline-none focus:border-tertiary uppercase transition-all"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. CORE COMPONENT X1"
                      required
                      disabled={isSaving}
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">Unit Price (EGP)</label>
                    <input 
                      type="number"
                      className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-mono focus:outline-none focus:border-tertiary"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      disabled={isSaving}
                    />
                  </div>

                  {/* Category Dropdown with Type grouping */}
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">System Classification</label>
                    <select 
                      className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-bold text-xs focus:outline-none focus:border-tertiary uppercase cursor-pointer appearance-none"
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      required
                      disabled={isSaving}
                    >
                      <option value="" disabled>Select Classification</option>
                      
                      <optgroup label="Products" className="font-bold text-secondary tracking-widest py-2">
                        {categories
                          .filter(c => c.type === 'product')
                          .map(cat => (
                            <option key={cat.id} value={cat.id} className="text-primary bg-surface-container-low">
                              {cat.name}
                            </option>
                          ))
                        }
                      </optgroup>

                      <optgroup label="Projects" className="font-bold text-secondary tracking-widest py-2">
                        {categories
                          .filter(c => c.type === 'project')
                          .map(cat => (
                            <option key={cat.id} value={cat.id} className="text-primary bg-surface-container-low">
                              {cat.name}
                            </option>
                          ))
                        }
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">Technical Description</label>
                  <textarea 
                    className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-body focus:outline-none focus:border-tertiary resize-none transition-all"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter comprehensive product details..."
                    rows="4"
                    disabled={isSaving}
                  />
                </div>

                {!selectedProduct?.id && (
                  <div className="pt-6 border-t border-surface-variant">
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-4">Documentation & Assets</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className={`relative cursor-pointer bg-surface-container-low border-2 border-dashed border-surface-variant p-6 text-center hover:bg-surface-container-high hover:border-tertiary transition-all ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
                        <span className="material-symbols-outlined text-tertiary block mb-2">picture_as_pdf</span>
                        <span className="text-[10px] font-black uppercase text-secondary block">
                          {catalogs.length > 0 ? catalogs.name : 'Upload Catalog (PDF)'}
                        </span>
                        <input type="file" className="hidden" accept=".pdf" onChange={handleCatalogChange} disabled={isSaving} />
                      </label>
                      
                      <label className={`relative cursor-pointer bg-surface-container-low border-2 border-dashed border-surface-variant p-6 text-center hover:bg-surface-container-high hover:border-tertiary transition-all ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
                        <span className="material-symbols-outlined text-tertiary block mb-2">add_a_photo</span>
                        <span className="text-[10px] font-black uppercase text-secondary block">
                          {images.length > 0 ? `${images.length} Image(s) selected` : 'Upload Product Images'}
                        </span>
                        <input type="file" className="hidden" accept="image/*" multiple onChange={handleImagesChange} disabled={isSaving} />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-8 py-6 bg-surface-container-low border-t border-surface-variant flex justify-end items-center gap-6 sticky bottom-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-xs font-black uppercase tracking-[0.2em] text-secondary hover:text-error transition-colors disabled:opacity-50" disabled={isSaving}>Discard</button>
                <Button type="submit" variant="tertiary" disabled={isSaving} className="min-w-[180px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none transition-all">
                  {isSaving ? (
                    <span className="flex items-center gap-2"><span className="animate-spin text-sm">sync</span> Processing...</span>
                  ) : ('Commit to System')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}