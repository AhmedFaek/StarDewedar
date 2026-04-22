import { useState, useEffect } from 'react'
import { Button, Badge } from '../components'
import { Pagination } from '../components/ui/Pagination'
import * as categoryService from '../services/categoryService'

export default function Categories() {
  const [categoryData, setCategoryData] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [formData, setFormData] = useState({ name: '', type: 'Product' })
  const [isSaving, setIsSaving] = useState(false)

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await categoryService.getAllCategories()
      setCategoryData(data || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }

  // Pagination Logic
  const itemsPerPage = 6
  const totalPages = Math.ceil(categoryData.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const displayedData = categoryData.slice(startIdx, startIdx + itemsPerPage)

  // Handlers
  const openAddModal = () => {
    setSelectedCategory(null)
    setFormData({ name: '', type: 'product' })
    setIsModalOpen(true)
  }

  const openEditModal = (category) => {
    setSelectedCategory(category)
    setFormData({ name: category.name, type: category.type.toLowerCase() })
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError(null)
    setIsSaving(true)

    try {
      if (selectedCategory?.id) {
        // Update existing category
        await categoryService.updateCategory(selectedCategory.id, formData)
        setSuccess('Category updated successfully')
      } else {
        // Create new category
        await categoryService.createCategory(formData)
        setSuccess('Category created successfully')
      }
      
      // Refresh categories
      await fetchCategories()
      setIsModalOpen(false)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save category')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return
    }

    setError(null)
    try {
      await categoryService.deleteCategory(id)
      setSuccess('Category deleted successfully')
      
      // Refresh categories
      await fetchCategories()
      
      // Reset page if needed
      if (currentPage > totalPages - 1) {
        setCurrentPage(Math.max(1, currentPage - 1))
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || 'Failed to delete category')
    }
  }

  return (
    <div className="max-w-full relative">
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-error-container border border-error text-on-error-container rounded">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-tertiary-fixed border border-tertiary text-on-tertiary-fixed rounded">
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

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
          disabled={loading}
        >
          Add Category
        </Button>
      </div>

      {/* Loading State */}
      {loading && !categoryData.length ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-secondary text-lg">Loading categories...</p>
        </div>
      ) : (
        <>
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
                  {displayedData.length > 0 ? (
                    displayedData.map((item) => (
                      <tr key={item.id} className="group hover:bg-surface-container-low transition-colors">
                        <td className="px-8 py-6 text-xs font-mono text-slate-400">
                          #{String(item.id).slice(0, 6).padStart(3, '0')}
                        </td>
                        <td className="px-8 py-6">
                          <span className="block font-bold text-primary font-headline tracking-tight uppercase">
                            {item.name}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <Badge
                            variant={item.type?.toLowerCase() === 'product' ? 'default' : 'warning'}
                            className={item.type?.toLowerCase() === 'product' 
                              ? 'bg-primary text-[#124170]'
                              : 'bg-amber-500 text-white'
                            }
                          >
                            {item.type?.charAt(0).toUpperCase() + item.type?.slice(1).toLowerCase()}
                          </Badge>
                        </td>
                        <td className="px-8 py-6 text-sm text-secondary font-medium">
                          {new Date(item.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
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
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="text-error hover:opacity-70 transition-opacity flex items-center gap-1 text-xs font-bold font-headline uppercase tracking-widest"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-8 py-12 text-center text-secondary">
                        No categories found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {categoryData.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalDisplayed={displayedData.length}
                totalItems={categoryData.length}
                variant="table"
              />
            )}
          </div>
        </>
      )}

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
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. HIGH VOLTAGE"
                    required
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">Operational Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-bold focus:outline-none focus:border-tertiary uppercase"
                    disabled={isSaving}
                  >
                    <option value="product">Product</option>
                    <option value="project">Project</option>
                  </select>
                </div>

                {selectedCategory?.id && (
                  <div className="p-4 bg-surface-container-low border border-surface-variant">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">System Audit</label>
                    <p className="text-xs font-mono text-secondary">Reference ID: {selectedCategory.id}</p>
                    <p className="text-xs font-mono text-secondary">
                      Created: {new Date(selectedCategory.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>

              <div className="px-8 py-6 bg-surface-container-low border-t border-surface-variant flex justify-end gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-xs font-bold uppercase tracking-widest text-secondary px-6 hover:text-primary disabled:opacity-50"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <Button type="submit" variant="tertiary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : (selectedCategory?.id ? 'Update System' : 'Add Category')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}