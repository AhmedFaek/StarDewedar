// ─── Categories.jsx ──────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Badge } from '../components'
import { Pagination } from '../components/ui/Pagination'
import * as categoryService from '../services/categoryService'

export default function Categories() {
  const { t } = useTranslation()
  const [categoryData, setCategoryData] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [formData, setFormData] = useState({ name_en: '', name_ar: '', type: 'product' })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => { fetchCategories() }, [])

  const fetchCategories = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await categoryService.getAllCategories()
      setCategoryData(data || [])
    } catch (err) {
      setError(err.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const itemsPerPage = 6
  const totalPages = Math.ceil(categoryData.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const displayedData = categoryData.slice(startIdx, startIdx + itemsPerPage)

  const openAddModal = () => {
    setSelectedCategory(null)
    setFormData({ name_en: '', name_ar: '', type: 'product' })
    setIsModalOpen(true)
  }

  const openEditModal = (category) => {
    setSelectedCategory(category)
    setFormData({ name_en: category.name_en || '', name_ar: category.name_ar || '', type: category.type.toLowerCase() })
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError(null)
    setIsSaving(true)
    try {
      if (selectedCategory?.id) {
        await categoryService.updateCategory(selectedCategory.id, formData)
        setSuccess(t('categories.save_success'))
      } else {
        await categoryService.createCategory(formData)
        setSuccess(t('categories.save_success'))
      }
      await fetchCategories()
      setIsModalOpen(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || t('common.error'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('categories.delete_confirm'))) return
    setError(null)
    try {
      await categoryService.deleteCategory(id)
      setSuccess(t('categories.delete_success'))
      await fetchCategories()
      if (currentPage > totalPages - 1) setCurrentPage(Math.max(1, currentPage - 1))
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || t('common.error'))
    }
  }

  return (
    <div className="max-w-full relative">
      {error && <div className="mb-6 p-4 bg-error-container border border-error text-on-error-container rounded"><p className="text-sm font-medium">{error}</p></div>}
      {success && <div className="mb-6 p-4 bg-tertiary-fixed border border-tertiary text-on-tertiary-fixed rounded"><p className="text-sm font-medium">{success}</p></div>}

      <div className="flex justify-between items-end mb-12">
        <div>
          <span className="text-tertiary font-bold tracking-widest text-xs uppercase mb-2 block">{t('categories.subtitle')}</span>
          <h2 className="text-5xl font-black font-headline tracking-tighter text-primary leading-none">{t('categories.title')}<span className="text-tertiary">.</span></h2>
        </div>
        <Button variant="tertiary" size="lg" icon="add_circle" onClick={openAddModal} disabled={loading}>{t('categories.add_button')}</Button>
      </div>

      {loading && !categoryData.length ? (
        <div className="flex items-center justify-center py-20"><p className="text-secondary text-lg">{t('categories.loading')}</p></div>
      ) : (
        <div className="bg-surface-container-lowest border border-surface-variant overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-surface-variant">
                  <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary">{t('categories.table.id')}</th>
                  <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary">{t('categories.table.name')}</th>
                  <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary">{t('categories.table.type')}</th>
                  <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary">{t('categories.table.created')}</th>
                  <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary text-right">{t('categories.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {displayedData.length > 0 ? displayedData.map((item) => (
                  <tr key={item.id} className="group hover:bg-surface-container-low transition-colors">
                    <td className="px-8 py-6 text-xs font-mono text-slate-400">#{String(item.id).slice(0, 6).padStart(3, '0')}</td>
                    <td className="px-8 py-6"><span className="block font-bold text-primary font-headline tracking-tight uppercase">{item.name_en}</span><span className="block text-xs text-secondary font-medium">{item.name_ar}</span></td>
                    <td className="px-8 py-6">
                      <Badge className={item.type?.toLowerCase() === 'product' ? 'bg-primary text-[#124170]' : 'bg-amber-500 text-[#EE4B2B]'}>
                        {item.type?.toLowerCase() === 'product' ? t('categories.modal.type_product') : t('categories.modal.type_project')}
                      </Badge>
                    </td>
                    <td className="px-8 py-6 text-sm text-secondary font-medium">
                      {new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-4">
                        <button onClick={() => openEditModal(item)} className="text-primary hover:text-tertiary transition-colors flex items-center gap-1 text-xs font-bold font-headline uppercase tracking-widest">
                          <span className="material-symbols-outlined text-sm">edit</span>{t('common.edit')}
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="text-error hover:opacity-70 transition-opacity flex items-center gap-1 text-xs font-bold font-headline uppercase tracking-widest">
                          <span className="material-symbols-outlined text-sm">delete</span>{t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="px-8 py-12 text-center text-secondary">{t('categories.no_categories')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {categoryData.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalDisplayed={displayedData.length} totalItems={categoryData.length} variant="table" />}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-surface-container-lowest border border-surface-variant w-full max-w-lg shadow-2xl">
            <form onSubmit={handleSave}>
              <div className="px-8 py-6 bg-surface-container-low border-b border-surface-variant flex justify-between items-center">
                <h3 className="text-2xl font-black font-headline tracking-tighter text-primary uppercase">
                  {selectedCategory?.id ? t('categories.modal.edit_title') : t('categories.modal.add_title')}<span className="text-tertiary">.</span>
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-secondary hover:text-primary transition-colors"><span className="material-symbols-outlined">close</span></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">Name (EN)</label>
                    <input className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-bold focus:outline-none focus:border-tertiary uppercase" value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} placeholder="Enter category name in English" required disabled={isSaving} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">الاسم (AR)</label>
                    <input className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-bold focus:outline-none focus:border-tertiary" value={formData.name_ar} onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })} placeholder="أدخل اسم الفئة بالعربية" required disabled={isSaving} />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">{t('categories.modal.type_label')}</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-bold focus:outline-none focus:border-tertiary uppercase" disabled={isSaving}>
                    <option value="product">{t('categories.modal.type_product')}</option>
                    <option value="project">{t('categories.modal.type_project')}</option>
                  </select>
                </div>
                {selectedCategory?.id && (
                  <div className="p-4 bg-surface-container-low border border-surface-variant">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t('categories.modal.audit_label')}</label>
                    <p className="text-xs font-mono text-secondary">{t('categories.modal.ref_id')}: {selectedCategory.id}</p>
                    <p className="text-xs font-mono text-secondary">{t('categories.modal.created')}: {new Date(selectedCategory.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  </div>
                )}
              </div>
              <div className="px-8 py-6 bg-surface-container-low border-t border-surface-variant flex justify-end gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-xs font-bold uppercase tracking-widest text-secondary px-6 hover:text-primary disabled:opacity-50" disabled={isSaving}>{t('common.cancel')}</button>
                <Button type="submit" variant="tertiary" disabled={isSaving}>
                  {isSaving ? t('common.saving') : (selectedCategory?.id ? t('categories.modal.submit_edit') : t('categories.modal.submit_add'))}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}