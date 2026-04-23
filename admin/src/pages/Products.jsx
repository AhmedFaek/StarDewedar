import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Badge } from '../components'
import { Pagination } from '../components/ui/Pagination'
import * as productService from '../services/productService'
import { formatCurrency } from '../utils/helpers'
import * as categoryService from '../services/categoryService'

export default function ProductsPage() {
  const { t } = useTranslation()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({ name_en: '', name_ar: '', description_en: '', description_ar: '', price: '', category_id: '' })
  const [catalogs, setCatalogs] = useState([])
  const [images, setImages] = useState([])

  useEffect(() => { fetchProducts(); fetchCategories() }, [])

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await productService.getAllProducts()
      setProducts(data || [])
    } catch (err) {
      setError(err.message || t('common.error'))
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

  const itemsPerPage = 4
  const totalPages = Math.ceil(products.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const displayedData = products.slice(startIdx, startIdx + itemsPerPage)

  const openAddModal = () => {
    setSelectedProduct(null)
    setFormData({ name_en: '', name_ar: '', description_en: '', description_ar: '', price: '', category_id: '' })
    setCatalogs([])
    setImages([])
    setIsModalOpen(true)
  }

  const openEditModal = (product) => {
    setSelectedProduct(product)
    setFormData({ name_en: product.name_en || '', name_ar: product.name_ar || '', description_en: product.description_en || '', description_ar: product.description_ar || '', price: product.price || '', category_id: product.category_id || '' })
    setCatalogs([])
    setImages([])
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError(null)
    setIsSaving(true)
    try {
      if (selectedProduct?.id) {
        await productService.updateProduct(selectedProduct.id, formData)
        setSuccess(t('products.save_success'))
      } else {
        const formDataObj = new FormData()
        formDataObj.append('name_en', formData.name_en)
        formDataObj.append('name_ar', formData.name_ar)
        formDataObj.append('description_en', formData.description_en)
        formDataObj.append('description_ar', formData.description_ar)
        formDataObj.append('price', formData.price)
        formDataObj.append('category_id', formData.category_id)
        images.forEach(img => formDataObj.append('images', img))
        if (catalogs.length > 0) formDataObj.append('catalog', catalogs)
        await productService.createProduct(formDataObj)
        setSuccess(t('products.save_success'))
      }
      await fetchProducts()
      setIsModalOpen(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || t('products.save_error'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('products.delete_confirm'))) return
    setError(null)
    try {
      await productService.deleteProduct(id)
      setSuccess(t('products.delete_success'))
      await fetchProducts()
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

      <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between lg:mb-12">
        <div>
          <span className="text-tertiary font-bold tracking-widest text-xs uppercase mb-2 block">{t('products.subtitle')}</span>
          <h2 className="text-3xl font-black font-headline tracking-tighter text-primary leading-none sm:text-4xl lg:text-5xl">{t('products.title')}.</h2>
        </div>
        <Button variant="tertiary" size="lg" icon="add_box" onClick={openAddModal} disabled={loading} className="w-full sm:w-auto">{t('products.add_button')}</Button>
      </div>

      {loading && !products.length ? (
        <div className="flex items-center justify-center py-20"><p className="text-secondary text-lg">{t('products.loading')}</p></div>
      ) : (
        <div className="bg-surface-container-lowest border border-surface-variant overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-surface-variant">
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary">{t('products.table.id')}</th>
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary">Name</th>
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary text-right">{t('products.table.price')}</th>
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary text-right">{t('products.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {displayedData.length > 0 ? displayedData.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-8 py-6 text-xs font-mono text-slate-400">#{String(item.id).slice(0, 5)}</td>
                    <td className="px-8 py-6"><span className="block font-bold text-primary font-headline uppercase">{item.name_en}</span><span className="block text-xs text-secondary font-medium">{item.name_ar}</span></td>
                    <td className="px-8 py-6 text-right font-mono font-bold text-primary">{formatCurrency(item.price)}</td>
                    <td className="px-8 py-6 text-right">
                      <button onClick={() => openEditModal(item)} className="text-tertiary hover:text-primary me-4 uppercase text-xs font-black transition-colors">{t('common.edit')}</button>
                      <button onClick={() => handleDelete(item.id)} className="text-error uppercase text-xs font-black hover:opacity-70 transition-opacity">{t('common.delete')}</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="px-8 py-12 text-center text-secondary">{t('products.no_products')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {products.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalDisplayed={displayedData.length} totalItems={products.length} variant="table" />}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-surface-container-lowest border border-surface-variant w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <form onSubmit={handleSave}>
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-variant bg-surface-container-low px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
                <h3 className="text-xl font-black font-headline tracking-tighter text-primary uppercase sm:text-2xl">
                  {selectedProduct?.id ? t('products.modal.edit_title') : t('products.modal.add_title')}<span className="text-tertiary">.</span>
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-secondary hover:text-primary transition-colors" disabled={isSaving}><span className="material-symbols-outlined">close</span></button>
              </div>
              <div className="space-y-6 p-4 sm:p-6 lg:space-y-8 lg:p-8">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">Name (EN)</label>
                    <input className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-bold focus:outline-none focus:border-tertiary uppercase" value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} placeholder="Product name in English" required disabled={isSaving} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">الاسم (AR)</label>
                    <input className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-bold focus:outline-none focus:border-tertiary" value={formData.name_ar} onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })} placeholder="اسم المنتج بالعربية" required disabled={isSaving} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">{t('products.modal.price_label')}</label>
                    <input type="number" className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-mono focus:outline-none focus:border-tertiary" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" disabled={isSaving} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">{t('products.modal.category_label')}</label>
                    <select className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-bold text-xs focus:outline-none focus:border-tertiary uppercase" value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} required disabled={isSaving}>
                      <option value="" disabled>{t('products.modal.category_placeholder')}</option>
                      <optgroup label={t('categories.modal.type_product')}>
                        {categories.filter(c => c.type === 'product').map(cat => <option key={cat.id} value={cat.id}>{cat.name_ar}</option>)}
                      </optgroup>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">Description (EN)</label>
                    <textarea className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary focus:outline-none focus:border-tertiary resize-none" value={formData.description_en} onChange={(e) => setFormData({ ...formData, description_en: e.target.value })} placeholder="Product description in English" rows="3" disabled={isSaving} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">الوصف (AR)</label>
                    <textarea className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary focus:outline-none focus:border-tertiary resize-none" value={formData.description_ar} onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })} placeholder="وصف المنتج بالعربية" rows="3" disabled={isSaving} />
                  </div>
                </div>
                {!selectedProduct?.id && (
                  <div className="pt-6 border-t border-surface-variant">
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-4">{t('products.modal.assets_label')}</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className={`cursor-pointer bg-surface-container-low border-2 border-dashed border-surface-variant p-6 text-center hover:border-tertiary transition-all ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
                        <span className="material-symbols-outlined text-tertiary block mb-2">picture_as_pdf</span>
                        <span className="text-[10px] font-black uppercase text-secondary block">{catalogs.length > 0 ? catalogs[0]?.name : t('products.modal.catalog_label')}</span>
                        <input type="file" className="hidden" accept=".pdf" onChange={(e) => setCatalogs(Array.from(e.target.files))} disabled={isSaving} />
                      </label>
                      <label className={`cursor-pointer bg-surface-container-low border-2 border-dashed border-surface-variant p-6 text-center hover:border-tertiary transition-all ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
                        <span className="material-symbols-outlined text-tertiary block mb-2">add_a_photo</span>
                        <span className="text-[10px] font-black uppercase text-secondary block">
                          {images.length > 0 ? t('products.modal.images_selected', { count: images.length }) : t('products.modal.images_label')}
                        </span>
                        <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => setImages(Array.from(e.target.files))} disabled={isSaving} />
                      </label>
                    </div>
                  </div>
                )}
              </div>
              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-surface-variant bg-surface-container-low px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:gap-4 sm:px-6 lg:gap-6 lg:px-8 lg:py-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-xs font-black uppercase tracking-[0.2em] text-secondary hover:text-error transition-colors disabled:opacity-50" disabled={isSaving}>{t('common.discard')}</button>
                <Button type="submit" variant="tertiary" disabled={isSaving} className="w-full sm:min-w-[180px] sm:w-auto">
                  {isSaving ? t('common.processing') : t('products.modal.submit')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
