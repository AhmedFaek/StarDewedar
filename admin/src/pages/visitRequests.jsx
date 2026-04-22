// ─── visitRequests.jsx ───────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Button } from '../components'
import { Pagination } from '../components/ui/Pagination'
import { formatDate } from '../utils/helpers'
import { getAllVisits, updateVisit, deleteVisit } from '../services/visitService'

export default function VisitRequestsPage() {
  const { t } = useTranslation()
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVisit, setSelectedVisit] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [savingStatus, setSavingStatus] = useState(false)

  const fetchVisits = async () => {
    try {
      setLoading(true)
      const data = await getAllVisits()
      setVisits(data?.data || data || [])
    } catch (error) {
      console.error('Failed to load visits:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchVisits() }, [])

  const itemsPerPage = 4
  const totalPages = Math.ceil(visits.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const displayedData = visits.slice(startIdx, startIdx + itemsPerPage)

  const getStatusVariant = (status) => {
    switch (status) {
      case 'pending':   return 'bg-blue-100 text-blue-700'
      case 'contacted': return 'bg-amber-100 text-amber-700'
      case 'closed':    return 'bg-slate-100 text-slate-500'
      default:          return 'bg-surface-variant text-secondary'
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    setSavingStatus(true)
    try {
      await updateVisit(id, { status: newStatus })
      setVisits(prev => prev.map(v => v.id === id ? { ...v, status: newStatus } : v))
      setSelectedVisit(prev => ({ ...prev, status: newStatus }))
    } catch (error) {
      alert(t('visits.status_error') + ': ' + error.message)
    } finally {
      setSavingStatus(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('visits.delete_confirm'))) return
    try {
      await deleteVisit(id)
      setSelectedVisit(null)
      fetchVisits()
    } catch (error) {
      alert(t('visits.delete_error') + ': ' + error.message)
    }
  }

  return (
    <div className="max-w-full relative">
      <div className="mb-12">
        <span className="text-tertiary font-bold tracking-widest text-xs uppercase mb-2 block">{t('visits.subtitle')}</span>
        <h2 className="text-5xl font-black font-headline tracking-tighter text-primary leading-none">{t('visits.title')}.</h2>
      </div>

      <div className="bg-surface-container-lowest border border-surface-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-surface-variant">
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary">{t('visits.table.factory')}</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary">{t('visits.table.contact')}</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary">{t('visits.table.date')}</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary text-center">{t('visits.table.status')}</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary text-right">{t('visits.table.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {loading ? (
                <tr><td colSpan="5" className="p-10 text-center text-secondary font-bold">{t('common.loading')}</td></tr>
              ) : visits.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-secondary font-bold">{t('visits.no_visits')}</td></tr>
              ) : (
                displayedData.map((visit) => (
                  <tr key={visit.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-8 py-6">
                      <span className="block font-black text-primary font-headline tracking-tight leading-tight uppercase">{visit.factory_name}</span>
                      <span className="text-[10px] text-tertiary font-bold uppercase">{visit.factory_activity}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="block text-sm font-bold text-primary">{visit.name}</span>
                      <span className="block text-xs font-mono text-secondary">{visit.whatsapp_number || visit.phone_number}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-primary font-bold">
                        <span className="material-symbols-outlined text-sm text-tertiary">calendar_today</span>
                        <span className="text-sm">{visit.preferred_date ? formatDate(visit.preferred_date) : '—'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <Badge className={getStatusVariant(visit.status)}>{t(`visits.status.${visit.status}`)}</Badge>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button onClick={() => setSelectedVisit(visit)} className="text-xs font-black text-tertiary hover:text-primary transition-colors uppercase tracking-tighter">
                        {t('visits.table.view')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalDisplayed={displayedData.length} totalItems={visits.length} variant="table" />
      </div>

      {selectedVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest border border-surface-variant w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-8 py-6 bg-surface-container-low border-b border-surface-variant">
              <div>
                <h3 className="text-2xl font-black font-headline tracking-tighter text-primary uppercase">{t('visits.modal.title')}<span className="text-tertiary">.</span></h3>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{t('visits.modal.subtitle')}</p>
              </div>
              <button onClick={() => setSelectedVisit(null)} className="text-secondary hover:text-primary transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="px-8 py-8 space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-1">{t('visits.modal.factory_label')}</label>
                    <p className="font-bold text-primary text-lg leading-tight uppercase">{selectedVisit.factory_name}</p>
                    <p className="text-sm text-secondary italic">{selectedVisit.factory_activity}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-1">{t('visits.modal.address_label')}</label>
                    <p className="text-sm text-primary font-medium">{selectedVisit.address}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-1">
                      {t('visits.modal.status_label')}
                      {savingStatus && <span className="ms-2 text-tertiary normal-case font-normal">{t('visits.modal.saving')}</span>}
                    </label>
                    <select value={selectedVisit.status} onChange={(e) => handleStatusChange(selectedVisit.id, e.target.value)} disabled={savingStatus} className="w-full bg-surface-container-low border border-surface-variant px-3 py-2 text-sm font-bold text-primary focus:outline-none focus:ring-1 focus:ring-tertiary uppercase disabled:opacity-50">
                      <option value="pending">{t('visits.status.pending')}</option>
                      <option value="contacted">{t('visits.status.contacted')}</option>
                      <option value="closed">{t('visits.status.closed')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-1">{t('visits.modal.rep_label')}</label>
                    <p className="font-bold text-primary">{selectedVisit.name}</p>
                    <p className="text-sm text-secondary font-mono">{selectedVisit.email}</p>
                    <p className="text-sm text-secondary font-mono">{selectedVisit.phone_number}</p>
                    {selectedVisit.whatsapp_number && <p className="text-sm text-secondary font-mono">WA: {selectedVisit.whatsapp_number}</p>}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-surface-container-low border-l-4 border-primary flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-1">{t('visits.modal.date_label')}</label>
                  <p className="text-xl font-black text-primary tracking-tight">{selectedVisit.preferred_date ? formatDate(selectedVisit.preferred_date) : '—'}</p>
                </div>
                <span className="material-symbols-outlined text-4xl text-surface-variant">event_available</span>
              </div>
              <div>
                <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">{t('visits.modal.details_label')}</label>
                <div className="bg-surface-container-low p-4 border border-surface-variant text-sm text-secondary leading-relaxed h-32 overflow-y-auto">{selectedVisit.details}</div>
              </div>
            </div>
            <div className="px-8 py-6 bg-surface-container-low border-t border-surface-variant flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button onClick={() => handleDelete(selectedVisit.id)} className="text-xs font-bold uppercase text-error hover:opacity-70 transition-opacity">{t('visits.modal.delete')}</button>
                {selectedVisit.whatsapp_number && (
                  <a href={`https://wa.me/${selectedVisit.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-black text-green-600 hover:opacity-80 transition-opacity uppercase tracking-widest">
                    <span className="material-symbols-outlined text-sm">chat</span> {t('visits.modal.whatsapp')}
                  </a>
                )}
              </div>
              <Button variant="secondary" onClick={() => setSelectedVisit(null)}>{t('visits.modal.close')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}