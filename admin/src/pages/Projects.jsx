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
    setSelectedProject({ title: '', description: '', client_name: '', budget: '', start_date: '', end_date: '', location: '', category_id: '', images: [] })
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
      <div className="flex justify-between items-end mb-12">
        <div>
          <span className="text-tertiary font-bold tracking-widest text-xs uppercase mb-2 block">
            {t('projects.subtitle')}
          </span>
          <h2 className="text-5xl font-black font-headline tracking-tighter text-primary leading-none">
            {t('projects.title')}<span className="text-tertiary">.</span>
          </h2>
        </div>
        <Button variant="tertiary" size="lg" icon="account_tree" onClick={openAddModal}>
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
                      <span className="block font-bold text-primary uppercase">{project.title}</span>
                      <span className="text-xs text-secondary uppercase">{project.client_name}</span>
                      <div className="text-[11px] text-tertiary uppercase mt-1">{project.location}</div>
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
              <div className="px-8 py-6 bg-surface-container-low border-b border-surface-variant flex justify-between sticky top-0 z-10">
                <h3 className="text-2xl font-black uppercase">
                  {selectedProject?.id ? t('projects.modal.edit_title') : t('projects.modal.add_title')}.
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="material-symbols-outlined">close</button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-tertiary uppercase mb-1 block">{t('projects.modal.title_label')}</label>
                    <input name="title" className="w-full border border-surface-variant px-4 py-3 uppercase font-bold focus:outline-none focus:border-tertiary bg-surface-container-low" defaultValue={selectedProject?.title} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase mb-1 block">{t('projects.modal.client_label')}</label>
                    <input name="client_name" className="w-full border border-surface-variant px-4 py-3 focus:outline-none focus:border-tertiary bg-surface-container-low" defaultValue={selectedProject?.client_name} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase mb-1 block">{t('projects.modal.location_label')}</label>
                    <input name="location" className="w-full border border-surface-variant px-4 py-3 focus:outline-none focus:border-tertiary bg-surface-container-low" defaultValue={selectedProject?.location} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase mb-1 block">{t('projects.modal.category_label')}</label>
                    <select name="category_id" className="w-full border border-surface-variant px-4 py-3 bg-surface-container-low" defaultValue={selectedProject?.category_id}>
                      <option value="">{t('projects.modal.category_placeholder')}</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name} ({cat.type})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase mb-1 block">{t('projects.modal.budget_label')}</label>
                    <input name="budget" type="number" className="w-full border border-surface-variant px-4 py-3 font-mono bg-surface-container-low" defaultValue={selectedProject?.budget} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 p-4 bg-surface-container-low border border-surface-variant">
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
                  <div className="flex items-center gap-4">
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

                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase mb-1 block">{t('projects.modal.description_label')}</label>
                  <textarea name="description" rows="4" className="w-full border border-surface-variant px-4 py-3 text-sm bg-surface-container-low" defaultValue={selectedProject?.description} placeholder={t('projects.modal.description_placeholder')} />
                </div>
              </div>

              <div className="px-8 py-6 border-t border-surface-variant bg-surface-container-low flex justify-end gap-4 sticky bottom-0">
                <button type="button" className="text-xs font-bold uppercase tracking-widest text-secondary hover:text-primary" onClick={() => setIsModalOpen(false)}>
                  {t('projects.modal.discard')}
                </button>
                <Button type="submit" variant="tertiary">{t('projects.modal.submit')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}