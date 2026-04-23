import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components'
import { Pagination } from '../components/ui/Pagination'
import { formatCurrency, formatDate } from '../utils/helpers'
import { getAllProjects, createProject, updateProject, deleteProject } from '../services/projectService'
import { getAllCategories } from '../services/categoryService'

export default function Projects() {
  const { t } = useTranslation()
  const [projectData, setProjectData] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedImageCount, setSelectedImageCount] = useState(0)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const data = await getAllProjects()
      setProjectData(data)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await getAllCategories()
      setCategories(data || [])
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  useEffect(() => {
    fetchProjects()
    fetchCategories()
  }, [])

  const itemsPerPage = 4
  const totalPages = Math.ceil(projectData.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const displayedData = projectData.slice(startIdx, startIdx + itemsPerPage)

  const toDateInputValue = (dateStr) => {
    if (!dateStr) return ''
    return dateStr.slice(0, 10)
  }

  const openAddModal = () => {
    setSelectedProject({ title_en: '', title_ar: '', description_en: '', description_ar: '', client_name: '', budget: '', start_date: '', end_date: '', location_en: '', location_ar: '', category_id: '', images: [] })
    setSelectedImageCount(0)
    setIsModalOpen(true)
  }

  const openEditModal = (project) => {
    setSelectedProject(project)
    setSelectedImageCount(0)
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm(t('projects.delete_confirm'))) {
      try {
        await deleteProject(id)
        fetchProjects()
      } catch (error) {
        alert(t('projects.delete_error') + ': ' + error.message)
      }
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    try {
      if (selectedProject?.id) {
        const updateData = Object.fromEntries(formData.entries())
        await updateProject(selectedProject.id, updateData)
      } else {
        await createProject(formData)
      }
      setIsModalOpen(false)
      fetchProjects()
    } catch (error) {
      alert(t('projects.save_error'))
    }
  }

  return (
    <div className="max-w-full relative">
      <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between lg:mb-12">
        <div>
          <span className="text-tertiary font-bold tracking-widest text-xs uppercase mb-2 block">
            {t('projects.subtitle')}
          </span>
          <h2 className="text-3xl font-black font-headline tracking-tighter text-primary leading-none sm:text-4xl lg:text-5xl">
            {t('projects.title')}<span className="text-tertiary">.</span>
          </h2>
        </div>
        <Button variant="tertiary" size="lg" icon="account_tree" onClick={openAddModal} className="w-full sm:w-auto">
          {t('projects.add_button')}
        </Button>
      </div>

      <div className="bg-surface-container-lowest border border-surface-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-surface-variant">
                <th className="px-8 py-5 text-xs font-bold uppercase text-secondary">{t('projects.table.code')}</th>
                <th className="px-8 py-5 text-xs font-bold uppercase text-secondary">{t('projects.table.details')}</th>
                <th className="px-8 py-5 text-xs font-bold uppercase text-secondary">{t('projects.table.timeline')}</th>
                <th className="px-8 py-5 text-xs font-bold uppercase text-secondary text-right">{t('projects.table.budget')}</th>
                <th className="px-8 py-5 text-xs font-bold uppercase text-secondary text-right">{t('projects.table.management')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {loading ? (
                <tr><td colSpan="5" className="p-10 text-center text-secondary font-bold">{t('common.loading')}</td></tr>
              ) : (
                displayedData.map((project) => (
                  <tr key={project.id} className="group hover:bg-surface-container-low transition-colors">
                    <td className="px-8 py-6 text-xs font-mono text-slate-400">
                      PRJ-{String(project.id).slice(0, 5).toUpperCase()}
                    </td>
                    <td className="px-8 py-6">
                      <span className="block font-bold text-primary uppercase">{project.title_en}</span>
                      <span className="block text-sm text-secondary">{project.title_ar}</span>
                      <span className="text-sm text-secondary uppercase mt-1 block">{project.client_name}</span>
                      <div className="text-[13px] text-tertiary uppercase mt-1">{project.location_en}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm text-primary">{formatDate(project.start_date)}</div>
                      <div className="text-[12px] text-tertiary font-bold uppercase">
                        {t('projects.table.timeline_to')} {formatDate(project.end_date)}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right font-mono font-bold text-primary">
                      {formatCurrency(project.budget)}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-4">
                        <button onClick={() => openEditModal(project)} className="text-primary hover:text-tertiary transition-colors flex items-center gap-1 text-xs font-bold font-headline uppercase tracking-widest">
                          <span className="material-symbols-outlined text-sm">edit</span>{t('common.edit')}
                        </button>
                        <button onClick={() => handleDelete(project.id)} className="text-error hover:opacity-70 transition-opacity flex items-center gap-1 text-xs font-bold font-headline uppercase tracking-widest">
                          <span className="material-symbols-outlined text-sm">delete</span>{t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalDisplayed={displayedData.length} totalItems={projectData.length} variant="table" />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-surface-container-lowest border border-surface-variant w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <form onSubmit={handleSave}>
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-variant bg-surface-container-low px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
                <h3 className="text-xl font-black uppercase sm:text-2xl">
                  {selectedProject?.id ? t('projects.modal.edit_title') : t('projects.modal.add_title')}.
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="material-symbols-outlined">close</button>
              </div>

              <div className="space-y-6 p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase mb-1 block">Title (EN)</label>
                    <input name="title_en" className="w-full border border-surface-variant px-4 py-3 uppercase font-bold focus:outline-none focus:border-tertiary bg-surface-container-low" defaultValue={selectedProject?.title_en} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase mb-1 block">العنوان (AR)</label>
                    <input name="title_ar" className="w-full border border-surface-variant px-4 py-3 font-bold focus:outline-none focus:border-tertiary bg-surface-container-low" defaultValue={selectedProject?.title_ar} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase mb-1 block">{t('projects.modal.client_label')}</label>
                    <input name="client_name" className="w-full border border-surface-variant px-4 py-3 focus:outline-none focus:border-tertiary bg-surface-container-low" defaultValue={selectedProject?.client_name} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase mb-1 block">Category</label>
                    <select name="category_id" className="w-full border border-surface-variant px-4 py-3 bg-surface-container-low" defaultValue={selectedProject?.category_id}>
                      <option value="">{t('projects.modal.category_placeholder')}</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name_ar} ({cat.type})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase mb-1 block">Location (EN)</label>
                    <input name="location_en" className="w-full border border-surface-variant px-4 py-3 focus:outline-none focus:border-tertiary bg-surface-container-low" defaultValue={selectedProject?.location_en} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase mb-1 block">الموقع (AR)</label>
                    <input name="location_ar" className="w-full border border-surface-variant px-4 py-3 focus:outline-none focus:border-tertiary bg-surface-container-low" defaultValue={selectedProject?.location_ar} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase mb-1 block">{t('projects.modal.budget_label')}</label>
                    <input name="budget" type="number" className="w-full border border-surface-variant px-4 py-3 font-mono bg-surface-container-low" defaultValue={selectedProject?.budget} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 border border-surface-variant bg-surface-container-low p-4 sm:grid-cols-2 lg:gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase mb-1 block">{t('projects.modal.start_date_label')}</label>
                    <input name="start_date" type="date" className="w-full border border-surface-variant px-4 py-2 text-sm bg-surface-container-lowest" defaultValue={toDateInputValue(selectedProject?.start_date)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase mb-1 block">{t('projects.modal.end_date_label')}</label>
                    <input name="end_date" type="date" className="w-full border border-surface-variant px-4 py-2 text-sm bg-surface-container-lowest" defaultValue={toDateInputValue(selectedProject?.end_date)} />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase mb-3 block">{t('projects.modal.gallery_label')}</label>
                  <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-surface-variant hover:border-tertiary bg-surface-container-low w-32 h-32 transition-colors">
                      <span className="material-symbols-outlined text-tertiary">add_a_photo</span>
                      <span className="text-[9px] font-bold uppercase mt-2">{t('projects.modal.gallery_browse')}</span>
                      <input type="file" name="images" multiple className="hidden" accept="image/*" onChange={(e) => e.target.files && setSelectedImageCount(e.target.files.length)} />
                    </label>
                    <div className="flex flex-col">
                      <span className="text-xl font-black text-primary leading-none">{selectedImageCount}</span>
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{t('projects.modal.gallery_new_images')}</span>
                      {selectedProject?.images?.length > 0 && (
                        <span className="text-[10px] text-tertiary mt-1 italic">
                          ({t('projects.modal.gallery_existing', { count: selectedProject.images.length })})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase mb-1 block">Description (EN)</label>
                    <textarea name="description_en" rows="4" className="w-full border border-surface-variant px-4 py-3 text-sm bg-surface-container-low" defaultValue={selectedProject?.description_en} placeholder="Project description in English" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase mb-1 block">الوصف (AR)</label>
                    <textarea name="description_ar" rows="4" className="w-full border border-surface-variant px-4 py-3 text-sm bg-surface-container-low" defaultValue={selectedProject?.description_ar} placeholder="وصف المشروع بالعربية" />
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-surface-variant bg-surface-container-low px-4 py-4 sm:flex-row sm:justify-end sm:gap-4 sm:px-6 lg:px-8 lg:py-6">
                <button type="button" className="text-xs font-bold uppercase tracking-widest text-secondary hover:text-primary" onClick={() => setIsModalOpen(false)}>
                  {t('projects.modal.discard')}
                </button>
                <Button type="submit" variant="tertiary" className="w-full sm:w-auto">{t('projects.modal.submit')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
