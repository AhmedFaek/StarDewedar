import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Button } from '../components'
import { Pagination } from '../components/ui/Pagination'
import { formatDate } from '../utils/helpers'
import { getAllQuotes, updateQuote, deleteQuote } from '../services/quoteService'
import { getAllVisits, updateVisit, deleteVisit } from '../services/visitService'
import { getAllBOQs, updateBOQ, deleteBOQ } from '../services/boqService'

export default function AllRequests() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'

  const [activeTab, setActiveTab] = useState(() => {
    const tab = new URLSearchParams(window.location.search).get('tab')
    return ['all', 'visit', 'quote', 'boq'].includes(tab) ? tab : 'all'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  const [quotes, setQuotes] = useState([])
  const [visits, setVisits] = useState([])
  const [boqs, setBoqs] = useState([])

  const [selectedRequest, setSelectedRequest] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [savingStatus, setSavingStatus] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [quotesRes, visitsRes, boqsRes] = await Promise.allSettled([
        getAllQuotes(),
        getAllVisits(),
        getAllBOQs(),
      ])

      if (quotesRes.status === 'fulfilled') {
        const d = quotesRes.value
        setQuotes(d?.data || (Array.isArray(d) ? d : []))
      }
      if (visitsRes.status === 'fulfilled') {
        const d = visitsRes.value
        setVisits(d?.data || (Array.isArray(d) ? d : []))
      }
      if (boqsRes.status === 'fulfilled') {
        const d = boqsRes.value
        setBoqs(d?.data || (Array.isArray(d) ? d : []))
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  // Normalize all request types into a single format
  const normalizedRequests = useMemo(() => {
    const list = []

    quotes.forEach((q) => {
      list.push({
        id: q.id,
        type: 'quote',
        customerName: `${q.first_name || ''} ${q.last_name || ''}`.trim(),
        companyName: null,
        email: q.email,
        phone: q.phone,
        subject: q.custom_product_name || (q.product ? (isAr ? q.product.name_ar || q.product.name_en : q.product.name_en || q.product.name_ar) : t('quotes.table.general_inquiry')),
        details: q.details,
        date: q.created_at,
        status: q.status || 'pending',
        raw: q,
      })
    })

    visits.forEach((v) => {
      list.push({
        id: v.id,
        type: 'visit',
        customerName: v.name,
        companyName: v.factory_name,
        email: v.email,
        phone: v.phone_number,
        whatsapp: v.whatsapp_number,
        subject: `${v.factory_name || ''} — ${v.factory_activity || ''}`.trim(),
        details: v.details,
        date: v.created_at,
        status: v.status || 'pending',
        raw: v,
      })
    })

    boqs.forEach((b) => {
      list.push({
        id: b.id,
        type: 'boq',
        customerName: b.name,
        companyName: b.company_name,
        email: b.email,
        phone: b.phone,
        subject: `${b.project_name || ''} (${b.project_type || ''})`,
        details: b.additional_requirements || '',
        date: b.created_at,
        status: b.status || 'pending',
        raw: b,
      })
    })

    // Sort descending by date
    list.sort((a, b) => new Date(b.date) - new Date(a.date))
    return list
  }, [quotes, visits, boqs, isAr, t])

  // Filtered by tab and search
  const filteredRequests = useMemo(() => {
    return normalizedRequests.filter((item) => {
      if (activeTab !== 'all' && item.type !== activeTab) {
        return false
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase()
        const matchName = item.customerName?.toLowerCase().includes(query)
        const matchCompany = item.companyName?.toLowerCase().includes(query)
        const matchEmail = item.email?.toLowerCase().includes(query)
        const matchPhone = item.phone?.toLowerCase().includes(query)
        const matchSubject = item.subject?.toLowerCase().includes(query)
        return matchName || matchCompany || matchEmail || matchPhone || matchSubject
      }
      return true
    })
  }, [normalizedRequests, activeTab, searchTerm])

  const itemsPerPage = 6
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1
  const startIdx = (currentPage - 1) * itemsPerPage
  const displayedData = filteredRequests.slice(startIdx, startIdx + itemsPerPage)

  const getTypeBadge = (type) => {
    switch (type) {
      case 'visit':
        return 'bg-blue-600/10 text-blue-700 border border-blue-300'
      case 'quote':
        return 'bg-amber-600/10 text-amber-700 border border-amber-300'
      case 'boq':
        return 'bg-emerald-600/10 text-emerald-700 border border-emerald-300'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          bg: 'bg-amber-100',
          text: 'text-amber-900',
          border: 'border-amber-400',
          dot: 'bg-amber-500 animate-pulse',
        }
      case 'contacted':
        return {
          bg: 'bg-sky-100',
          text: 'text-sky-900',
          border: 'border-sky-400',
          dot: 'bg-sky-500',
        }
      case 'in_progress':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-900',
          border: 'border-purple-400',
          dot: 'bg-purple-600',
        }
      case 'completed':
        return {
          bg: 'bg-emerald-100',
          text: 'text-emerald-900',
          border: 'border-emerald-400',
          dot: 'bg-emerald-600',
        }
      case 'rejected':
        return {
          bg: 'bg-rose-100',
          text: 'text-rose-900',
          border: 'border-rose-400',
          dot: 'bg-rose-600',
        }
      case 'closed':
        return {
          bg: 'bg-slate-200',
          text: 'text-slate-800',
          border: 'border-slate-400',
          dot: 'bg-slate-500',
        }
      default:
        return {
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          border: 'border-slate-300',
          dot: 'bg-slate-400',
        }
    }
  }

  const getStatusVariant = (status) => {
    const cfg = getStatusConfig(status)
    return `${cfg.bg} ${cfg.text} ${cfg.border}`
  }

  const handleStatusChange = async (reqItem, newStatus) => {
    setSavingStatus(true)
    try {
      if (reqItem.type === 'quote') {
        await updateQuote(reqItem.id, { status: newStatus })
        setQuotes((prev) => prev.map((q) => (q.id === reqItem.id ? { ...q, status: newStatus } : q)))
      } else if (reqItem.type === 'visit') {
        await updateVisit(reqItem.id, { status: newStatus })
        setVisits((prev) => prev.map((v) => (v.id === reqItem.id ? { ...v, status: newStatus } : v)))
      } else if (reqItem.type === 'boq') {
        await updateBOQ(reqItem.id, { status: newStatus })
        setBoqs((prev) => prev.map((b) => (b.id === reqItem.id ? { ...b, status: newStatus } : b)))
      }

      setSelectedRequest((prev) => (prev ? { ...prev, status: newStatus, raw: { ...prev.raw, status: newStatus } } : null))
    } catch (error) {
      alert(t('quotes.status_error') + ': ' + error.message)
    } finally {
      setSavingStatus(false)
    }
  }

  const handleDelete = async (reqItem) => {
    const confirmMsg =
      reqItem.type === 'boq'
        ? t('boq.delete_confirm')
        : reqItem.type === 'visit'
        ? t('visits.delete_confirm')
        : t('quotes.delete_confirm')

    if (!window.confirm(confirmMsg)) return

    try {
      if (reqItem.type === 'quote') {
        await deleteQuote(reqItem.id)
        setQuotes((prev) => prev.filter((q) => q.id !== reqItem.id))
      } else if (reqItem.type === 'visit') {
        await deleteVisit(reqItem.id)
        setVisits((prev) => prev.filter((v) => v.id !== reqItem.id))
      } else if (reqItem.type === 'boq') {
        await deleteBOQ(reqItem.id)
        setBoqs((prev) => prev.filter((b) => b.id !== reqItem.id))
      }
      setSelectedRequest(null)
    } catch (error) {
      alert(t('quotes.delete_error') + ': ' + error.message)
    }
  }

  const handleFileOpen = (fileUrl) => {
    if (!fileUrl) return
    window.open(fileUrl, '_blank', 'noopener,noreferrer')
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setCurrentPage(1)
    const url = new URL(window.location.href)
    if (tabId === 'all') {
      url.searchParams.delete('tab')
    } else {
      url.searchParams.set('tab', tabId)
    }
    window.history.replaceState({}, '', url.toString())
  }

  return (
    <div className="max-w-full relative">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-tertiary font-bold tracking-widest text-xs uppercase mb-2 block">
            {t('allRequests.subtitle')}
          </span>
          <h2 className="text-3xl font-black font-headline tracking-tighter text-primary leading-none sm:text-4xl lg:text-5xl">
            {t('allRequests.title')}<span className="text-tertiary">.</span>
          </h2>
        </div>

        {/* Search bar */}
        <div className="w-full md:w-72">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              placeholder={isAr ? 'بحث في الطلبات...' : 'Search requests...'}
              className="w-full bg-surface-container-lowest border border-surface-variant px-4 py-2.5 pl-10 rtl:pl-4 rtl:pr-10 text-sm font-medium text-primary focus:outline-none focus:border-tertiary"
            />
            <span className="material-symbols-outlined absolute left-3 rtl:left-auto rtl:right-3 top-2.5 text-slate-400 text-lg">
              search
            </span>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 rtl:right-auto rtl:left-3 top-2.5 text-slate-400 hover:text-primary"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-variant mb-6 overflow-x-auto">
        {[
          { id: 'all', label: t('allRequests.tabs.all'), count: normalizedRequests.length },
          { id: 'visit', label: t('allRequests.tabs.visit'), count: visits.length },
          { id: 'quote', label: t('allRequests.tabs.quote'), count: quotes.length },
          { id: 'boq', label: t('allRequests.tabs.boq'), count: boqs.length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-6 py-3.5 font-headline font-bold text-xs uppercase tracking-widest transition-colors border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-tertiary text-tertiary bg-surface-container-low'
                : 'border-transparent text-secondary hover:text-primary hover:bg-surface-container-lowest'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 font-mono ${
              activeTab === tab.id ? 'bg-tertiary text-white' : 'bg-surface-variant text-secondary'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-surface-container-lowest border border-surface-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-surface-variant">
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-secondary">
                  {t('allRequests.table.type')}
                </th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-secondary">
                  {t('allRequests.table.customer')}
                </th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-secondary">
                  {t('allRequests.table.contact')}
                </th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-secondary">
                  {t('allRequests.table.subject')}
                </th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-secondary">
                  {t('allRequests.table.date')}
                </th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-secondary text-center">
                  {t('allRequests.table.status')}
                </th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-secondary text-right rtl:text-left">
                  {t('allRequests.table.action')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-secondary font-bold">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : displayedData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-secondary font-bold">
                    {t('allRequests.no_requests')}
                  </td>
                </tr>
              ) : (
                displayedData.map((req) => (
                  <tr key={`${req.type}-${req.id}`} className="hover:bg-surface-container-low transition-colors group">
                    {/* Type Badge */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${getTypeBadge(req.type)}`}>
                        {t(`allRequests.type.${req.type}`)}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-5">
                      <span className="block font-bold text-primary text-sm">{req.customerName}</span>
                      {req.companyName && (
                        <span className="block text-xs text-secondary font-medium">{req.companyName}</span>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-5">
                      <span className="block text-sm sm:text-base font-extrabold text-primary font-mono tracking-tight">{req.phone}</span>
                      <span className="text-xs text-slate-400 font-mono">{req.email}</span>
                    </td>

                    {/* Subject / Project */}
                    <td className="px-6 py-5 max-w-xs">
                      <span className="block font-bold text-primary text-xs uppercase tracking-tight truncate">
                        {req.subject}
                      </span>
                      {req.details && (
                        <p className="text-xs text-secondary line-clamp-1 italic">{req.details}</p>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-5 whitespace-nowrap text-xs text-secondary font-mono">
                      {req.date ? formatDate(req.date) : '—'}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-5 text-center whitespace-nowrap">
                      {(() => {
                        const sc = getStatusConfig(req.status)
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-black font-headline uppercase tracking-wider rounded-sm border ${sc.bg} ${sc.text} ${sc.border} shadow-xs`}>
                            <span className={`w-2 h-2 rounded-full shrink-0 ${sc.dot}`} />
                            <span>{t(`${req.type === 'boq' ? 'boq' : req.type === 'visit' ? 'visits' : 'quotes'}.status.${req.status}`) || req.status}</span>
                          </span>
                        )
                      })()}
                    </td>

                    {/* Action */}
                    <td className="px-6 py-5 text-right rtl:text-left whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedRequest(req)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-surface-container-low border border-surface-variant hover:border-tertiary text-primary hover:text-tertiary font-bold text-xs transition-colors uppercase tracking-wider"
                      >
                        <span>{t('quotes.table.review')}</span>
                        <span className="material-symbols-outlined text-base rtl:rotate-180">arrow_forward</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalDisplayed={displayedData.length}
          totalItems={filteredRequests.length}
          variant="table"
        />
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-surface-variant bg-surface-container-lowest shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-surface-variant bg-surface-container-low px-6 py-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getTypeBadge(selectedRequest.type)}`}>
                    {t(`allRequests.type.${selectedRequest.type}`)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    ID: {selectedRequest.id}
                  </span>
                </div>
                <h3 className="text-xl font-black font-headline tracking-tighter text-primary uppercase sm:text-2xl">
                  {selectedRequest.type === 'boq'
                    ? t('boq.modal.title')
                    : selectedRequest.type === 'visit'
                    ? t('visits.modal.title')
                    : t('quotes.modal.title')}
                  <span className="text-tertiary">.</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="text-secondary hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-6 px-6 py-6">
              {/* Customer & Status row */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-1">
                    {t('quotes.modal.customer_label')}
                  </label>
                  <p className="font-bold text-primary text-base">{selectedRequest.customerName}</p>
                  {selectedRequest.companyName && (
                    <p className="text-xs text-secondary font-semibold">{selectedRequest.companyName}</p>
                  )}
                  <p className="text-xs text-secondary font-mono mt-1">{selectedRequest.email}</p>
                  <p className="text-base sm:text-lg font-extrabold text-primary font-mono tracking-tight mt-1">{selectedRequest.phone}</p>
                  {selectedRequest.raw.whatsapp_number && (
                    <p className="text-sm font-bold text-emerald-600 font-mono mt-0.5">
                      WA: {selectedRequest.raw.whatsapp_number}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block">
                      {t('quotes.modal.status_label')}
                    </label>
                    {(() => {
                      const msc = getStatusConfig(selectedRequest.status)
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-black font-headline uppercase tracking-wider rounded-sm border ${msc.bg} ${msc.text} ${msc.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${msc.dot}`} />
                          <span>{t(`${selectedRequest.type === 'boq' ? 'boq' : selectedRequest.type === 'visit' ? 'visits' : 'quotes'}.status.${selectedRequest.status}`) || selectedRequest.status}</span>
                        </span>
                      )
                    })()}
                  </div>
                  {savingStatus && (
                    <span className="text-xs text-tertiary font-normal mb-1 block">
                      {t('quotes.modal.saving')}
                    </span>
                  )}
                  <select
                    value={selectedRequest.status}
                    onChange={(e) => handleStatusChange(selectedRequest, e.target.value)}
                    disabled={savingStatus}
                    className={`w-full bg-surface-container-low border-2 ${getStatusConfig(selectedRequest.status).border} px-3 py-2 text-sm font-black text-primary focus:outline-none focus:ring-1 focus:ring-tertiary uppercase disabled:opacity-50`}
                  >
                    <option value="pending" className="font-bold text-amber-900 bg-amber-50">
                      ● {t('quotes.status.pending')}
                    </option>
                    <option value="contacted" className="font-bold text-sky-900 bg-sky-50">
                      ● {t('quotes.status.contacted')}
                    </option>
                    {selectedRequest.type === 'boq' && (
                      <>
                        <option value="in_progress" className="font-bold text-indigo-900 bg-indigo-50">
                          ● {t('boq.status.in_progress')}
                        </option>
                        <option value="completed" className="font-bold text-emerald-900 bg-emerald-50">
                          ● {t('boq.status.completed')}
                        </option>
                        <option value="rejected" className="font-bold text-rose-900 bg-rose-50">
                          ● {t('boq.status.rejected')}
                        </option>
                      </>
                    )}
                    <option value="closed" className="font-bold text-slate-800 bg-slate-100">
                      ● {t('quotes.status.closed')}
                    </option>
                  </select>
                </div>
              </div>

              {/* Specific Content by Type */}
              {selectedRequest.type === 'boq' && (
                <>
                  <div className="p-4 bg-surface-container-low border-l-4 border-emerald-600 space-y-2">
                    <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block mb-1">
                      {t('boq.modal.project_label')}
                    </label>
                    <p className="text-base font-black text-primary uppercase tracking-tight">
                      {selectedRequest.raw.project_name}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs text-secondary">
                      <div>
                        <span className="font-bold text-primary">{t('boq.modal.type_label')}:</span> {selectedRequest.raw.project_type}
                      </div>
                      <div>
                        <span className="font-bold text-primary">{isAr ? 'الموقع' : 'Location'}:</span> {selectedRequest.raw.project_location}
                      </div>
                    </div>
                  </div>

                  {selectedRequest.raw.additional_requirements && (
                    <div>
                      <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">
                        {t('boq.modal.additional_label')}
                      </label>
                      <div className="bg-surface-container-low p-4 border border-surface-variant text-sm text-secondary leading-relaxed max-h-36 overflow-y-auto">
                        {selectedRequest.raw.additional_requirements}
                      </div>
                    </div>
                  )}

                  {/* BOQ File Link */}
                  {selectedRequest.raw.boq_file_url && (
                    <div className="flex items-center gap-4 p-3 border border-dashed border-emerald-300 bg-emerald-50/50">
                      <span className="material-symbols-outlined text-emerald-700">description</span>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-primary uppercase">{t('boq.modal.boq_file_label')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileOpen(selectedRequest.raw.boq_file_url)}
                        className="text-xs font-black text-emerald-700 hover:underline uppercase"
                      >
                        {t('boq.modal.boq_file_download')}
                      </button>
                    </div>
                  )}

                  {/* Supporting Documents */}
                  {selectedRequest.raw.supporting_docs_urls && (() => {
                    let docs = []
                    try {
                      docs = JSON.parse(selectedRequest.raw.supporting_docs_urls)
                    } catch {
                      docs = []
                    }
                    if (!docs || docs.length === 0) return null
                    return (
                      <div>
                        <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">
                          {t('boq.modal.supporting_docs_label')} ({docs.length})
                        </label>
                        <div className="space-y-2">
                          {docs.map((docUrl, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-surface-container-low border border-surface-variant text-xs">
                              <span className="font-mono text-secondary">Document #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => handleFileOpen(docUrl)}
                                className="text-tertiary hover:underline font-bold uppercase text-[11px]"
                              >
                                {t('boq.modal.boq_file_download')}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </>
              )}

              {selectedRequest.type === 'quote' && (
                <>
                  <div className="p-4 bg-surface-container-low border-l-4 border-tertiary">
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-1">
                      {t('quotes.modal.product_label')}
                    </label>
                    <p className="text-lg font-black text-primary uppercase tracking-tight">
                      {selectedRequest.raw.custom_product_name || selectedRequest.raw.product?.name_ar || selectedRequest.raw.product?.name_en || t('quotes.modal.product_default')}
                    </p>
                    {selectedRequest.raw.product_id && (
                      <p className="text-xs font-mono text-secondary italic">
                        {t('quotes.modal.product_ref')}: {selectedRequest.raw.product_id}
                      </p>
                    )}
                  </div>

                  {selectedRequest.details && (
                    <div>
                      <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">
                        {t('quotes.modal.specs_label')}
                      </label>
                      <div className="bg-surface-container-low p-4 border border-surface-variant text-sm text-secondary leading-relaxed max-h-36 overflow-y-auto">
                        {selectedRequest.details}
                      </div>
                    </div>
                  )}

                  {selectedRequest.raw.file_url && (
                    <div className="flex items-center gap-4 p-3 border border-dashed border-surface-variant">
                      <span className="material-symbols-outlined text-tertiary">description</span>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-primary uppercase">{t('quotes.modal.file_label')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileOpen(selectedRequest.raw.file_url)}
                        className="text-xs font-black text-tertiary hover:underline uppercase"
                      >
                        {t('quotes.modal.file_download')}
                      </button>
                    </div>
                  )}
                </>
              )}

              {selectedRequest.type === 'visit' && (
                <>
                  <div className="p-4 bg-surface-container-low border-l-4 border-blue-600 space-y-2">
                    <label className="text-[10px] font-bold text-blue-700 uppercase tracking-widest block mb-1">
                      {t('visits.modal.factory_label')}
                    </label>
                    <p className="text-base font-black text-primary uppercase tracking-tight">
                      {selectedRequest.raw.factory_name} — {selectedRequest.raw.factory_activity}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs text-secondary">
                      <div>
                        <span className="font-bold text-primary">{t('visits.modal.address')}:</span> {selectedRequest.raw.address}
                      </div>
                      <div>
                        <span className="font-bold text-primary">{t('visits.modal.preferred_date')}:</span> {selectedRequest.raw.preferred_date ? formatDate(selectedRequest.raw.preferred_date) : '—'}
                      </div>
                    </div>
                  </div>

                  {selectedRequest.details && (
                    <div>
                      <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">
                        {t('visits.modal.details_label')}
                      </label>
                      <div className="bg-surface-container-low p-4 border border-surface-variant text-sm text-secondary leading-relaxed max-h-36 overflow-y-auto">
                        {selectedRequest.details}
                      </div>
                    </div>
                  )}

                  {selectedRequest.raw.file_url && (
                    <div className="flex items-center gap-4 p-3 border border-dashed border-surface-variant">
                      <span className="material-symbols-outlined text-blue-700">description</span>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-primary uppercase">{t('visits.modal.file_label')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileOpen(selectedRequest.raw.file_url)}
                        className="text-xs font-black text-tertiary hover:underline uppercase"
                      >
                        {t('visits.modal.file_download')}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col gap-3 border-t border-surface-variant bg-surface-container-low px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => handleDelete(selectedRequest)}
                className="text-xs font-bold uppercase text-error hover:opacity-70 transition-opacity"
              >
                {t('quotes.modal.delete')}
              </button>
              <Button
                variant="secondary"
                onClick={() => setSelectedRequest(null)}
                className="w-full sm:w-auto"
              >
                {t('quotes.modal.close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
