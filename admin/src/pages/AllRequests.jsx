import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Badge, Button } from '../components'
import { Pagination } from '../components/ui/Pagination'
import { formatDate } from '../utils/helpers'
import { getAllQuotes, updateQuote, deleteQuote } from '../services/quoteService'
import { getAllVisits, updateVisit, deleteVisit } from '../services/visitService'
import { getAllBOQs, updateBOQ, deleteBOQ } from '../services/boqService'
import { retryRequestNotification } from '../services/notificationService'
import { downloadRequestAttachment } from '../services/attachmentService'
import { getRequestStatusCatalog, setRequestArchived } from '../services/requestWorkflowService'
import { getDecodedToken } from '../utils/auth'
import { hasPermission, PERMISSIONS } from '../utils/permissions'
import { getQuoteProductName } from '../utils/quoteProductName'

export default function AllRequests() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  const navigate = useNavigate()

  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromQuery = searchParams.get('tab')
  const activeTab = ['all', 'visit', 'quote', 'boq'].includes(tabFromQuery) ? tabFromQuery : 'all'
  const archivedOnly = searchParams.get('archived') === 'true'
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [requestLoadError, setRequestLoadError] = useState(null)

  const [quotes, setQuotes] = useState([])
  const [visits, setVisits] = useState([])
  const [boqs, setBoqs] = useState([])

  const [selectedRequest, setSelectedRequest] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [savingStatus, setSavingStatus] = useState(false)
  const [retryingNotification, setRetryingNotification] = useState(false)
  const [notificationFeedback, setNotificationFeedback] = useState(null)
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState(null)
  const [attachmentFeedback, setAttachmentFeedback] = useState(null)
  const [statusCatalog, setStatusCatalog] = useState(null)
  const [statusCatalogError, setStatusCatalogError] = useState(null)
  const [changingArchive, setChangingArchive] = useState(false)
  const requestFetchVersion = useRef(0)
  const canRetryNotifications = hasPermission(
    getDecodedToken()?.role,
    PERMISSIONS.NOTIFICATION_RETRY
  )
  const canDeleteRequests = hasPermission(
    getDecodedToken()?.role,
    PERMISSIONS.REQUESTS_DELETE
  )

  const fetchAll = useCallback(async () => {
    const fetchVersion = ++requestFetchVersion.current
    setLoading(true)
    setRequestLoadError(null)
    setQuotes([])
    setVisits([])
    setBoqs([])
    try {
      const [quotesRes, visitsRes, boqsRes] = await Promise.allSettled([
        getAllQuotes({ archived: archivedOnly }),
        getAllVisits({ archived: archivedOnly }),
        getAllBOQs({ archived: archivedOnly }),
      ])

      if (fetchVersion !== requestFetchVersion.current) return

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
      const failures = [quotesRes, visitsRes, boqsRes].filter((result) => result.status === 'rejected')
      if (failures.length > 0) {
        failures.forEach((result) => console.error('Failed to fetch request list:', result.reason))
        setRequestLoadError(failures[0].reason?.message || 'Unable to load some request lists.')
      }
    } catch (error) {
      if (fetchVersion !== requestFetchVersion.current) return
      console.error('Failed to fetch requests:', error)
      setRequestLoadError(error.message || 'Unable to load requests.')
    } finally {
      if (fetchVersion === requestFetchVersion.current) setLoading(false)
    }
  }, [archivedOnly])

  useEffect(() => {
    fetchAll()
    return () => {
      requestFetchVersion.current += 1
    }
  }, [fetchAll])

  useEffect(() => {
    let cancelled = false
    getRequestStatusCatalog()
      .then((catalog) => {
        if (!Array.isArray(catalog?.statuses)) {
          throw new Error('Request status catalog is invalid')
        }
        if (!cancelled) setStatusCatalog(catalog)
      })
      .catch((error) => {
        console.error('Failed to load request status catalog:', error)
        if (!cancelled) setStatusCatalogError(error.message)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setNotificationFeedback(null)
    setAttachmentFeedback(null)
  }, [selectedRequest?.id])

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
        subject: getQuoteProductName(q, {
          isArabic: isAr,
          generalInquiry: t('quotes.table.general_inquiry'),
        }),
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
      const typeKey = b.project_type?.toLowerCase()
      const localizedType = typeKey
        ? t(`boq.project_types.${typeKey}`, { defaultValue: b.project_type })
        : ''
      list.push({
        id: b.id,
        type: 'boq',
        customerName: b.name,
        companyName: b.company_name,
        email: b.email,
        phone: b.phone,
        subject: localizedType ? `${b.project_name || ''} (${localizedType})` : (b.project_name || ''),
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

  const getRequestNamespace = (type) =>
    type === 'boq' ? 'boq' : type === 'visit' ? 'visits' : 'quotes'

  const getStatusLabel = (type, status) => {
    const definition = statusCatalog?.statuses?.find((item) => item.value === status)
    return t(`${getRequestNamespace(type)}.status.${status}`, {
      defaultValue: definition?.label || status,
    })
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
      alert(t(`${reqItem.type === 'visit' ? 'visits' : reqItem.type === 'boq' ? 'boq' : 'quotes'}.status_error`) + ': ' + error.message)
    } finally {
      setSavingStatus(false)
    }
  }

  const handleArchiveChange = async (reqItem) => {
    if (changingArchive) return
    const restore = Boolean(reqItem.raw.archived_at)
    setChangingArchive(true)
    try {
      await setRequestArchived(reqItem.type, reqItem.id, !restore)
      const removeRequest = (items) => items.filter((item) => item.id !== reqItem.id)
      if (reqItem.type === 'quote') setQuotes(removeRequest)
      if (reqItem.type === 'visit') setVisits(removeRequest)
      if (reqItem.type === 'boq') setBoqs(removeRequest)
      setCurrentPage(1)
      setSelectedRequest(null)
    } catch (error) {
      const action = restore
        ? t('allRequests.archive.restoreError', { defaultValue: isAr ? 'تعذر استعادة الطلب.' : 'Unable to restore the request.' })
        : t('allRequests.archive.archiveError', { defaultValue: isAr ? 'تعذر أرشفة الطلب.' : 'Unable to archive the request.' })
      alert(`${action} ${error.message}`)
    } finally {
      setChangingArchive(false)
    }
  }

  const handleDelete = async (reqItem) => {
    if (!canDeleteRequests) return

    const requestTypeLabel = t(
      reqItem.type === 'boq'
        ? 'boq.modal.project_label'
        : reqItem.type === 'visit'
          ? 'visits.modal.factory_label'
          : 'quotes.modal.product_label',
      { defaultValue: reqItem.type.toUpperCase() }
    )
    const confirmation = window.prompt(t('allRequests.deletePermanentConfirm', {
      defaultValue: isAr
        ? `سيتم حذف طلب ${requestTypeLabel} نهائيًا. اكتب DELETE للتأكيد.`
        : `This ${requestTypeLabel} request will be permanently deleted. Type DELETE to confirm.`,
    }))
    if (confirmation !== 'DELETE') return

    try {
      let result
      if (reqItem.type === 'quote') {
        result = await deleteQuote(reqItem.id, confirmation)
        setQuotes((prev) => prev.filter((q) => q.id !== reqItem.id))
      } else if (reqItem.type === 'visit') {
        result = await deleteVisit(reqItem.id, confirmation)
        setVisits((prev) => prev.filter((v) => v.id !== reqItem.id))
      } else if (reqItem.type === 'boq') {
        result = await deleteBOQ(reqItem.id, confirmation)
        setBoqs((prev) => prev.filter((b) => b.id !== reqItem.id))
      }
      setSelectedRequest(null)
      if (result?.data?.cleanup_operations?.some((operation) => operation.status !== 'COMPLETED')) {
        navigate('/attachment-cleanup')
      }
    } catch (error) {
      alert(t(`${reqItem.type === 'visit' ? 'visits' : reqItem.type === 'boq' ? 'boq' : 'quotes'}.delete_error`) + ': ' + error.message)
    }
  }

  const handleAttachmentDownload = async (attachment) => {
    setDownloadingAttachmentId(attachment.id)
    setAttachmentFeedback(null)
    try {
      await downloadRequestAttachment(attachment)
    } catch (error) {
      console.error('Failed to download request attachment:', error)
      setAttachmentFeedback(
        t('allRequests.attachments.downloadFailed', {
          defaultValue: isAr ? 'تعذر تنزيل الملف. حاول مرة أخرى.' : 'Unable to download this file. Please try again.',
        })
      )
    } finally {
      setDownloadingAttachmentId(null)
    }
  }

  const updateNotificationData = (reqItem, data) => {
    const apply = (request) => ({
      ...request,
      notification_status: data.status,
      notification_attempts: data.attempts,
      notification_last_attempt_at: data.lastAttemptAt,
      notification_sent_at: data.sentAt,
      notification_error_code: data.errorCode || null,
      notification_error_message: data.errorMessage || null,
      notification_lease_expires_at: data.leaseExpiresAt || null,
    })
    const updateList = (items) =>
      items.map((item) => item.id === reqItem.id ? apply(item) : item)

    if (reqItem.type === 'quote') setQuotes(updateList)
    if (reqItem.type === 'visit') setVisits(updateList)
    if (reqItem.type === 'boq') setBoqs(updateList)
    setSelectedRequest((selected) => selected
      ? { ...selected, raw: apply(selected.raw) }
      : selected
    )
  }

  const handleNotificationRetry = async () => {
    const request = selectedRequest
    if (!request || retryingNotification) return
    const notificationStatus = request.raw.notification_status || 'pending'
    const confirmUnknownDelivery = notificationStatus === 'unknown'
    if (confirmUnknownDelivery && !window.confirm(t('allRequests.notification.confirm_unknown'))) {
      return
    }

    setRetryingNotification(true)
    setNotificationFeedback(null)
    try {
      const result = await retryRequestNotification(request.type, request.id, {
        ...(confirmUnknownDelivery ? { confirmUnknownDelivery: true } : {}),
      })
      updateNotificationData(request, result.data)
      setNotificationFeedback({
        type: 'success',
        message: t('allRequests.notification.retry_success'),
      })
    } catch (error) {
      if (error.data) updateNotificationData(request, error.data)
      setNotificationFeedback({
        type: 'error',
        message: error.code === 'NOTIFICATION_RETRY_IN_PROGRESS'
          ? t('allRequests.notification.retry_conflict')
          : error.code === 'UNKNOWN_DELIVERY_CONFIRMATION_REQUIRED'
            ? t('allRequests.notification.confirm_unknown')
            : error.message || t('allRequests.notification.retry_failure'),
      })
    } finally {
      setRetryingNotification(false)
    }
  }

  const notificationRetryAvailable = (request) => {
    if (!canRetryNotifications) return false
    const status = request.raw.notification_status || 'pending'
    const leaseExpiresAt = request.raw.notification_lease_expires_at
    const leaseExpired = !leaseExpiresAt || new Date(leaseExpiresAt).getTime() <= Date.now()
    return leaseExpired && ['pending', 'failed', 'unknown', 'sending'].includes(status)
  }

  const handleTabChange = (tabId) => {
    setCurrentPage(1)
    if (tabId === 'all') {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('tab')
      setSearchParams(nextParams, { replace: true })
    } else {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('tab', tabId)
      setSearchParams(nextParams, { replace: true })
    }

  }

  const handleArchivedFilterChange = (archived) => {
    setCurrentPage(1)
    const nextParams = new URLSearchParams(searchParams)
    if (archived) {
      nextParams.set('archived', 'true')
    } else {
      nextParams.delete('archived')
    }
    setSearchParams(nextParams, { replace: true })
  }

  return (
    <div className="max-w-full relative">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-tertiary font-bold tracking-widest text-xs uppercase mb-2 block">
            {t('allRequests.subtitle')}
          </span>
          <h2 className="text-3xl font-black font-headline tracking-tighter text-on-surface leading-none sm:text-4xl lg:text-5xl">
            {t('allRequests.title')}<span className="text-on-surface">.</span>
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
              className="w-full bg-surface-container-lowest border border-surface-variant px-4 py-2.5 pl-10 rtl:pl-4 rtl:pr-10 text-sm font-medium text-on-surface focus:outline-none focus:border-tertiary"
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

      {statusCatalogError && (
        <p role="alert" className="mb-4 border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
          {t('allRequests.statusCatalogError', {
            defaultValue: isAr ? 'تعذر تحميل حالات الطلبات؛ تم تعطيل تغيير الحالة.' : 'Unable to load request statuses; status changes are disabled.',
          })}
        </p>
      )}
      {requestLoadError && (
        <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
          <span>{requestLoadError}</span>
          <button type="button" onClick={fetchAll} className="font-bold underline">
            {t('common.retry', { defaultValue: isAr ? 'إعادة المحاولة' : 'Retry' })}
          </button>
        </div>
      )}

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

      <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label={t('allRequests.archive.filterLabel', {
        defaultValue: isAr ? 'تصفية الأرشيف' : 'Archive filter',
      })}>
        <button
          type="button"
          onClick={() => handleArchivedFilterChange(false)}
          aria-pressed={!archivedOnly}
          className={`border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
            !archivedOnly
              ? 'border-tertiary bg-tertiary text-white'
              : 'border-surface-variant bg-white text-secondary hover:border-tertiary'
          }`}
        >
          {t('allRequests.archive.active', { defaultValue: isAr ? 'الطلبات النشطة' : 'Active requests' })}
        </button>
        <button
          type="button"
          onClick={() => handleArchivedFilterChange(true)}
          aria-pressed={archivedOnly}
          className={`border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
            archivedOnly
              ? 'border-tertiary bg-tertiary text-white'
              : 'border-surface-variant bg-white text-secondary hover:border-tertiary'
          }`}
        >
          {t('allRequests.archive.archived', { defaultValue: isAr ? 'الطلبات المؤرشفة' : 'Archived requests' })}
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-surface-container-lowest border border-surface-variant overflow-hidden">
        <div className="requests-table-wrap overflow-x-auto [container-type:inline-size] [container-name:requests-table]">
          <table className="requests-table w-full text-left rtl:text-right border-collapse">
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
                    <td data-label={t('allRequests.table.type')} className="px-6 py-5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${getTypeBadge(req.type)}`}>
                        {t(`allRequests.type.${req.type}`)}
                      </span>
                      {req.raw.archived_at && (
                        <span className="mt-1 block text-[9px] font-bold uppercase tracking-wider text-secondary">
                          {t('allRequests.archive.archivedBadge', { defaultValue: isAr ? 'مؤرشف' : 'Archived' })}
                        </span>
                      )}
                    </td>

                    {/* Customer */}
                    <td data-label={t('allRequests.table.customer')} className="px-6 py-5">
                      <span className="block font-bold text-on-surface text-sm">{req.customerName}</span>
                      {req.companyName && (
                        <span className="block text-xs text-secondary font-medium">{req.companyName}</span>
                      )}
                    </td>

                    {/* Contact */}
                    <td data-label={t('allRequests.table.contact')} className="px-6 py-5">
                      <span className="block text-sm sm:text-base font-extrabold text-on-surface font-mono tracking-tight">{req.phone}</span>
                      <span className="text-xs text-slate-400 font-mono">{req.email}</span>
                    </td>

                    {/* Subject / Project */}
                    <td data-label={t('allRequests.table.subject')} className="px-6 py-5 max-w-xs">
                      <span className="block font-bold text-on-surface text-xs uppercase tracking-tight truncate">
                        {req.subject}
                      </span>
                      {req.details && (
                        <p className="text-xs text-secondary line-clamp-1 italic">{req.details}</p>
                      )}
                    </td>

                    {/* Date */}
                    <td data-label={t('allRequests.table.date')} className="px-6 py-5 whitespace-nowrap text-xs text-secondary font-mono">
                      {req.date ? formatDate(req.date, isAr ? 'ar' : 'en-US') : '—'}
                    </td>

                    {/* Status */}
                    <td data-label={t('allRequests.table.status')} className="px-6 py-5 text-center whitespace-nowrap">
                      {(() => {
                        const sc = getStatusConfig(req.status)
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-black font-headline uppercase tracking-wider rounded-sm border ${sc.bg} ${sc.text} ${sc.border} shadow-xs`}>
                            <span className={`w-2 h-2 rounded-full shrink-0 ${sc.dot}`} />
                            <span>{getStatusLabel(req.type, req.status)}</span>
                          </span>
                        )
                      })()}
                    </td>

                    {/* Action */}
                    <td data-label={t('allRequests.table.action')} className="px-6 py-5 text-right rtl:text-left whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedRequest(req)}
                        className="row-actions inline-flex items-center gap-1.5 px-3.5 py-2 bg-surface-container-low border border-surface-variant hover:border-tertiary text-primary hover:text-tertiary font-bold text-xs transition-colors uppercase tracking-wider"
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
                  {selectedRequest.raw.archived_at && (
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-slate-300 bg-slate-100 text-slate-700">
                      {t('allRequests.archive.archivedBadge', { defaultValue: isAr ? 'مؤرشف' : 'Archived' })}
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    ID: {selectedRequest.id}
                  </span>
                </div>
                <h3 className="text-xl font-black font-headline tracking-tighter text-on-surface uppercase sm:text-2xl">
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
                    {t(`${selectedRequest.type === 'boq' ? 'boq' : selectedRequest.type === 'visit' ? 'visits' : 'quotes'}.modal.customer_label`)}
                  </label>
                  <p className="font-bold text-on-surface text-base">{selectedRequest.customerName}</p>
                  {selectedRequest.companyName && (
                    <p className="text-xs text-secondary font-semibold">{selectedRequest.companyName}</p>
                  )}
                  <p className="text-xs text-secondary font-mono mt-1">{selectedRequest.email}</p>
                  <p className="text-base sm:text-lg font-extrabold text-on-surface font-mono tracking-tight mt-1">{selectedRequest.phone}</p>
                  {selectedRequest.raw.whatsapp_number && (
                    <p className="text-sm font-bold text-emerald-600 font-mono mt-0.5">
                      WA: {selectedRequest.raw.whatsapp_number}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block">
                      {t(`${selectedRequest.type === 'boq' ? 'boq' : selectedRequest.type === 'visit' ? 'visits' : 'quotes'}.modal.status_label`)}
                    </label>
                    {(() => {
                      const msc = getStatusConfig(selectedRequest.status)
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-black font-headline uppercase tracking-wider rounded-sm border ${msc.bg} ${msc.text} ${msc.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${msc.dot}`} />
                          <span>{getStatusLabel(selectedRequest.type, selectedRequest.status)}</span>
                        </span>
                      )
                    })()}
                  </div>
                  {savingStatus && (
                    <span className="text-xs text-tertiary font-normal mb-1 block">
                      {t(`${selectedRequest.type === 'boq' ? 'boq' : selectedRequest.type === 'visit' ? 'visits' : 'quotes'}.modal.saving`)}
                    </span>
                  )}
                  <select
                    value={selectedRequest.status}
                    onChange={(e) => handleStatusChange(selectedRequest, e.target.value)}
                    disabled={savingStatus || !statusCatalog?.statuses?.length}
                    className={`w-full bg-surface-container-low border-2 ${getStatusConfig(selectedRequest.status).border} px-3 py-2 text-sm font-black text-on-surface focus:outline-none focus:ring-1 focus:ring-tertiary uppercase disabled:opacity-50`}
                  >
                    {(statusCatalog?.statuses || [{ value: selectedRequest.status }]).map((status) => (
                      <option key={status.value} value={status.value}>
                        {getStatusLabel(selectedRequest.type, status.value)}
                      </option>
                    ))}
                  </select>
                  {statusCatalog?.statuses?.find((status) => status.value === selectedRequest.status)?.description && (
                    <p className="mt-1 text-[11px] leading-relaxed text-secondary">
                      {t(`allRequests.status_description.${selectedRequest.status}`, {
                        defaultValue: statusCatalog.statuses.find((status) => status.value === selectedRequest.status).description,
                      })}
                    </p>
                  )}
                  {selectedRequest.type === 'quote' && selectedRequest.status === 'completed' && statusCatalog?.request_specific_notes?.quote_completed && (
                    <p className="mt-1 border-s-2 border-tertiary ps-2 text-[11px] leading-relaxed text-secondary">
                      {t('allRequests.quote_completed_note', {
                        defaultValue: statusCatalog.request_specific_notes.quote_completed,
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* Specific Content by Type */}
              {canRetryNotifications && (
                <section className="border border-surface-variant bg-surface-container-low p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface">
                        {t('allRequests.notification.title')}
                      </h4>
                      <p className="mt-1 text-sm font-bold text-secondary">
                        {t(`allRequests.notification.status.${selectedRequest.raw.notification_status || 'pending'}`)}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-secondary">
                      {t('allRequests.notification.attempts', {
                        count: selectedRequest.raw.notification_attempts || 0,
                      })}
                    </span>
                  </div>
                  {selectedRequest.raw.notification_last_attempt_at && (
                    <p className="text-xs text-secondary">
                      {t('allRequests.notification.last_attempt')}:{' '}
                      {formatDate(selectedRequest.raw.notification_last_attempt_at, isAr ? 'ar' : 'en-US')}
                    </p>
                  )}
                  {selectedRequest.raw.notification_error_message && (
                    <p className="text-xs text-error">
                      {selectedRequest.raw.notification_error_message}
                      {selectedRequest.raw.notification_error_code
                        ? ` (${selectedRequest.raw.notification_error_code})`
                        : ''}
                    </p>
                  )}
                  {notificationRetryAvailable(selectedRequest) && (
                    <Button
                      variant="secondary"
                      onClick={handleNotificationRetry}
                      disabled={retryingNotification}
                    >
                      {retryingNotification
                        ? t('allRequests.notification.retrying')
                        : t('allRequests.notification.retry')}
                    </Button>
                  )}
                  {notificationFeedback && (
                    <p
                      role="status"
                      className={`text-xs font-bold ${
                        notificationFeedback.type === 'success' ? 'text-emerald-700' : 'text-error'
                      }`}
                    >
                      {notificationFeedback.message}
                    </p>
                  )}
                </section>
              )}

              {Array.isArray(selectedRequest.raw.attachments) && selectedRequest.raw.attachments.length > 0 && (
                <section className="border border-surface-variant bg-surface-container-low p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface">
                    {t('allRequests.attachments.title', { defaultValue: isAr ? 'المرفقات' : 'Attachments' })}
                  </h4>
                  {selectedRequest.raw.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between gap-3 border border-surface-variant bg-white p-2.5"
                    >
                      <span className="min-w-0 truncate text-xs text-secondary">
                        {attachment.original_filename || t('allRequests.attachments.file', { defaultValue: isAr ? 'ملف مرفق' : 'Attachment' })}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAttachmentDownload(attachment)}
                        disabled={downloadingAttachmentId !== null}
                        className="shrink-0 text-xs font-bold uppercase text-tertiary hover:underline disabled:opacity-50"
                      >
                        {downloadingAttachmentId === attachment.id
                          ? t('allRequests.attachments.downloading', { defaultValue: isAr ? 'جارٍ التنزيل' : 'Downloading' })
                          : t('allRequests.attachments.download', { defaultValue: isAr ? 'تنزيل' : 'Download' })}
                      </button>
                    </div>
                  ))}
                  {attachmentFeedback && (
                    <p role="alert" className="text-xs font-bold text-error">{attachmentFeedback}</p>
                  )}
                </section>
              )}

              {selectedRequest.type === 'boq' && (
                <>
                  <div className="p-4 bg-surface-container-low border-s-4 border-emerald-600 space-y-2">
                    <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block mb-1">
                      {t('boq.modal.project_label')}
                    </label>
                    <p className="text-base font-black text-on-surface uppercase tracking-tight">
                      {selectedRequest.raw.project_name}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs text-secondary">
                      <div>
                        <span className="font-bold text-on-surface">{t('boq.modal.type_label')}:</span>{' '}
                        {selectedRequest.raw.project_type
                          ? t(`boq.project_types.${selectedRequest.raw.project_type.toLowerCase()}`, {
                              defaultValue: selectedRequest.raw.project_type,
                            })
                          : '—'}
                      </div>
                      <div>
                        <span className="font-bold text-on-surface">{t('boq.modal.location_label') || (isAr ? 'الموقع' : 'Location')}:</span>{' '}
                        {selectedRequest.raw.project_location || '—'}
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

                </>
              )}

              {selectedRequest.type === 'quote' && (
                <>
                  <div className="p-4 bg-surface-container-low border-s-4 border-tertiary">
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-1">
                      {t('quotes.modal.product_label')}
                    </label>
                    <p className="text-lg font-black text-on-surface uppercase tracking-tight">
                      {getQuoteProductName(selectedRequest.raw, {
                        isArabic: isAr,
                        generalInquiry: t('quotes.modal.product_default'),
                      })}
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

                </>
              )}

              {selectedRequest.type === 'visit' && (
                <>
                  <div className="p-4 bg-surface-container-low border-s-4 border-blue-600 space-y-2">
                    <label className="text-[10px] font-bold text-blue-700 uppercase tracking-widest block mb-1">
                      {t('visits.modal.factory_label')}
                    </label>
                    <p className="text-base font-black text-on-surface uppercase tracking-tight">
                      {[selectedRequest.raw.factory_name, selectedRequest.raw.factory_activity].filter(Boolean).join(' — ') || '—'}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs text-secondary">
                      <div>
                        <span className="font-bold text-on-surface">
                          {t('visits.modal.address', { defaultValue: t('visits.modal.address_label', { defaultValue: isAr ? 'العنوان' : 'Address' }) })}:
                        </span>{' '}
                        {selectedRequest.raw.address || '—'}
                      </div>
                      <div>
                        <span className="font-bold text-on-surface">
                          {t('visits.modal.preferred_date', { defaultValue: t('visits.modal.date_label', { defaultValue: isAr ? 'التاريخ المفضل' : 'Preferred Date' }) })}:
                        </span>{' '}
                        {selectedRequest.raw.preferred_date ? formatDate(selectedRequest.raw.preferred_date, isAr ? 'ar' : 'en-US') : '—'}
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

                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col gap-3 border-t border-surface-variant bg-surface-container-low px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleArchiveChange(selectedRequest)}
                  disabled={changingArchive}
                >
                  {changingArchive
                    ? t('allRequests.archive.saving', { defaultValue: isAr ? 'جارٍ الحفظ' : 'Saving' })
                    : selectedRequest.raw.archived_at
                      ? t('allRequests.archive.restore', { defaultValue: isAr ? 'استعادة' : 'Restore' })
                      : t('allRequests.archive.archive', { defaultValue: isAr ? 'أرشفة' : 'Archive' })}
                </Button>
                {canDeleteRequests && (
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedRequest)}
                    className="text-xs font-bold uppercase text-error hover:opacity-70 transition-opacity"
                  >
                    {t(`${selectedRequest.type === 'boq' ? 'boq' : selectedRequest.type === 'visit' ? 'visits' : 'quotes'}.modal.delete`)}
                  </button>
                )}
              </div>
              <Button
                variant="secondary"
                onClick={() => setSelectedRequest(null)}
                className="w-full sm:w-auto"
              >
                {t(`${selectedRequest.type === 'boq' ? 'boq' : selectedRequest.type === 'visit' ? 'visits' : 'quotes'}.modal.close`)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
