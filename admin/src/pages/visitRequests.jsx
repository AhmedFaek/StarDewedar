import { useState } from 'react'
import { Badge, Button } from '../components'
import { Pagination } from '../components/ui/Pagination'
import { visitRequests as mockVisits } from '../data/mockData'

export default function VisitRequestsPage() {
  const [data, setData] = useState(mockVisits)
  const [selectedVisit, setSelectedVisit] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  // --- PAGINATION LOGIC ---
  const itemsPerPage = 4
  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const displayedData = data.slice(startIdx, startIdx + itemsPerPage)

  const handleStatusChange = (id, newStatus) => {
    const updatedData = data.map(visit => 
      visit.id === id ? { ...visit, status: newStatus } : visit
    )
    setData(updatedData)
    setSelectedVisit(prev => ({ ...prev, status: newStatus }))
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case 'new': return 'bg-primary text-[#FF0000]' // Fixed contrast
      case 'contacted': return 'bg-amber-100 text-amber-700'
      case 'closed': return 'bg-slate-100 text-slate-500'
      default: return 'bg-surface-variant text-secondary'
    }
  }

  return (
    <div className="max-w-full relative">
      <div className="mb-12">
        <span className="text-tertiary font-bold tracking-widest text-xs uppercase mb-2 block">Field Operations</span>
        <h2 className="text-5xl font-black font-headline tracking-tighter text-primary leading-none">VISITS.</h2>
      </div>

      <div className="bg-surface-container-lowest border border-surface-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-surface-variant">
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary">Factory / Activity</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary">Contact</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary">Date</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary text-center">Status</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {displayedData.map((visit) => (
                <tr key={visit.id} className="hover:bg-surface-container-low transition-colors group">
                  <td className="px-8 py-6">
                    <span className="block font-black text-primary font-headline tracking-tight leading-tight uppercase">
                      {visit.factory_name}
                    </span>
                    <span className="text-[10px] text-tertiary font-bold uppercase">{visit.factory_activity}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="block text-sm font-bold text-primary">{visit.name}</span>
                    <span className="block text-xs font-mono text-secondary">{visit.whatsapp_number}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <span className="material-symbols-outlined text-sm text-tertiary">calendar_today</span>
                      <span className="text-sm">{visit.preferred_date}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                     <Badge className={getStatusVariant(visit.status)}>{visit.status}</Badge>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => setSelectedVisit(visit)}
                      className="text-xs font-black text-tertiary hover:text-primary transition-colors uppercase tracking-tighter"
                    >
                      View Request →
                    </button>
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
          totalItems={data.length}
          variant="table"
        />
      </div>

      {/* Modal remains the same but uses handleStatusChange correctly */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest border border-surface-variant w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-8 py-6 bg-surface-container-low border-b border-surface-variant">
              <div>
                <h3 className="text-2xl font-black font-headline tracking-tighter text-primary uppercase">
                  Visit Logistics<span className="text-tertiary">.</span>
                </h3>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Operation: Field Inspection</p>
              </div>
              <button onClick={() => setSelectedVisit(null)} className="text-secondary hover:text-primary transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="px-8 py-8 space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-1">Factory Location</label>
                    <p className="font-bold text-primary text-lg leading-tight uppercase">{selectedVisit.factory_name}</p>
                    <p className="text-sm text-secondary italic">{selectedVisit.factory_activity}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-1">Address</label>
                    <p className="text-sm text-primary font-medium">{selectedVisit.address}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-1">Inspection Status</label>
                    <select 
                      value={selectedVisit.status}
                      onChange={(e) => handleStatusChange(selectedVisit.id, e.target.value)}
                      className="w-full bg-surface-container-low border border-surface-variant px-3 py-2 text-sm font-bold text-primary focus:outline-none focus:ring-1 focus:ring-tertiary uppercase"
                    >
                      <option value="new">New Request</option>
                      <option value="contacted">In Coordination</option>
                      <option value="closed">Completed/Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-1">On-site Representative</label>
                    <p className="font-bold text-primary">{selectedVisit.name}</p>
                    <p className="text-sm text-secondary font-mono">{selectedVisit.whatsapp_number}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-surface-container-low border-l-4 border-primary flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-1">Preferred Inspection Date</label>
                  <p className="text-xl font-black text-primary tracking-tight">{selectedVisit.preferred_date}</p>
                </div>
                <span className="material-symbols-outlined text-4xl text-surface-variant">event_available</span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">Scope of Work / Details</label>
                <div className="bg-surface-container-low p-4 border border-surface-variant text-sm text-secondary leading-relaxed h-32 overflow-y-auto">
                  {selectedVisit.details}
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-surface-container-low border-t border-surface-variant flex justify-between items-center">
               <div className="flex gap-4">
                  <a href={`https://wa.me/${selectedVisit.whatsapp_number.replace(/\D/g,'')}`} target="_blank" className="flex items-center gap-2 text-xs font-black text-green-600 hover:opacity-80 transition-opacity uppercase tracking-widest">
                    <span className="material-symbols-outlined text-sm">chat</span> WhatsApp Agent
                  </a>
               </div>
              <Button variant="secondary" onClick={() => setSelectedVisit(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}