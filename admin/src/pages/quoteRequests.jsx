// ─── QuoteRequestsPage.jsx ───────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Button } from '../components'
import { Pagination } from '../components/ui/Pagination'
import { getAllQuotes, updateQuote, deleteQuote } from '../services/quoteService'

export default function QuoteRequestsPage() {
  const { t } = useTranslation()
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [savingStatus, setSavingStatus] = useState(false)

  const fetchQuotes = async () => {
    try {
      setLoading(true)
      const data = await getAllQuotes()
      setQuotes(data?.data || data || [])
    } catch (error) {
      console.error('Failed to load quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchQuotes() }, [])

  const itemsPerPage = 4
  const totalPages = Math.ceil(quotes.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const displayedData = quotes.slice(startIdx, startIdx + itemsPerPage)

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
      await updateQuote(id, { status: newStatus })
      setQuotes(prev => prev.map(q => q.id === id ? { ...q, status: newStatus } : q))
      setSelectedRequest(prev => ({ ...prev, status: newStatus }))
    } catch (error) {
      alert(t('quotes.status_error') + ': ' + error.message)
    } finally {
      setSavingStatus(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('quotes.delete_confirm'))) return
    try {
      await deleteQuote(id)
      setSelectedRequest(null)
      fetchQuotes()
    } catch (error) {
      alert(t('quotes.delete_error') + ': ' + error.message)
    }
  }

  return (
    <div className="max-w-full relative">
      <div className="mb-12">
        <span className="text-tertiary font-bold tracking-widest text-xs uppercase mb-2 block">{t('quotes.subtitle')}</span>
        <h2 className="text-5xl font-black font-headline tracking-tighter text-primary leading-none">{t('quotes.title')}.</h2>
      </div>

      <div className="bg-surface-container-lowest border border-surface-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-surface-variant">
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary">{t('quotes.table.requester')}</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary">{t('quotes.table.contact')}</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary">{t('quotes.table.subject')}</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary text-center">{t('quotes.table.status')}</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary text-right">{t('quotes.table.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {loading ? (
                <tr><td colSpan="5" className="p-10 text-center text-secondary font-bold">{t('common.loading')}</td></tr>
              ) : quotes.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-secondary font-bold">{t('quotes.no_quotes')}</td></tr>
              ) : (
                displayedData.map((req) => (
                  <tr key={req.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-8 py-6">
                      <span className="block font-bold text-primary">{req.first_name} {req.last_name}</span>
                      <span className="text-xs font-mono text-slate-400">{req.email}</span>
                    </td>
                    <td className="px-8 py-6"><span className="block text-sm font-bold text-primary">{req.phone}</span></td>
                    <td className="px-8 py-6">
                      <span className="block font-bold text-primary uppercase text-sm tracking-tight">
                        {req.custom_product_name || (req.product ? req.product.name : t('quotes.table.general_inquiry'))}
                      </span>
                      <p className="text-xs text-secondary line-clamp-1 max-w-xs italic">{req.details}</p>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <Badge className={getStatusVariant(req.status)}>{t(`quotes.status.${req.status}`)}</Badge>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button onClick={() => setSelectedRequest(req)} className="text-xs font-black text-tertiary hover:text-primary transition-colors uppercase tracking-tighter">
                        {t('quotes.table.review')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalDisplayed={displayedData.length} totalItems={quotes.length} variant="table" />
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest border border-surface-variant w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-8 py-6 bg-surface-container-low border-b border-surface-variant">
              <div>
                <h3 className="text-2xl font-black font-headline tracking-tighter text-primary uppercase">{t('quotes.modal.title')}<span className="text-tertiary">.</span></h3>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">ID: {selectedRequest.id}</p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-secondary hover:text-primary transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="px-8 py-8 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-1">{t('quotes.modal.customer_label')}</label>
                  <p className="font-bold text-primary">{selectedRequest.first_name} {selectedRequest.last_name}</p>
                  <p className="text-sm text-secondary">{selectedRequest.email}</p>
                  <p className="text-sm text-secondary">{selectedRequest.phone}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-1">
                    {t('quotes.modal.status_label')}
                    {savingStatus && <span className="ms-2 text-tertiary normal-case font-normal">{t('quotes.modal.saving')}</span>}
                  </label>
                  <select value={selectedRequest.status} onChange={(e) => handleStatusChange(selectedRequest.id, e.target.value)} disabled={savingStatus} className="w-full bg-surface-container-low border border-surface-variant px-3 py-2 text-sm font-bold text-primary focus:outline-none focus:ring-1 focus:ring-tertiary uppercase disabled:opacity-50">
                    <option value="pending">{t('quotes.status.pending')}</option>
                    <option value="contacted">{t('quotes.status.contacted')}</option>
                    <option value="closed">{t('quotes.status.closed')}</option>
                  </select>
                </div>
              </div>
              <div className="p-4 bg-surface-container-low border-l-4 border-tertiary">
                <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-1">{t('quotes.modal.product_label')}</label>
                <p className="text-lg font-black text-primary uppercase tracking-tight">
                  {selectedRequest.custom_product_name || selectedRequest.product?.name || t('quotes.modal.product_default')}
                </p>
                {selectedRequest.product_id && <p className="text-xs font-mono text-secondary italic">{t('quotes.modal.product_ref')}: {selectedRequest.product_id}</p>}
              </div>
              <div>
                <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">{t('quotes.modal.specs_label')}</label>
                <div className="bg-surface-container-low p-4 border border-surface-variant text-sm text-secondary leading-relaxed max-h-40 overflow-y-auto">{selectedRequest.details}</div>
              </div>
              {selectedRequest.file_url && (
                <div className="flex items-center gap-4 p-3 border border-dashed border-surface-variant">
                  <span className="material-symbols-outlined text-tertiary">description</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-primary uppercase">{t('quotes.modal.file_label')}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{selectedRequest.file_url}</p>
                  </div>
                  <a href={selectedRequest.file_url} target="_blank" rel="noreferrer" className="text-xs font-black text-tertiary hover:underline uppercase">{t('quotes.modal.file_download')}</a>
                </div>
              )}
            </div>
            <div className="px-8 py-6 bg-surface-container-low border-t border-surface-variant flex justify-between items-center">
              <button onClick={() => handleDelete(selectedRequest.id)} className="text-xs font-bold uppercase text-error hover:opacity-70 transition-opacity">{t('quotes.modal.delete')}</button>
              <Button variant="secondary" onClick={() => setSelectedRequest(null)}>{t('quotes.modal.close')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}