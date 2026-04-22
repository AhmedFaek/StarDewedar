import { useState } from 'react'
import { Button } from '../components'
import { Pagination } from '../components/ui/Pagination'
import { projects as mockProjects } from '../data/mockData'
import { formatCurrency } from '../utils/helpers'

export default function Projects() {
  const [projectData, setProjectData] = useState(mockProjects)
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)

  // Pagination Logic
  const itemsPerPage = 4
  const totalPages = Math.ceil(projectData.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const displayedData = projectData.slice(startIdx, startIdx + itemsPerPage)

  // Modal Handlers
  const openAddModal = () => {
    setSelectedProject({
      title: '',
      description: '',
      client_name: '',
      budget: '',
      start_date: '',
      end_date: '',
      category_id: '',
      images: []
    })
    setIsModalOpen(true)
  }

  const openEditModal = (project) => {
    setSelectedProject(project)
    setIsModalOpen(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    // Integration logic for API goes here
    setIsModalOpen(false)
  }

  return (
    <div className="max-w-full relative">
      {/* Header Section */}
      <div className="flex justify-between items-end mb-12">
        <div>
          <span className="text-tertiary font-bold tracking-widest text-xs uppercase mb-2 block">
            Operational Lifecycle
          </span>
          <h2 className="text-5xl font-black font-headline tracking-tighter text-primary leading-none">
            PROJECTS<span className="text-tertiary">.</span>
          </h2>
        </div>
        <Button
          variant="tertiary"
          size="lg"
          icon="account_tree"
          onClick={openAddModal}
          className="flex items-center gap-2"
        >
          New Project
        </Button>
      </div>

      {/* Projects Table */}
      <div className="bg-surface-container-lowest border border-surface-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-surface-variant">
                <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary">Code</th>
                <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary">Details & Client</th>
                <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary">Timeline</th>
                <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary text-right">Budget</th>
                <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary text-right">Management</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-surface-variant">
              {displayedData.map((project) => (
                <tr key={project.id} className="group hover:bg-surface-container-low transition-colors">
                  <td className="px-8 py-6 text-xs font-mono text-slate-400">
                    PRJ-{String(project.id).slice(0, 5).toUpperCase()}
                  </td>
                  <td className="px-8 py-6">
                    <span className="block font-bold text-primary font-headline tracking-tight text-lg uppercase">
                      {project.title || project.name}
                    </span>
                    <span className="text-xs text-secondary font-medium uppercase tracking-wider">
                      {project.client_name || project.client}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm text-primary font-medium block">
                      {project.start_date || project.startDate}
                    </span>
                    <span className="text-[12px] text-tertiary font-bold uppercase">TO {project.end_date || project.endDate}</span>
                  </td>
                  <td className="px-8 py-6 text-right font-mono font-bold text-primary">
                    {formatCurrency(project.budget)}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-4">
                      <button 
                        onClick={() => openEditModal(project)}
                        className="text-primary hover:text-tertiary transition-colors flex items-center gap-1 text-xs font-bold font-headline uppercase tracking-widest"
                      >
                        <span className="material-symbols-outlined text-sm">settings_suggest</span>
                        Manage
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
          totalItems={projectData.length}
          variant="table"
        />
      </div>

      {/* --- PROJECT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-surface-container-lowest border border-surface-variant w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <form onSubmit={handleSave}>
              <div className="px-8 py-6 bg-surface-container-low border-b border-surface-variant flex justify-between items-center sticky top-0 z-10">
                <h3 className="text-2xl font-black font-headline tracking-tighter text-primary uppercase">
                  {selectedProject?.id ? 'Modify Project' : 'Initiate Project'}<span className="text-tertiary">.</span>
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-secondary hover:text-primary">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Basic Details */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">Project Title</label>
                    <input 
                      className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-bold focus:outline-none focus:border-tertiary uppercase" 
                      defaultValue={selectedProject?.title || selectedProject?.name} 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">Client Entity</label>
                    <input 
                      className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary focus:outline-none focus:border-tertiary" 
                      defaultValue={selectedProject?.client_name || selectedProject?.client} 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">Budget (USD)</label>
                    <input 
                      type="number"
                      className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-mono focus:outline-none focus:border-tertiary" 
                      defaultValue={selectedProject?.budget} 
                    />
                  </div>
                </div>

                {/* Timeline Section */}
                <div className="grid grid-cols-2 gap-6 p-6 bg-surface-container-low border border-surface-variant">
                   <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">Start Date</label>
                    <input 
                      type="date"
                      className="w-full bg-surface-container-lowest border border-surface-variant px-4 py-2 text-sm text-primary focus:outline-none focus:border-tertiary" 
                      defaultValue={selectedProject?.start_date || selectedProject?.startDate} 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">Completion Date</label>
                    <input 
                      type="date"
                      className="w-full bg-surface-container-lowest border border-surface-variant px-4 py-2 text-sm text-primary focus:outline-none focus:border-tertiary" 
                      defaultValue={selectedProject?.end_date || selectedProject?.endDate} 
                    />
                  </div>
                </div>

                {/* Gallery Upload Section */}
                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-4">Project Gallery / Site Images</label>
                  <div className="grid grid-cols-4 gap-4">
                    <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-surface-variant hover:border-tertiary cursor-pointer transition-colors bg-surface-container-low">
                      <span className="material-symbols-outlined text-tertiary">add_a_photo</span>
                      <span className="text-[8px] font-black uppercase mt-2">Upload</span>
                      <input type="file" className="hidden" multiple accept="image/*" />
                    </label>
                    {/* Placeholder for existing images */}
                    {selectedProject?.images?.map((img, idx) => (
                      <div key={idx} className="aspect-square bg-slate-200 relative group overflow-hidden">
                         <img src={img.image_url} className="w-full h-full object-cover" alt="Project" />
                         <button className="absolute inset-0 bg-error/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="material-symbols-outlined">delete</span>
                         </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overview */}
                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">Project Description</label>
                  <textarea 
                    rows="4"
                    className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-secondary text-sm focus:outline-none focus:border-tertiary"
                    defaultValue={selectedProject?.description}
                    placeholder="Provide technical scope and objectives..."
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 bg-surface-container-low border-t border-surface-variant flex justify-end gap-4 sticky bottom-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-xs font-bold uppercase tracking-widest text-secondary px-6 hover:text-primary">Discard</button>
                <Button type="submit" variant="tertiary">Save Project Data</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}