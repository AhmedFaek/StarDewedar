import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { getApiErrorMessage } from '../../utils/apiErrorHandler.js'
import { useNotification } from '../../hooks/useNotification.js'

/* ── Status Badge ─────────────────────────────────────────────────────────── */

const STATUS_COLORS = {
  pending:     { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  contacted:   { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200' },
  in_progress: { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200' },
  completed:   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  rejected:    { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200' },
  closed:      { bg: 'bg-slate-100',  text: 'text-slate-700',   border: 'border-slate-300' },
}

function StatusBadge({ status, t }) {
  const key = status?.toLowerCase() ?? 'pending'
  const c = STATUS_COLORS[key] ?? STATUS_COLORS.pending
  const label = t ? t(`myRequests.statuses.${key}`, { defaultValue: status }) : status
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-xs ${c.bg} ${c.text} ${c.border}`}>
      {label}
    </span>
  )
}

/* ── Single Quote Card ───────────────────────────────────────────────────── */

function QuoteCard({ quote, lang, t }) {
  const liveProductName = quote.product?.[`name_${lang}`]?.trim()
  const snapshotName = (lang === 'ar'
    ? quote.product_name_ar_snapshot
    : quote.product_name_en_snapshot)?.trim()
  const productName = liveProductName
    || snapshotName
    || quote.custom_product_name?.trim()
    || t('myRequests.customProduct')

  const date = new Date(quote.created_at).toLocaleDateString(
    lang === 'ar' ? 'ar-EG' : 'en-GB',
    { year: 'numeric', month: 'short', day: 'numeric' }
  )

  return (
    <div className="border border-slate-100 bg-white hover:border-primary hover:shadow-xs transition-all duration-200 p-3">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 flex-1">
          {productName}
        </p>
        <StatusBadge status={quote.status} t={t} />
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
          <span className="material-symbols-outlined text-[13px] leading-none text-slate-400">calendar_today</span>
          {date}
        </span>
        {quote.phone && (
          <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium font-mono">
            <span className="material-symbols-outlined text-[13px] leading-none text-slate-400">phone</span>
            {quote.phone}
          </span>
        )}
      </div>
      {quote.details && (
        <p className="mt-1.5 text-[11px] text-slate-600 leading-relaxed line-clamp-2">{quote.details}</p>
      )}
    </div>
  )
}

/* ── Single Visit Card ───────────────────────────────────────────────────── */

function VisitCard({ visit, lang, t }) {
  const date = new Date(visit.created_at).toLocaleDateString(
    lang === 'ar' ? 'ar-EG' : 'en-GB',
    { year: 'numeric', month: 'short', day: 'numeric' }
  )
  const preferred = new Date(visit.preferred_date).toLocaleDateString(
    lang === 'ar' ? 'ar-EG' : 'en-GB',
    { year: 'numeric', month: 'short', day: 'numeric' }
  )

  return (
    <div className="border border-slate-100 bg-white hover:border-slate-900 hover:shadow-xs transition-all duration-200 p-3">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-xs font-bold text-slate-900 leading-snug flex-1">
          {visit.factory_name}
        </p>
        <StatusBadge status={visit.status} t={t} />
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-1">
        <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
          <span className="material-symbols-outlined text-[13px] leading-none text-slate-400">calendar_today</span>
          {t('myRequests.submitted')}: {date}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-primary font-bold">
          <span className="material-symbols-outlined text-[13px] leading-none">event</span>
          {t('myRequests.preferredDate')}: {preferred}
        </span>
      </div>
      <p className="text-[11px] text-slate-500 font-medium">
        {visit.factory_activity}{visit.address ? ` · ${visit.address}` : ''}
      </p>
    </div>
  )
}

/* ── Single BOQ Card ─────────────────────────────────────────────────────── */

function BOQCard({ boq, lang, t }) {
  const date = new Date(boq.created_at).toLocaleDateString(
    lang === 'ar' ? 'ar-EG' : 'en-GB',
    { year: 'numeric', month: 'short', day: 'numeric' }
  )

  let supportingDocs = []
  if (boq.supporting_docs_urls) {
    try {
      supportingDocs = JSON.parse(boq.supporting_docs_urls)
    } catch {
      supportingDocs = []
    }
  }

  return (
    <div className="border border-slate-100 bg-white hover:border-emerald-400 hover:shadow-xs transition-all duration-200 p-3">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-900 leading-snug truncate">
            {boq.project_name}
          </p>
          {boq.company_name && (
            <span className="block text-[10px] text-slate-400 font-medium truncate mt-0.5">{boq.company_name}</span>
          )}
        </div>
        <StatusBadge status={boq.status} t={t} />
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
        <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
          <span className="material-symbols-outlined text-[13px] leading-none text-slate-400">calendar_today</span>
          {t('myRequests.submitted')}: {date}
        </span>
        {boq.phone && (
          <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium font-mono">
            <span className="material-symbols-outlined text-[13px] leading-none text-slate-400">phone</span>
            {boq.phone}
          </span>
        )}
      </div>

      <div className="bg-slate-50 p-2 border border-slate-100 text-[11px] text-slate-600 mb-2 grid grid-cols-2 gap-2">
        <div>
          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            {t('myRequests.projectType')}:
          </span>
          <span className="font-bold text-slate-800 text-[11px] capitalize leading-snug block">
            {t(`requestBOQ.projectTypes.${boq.project_type}`) || boq.project_type}
          </span>
        </div>
        <div>
          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            {t('myRequests.location')}:
          </span>
          <span className="font-bold text-slate-800 text-[11px] leading-snug block">
            {boq.project_location}
          </span>
        </div>
      </div>

      {boq.additional_requirements && (
        <p className="mb-2 text-[11px] text-slate-500 leading-relaxed line-clamp-2 italic">
          {boq.additional_requirements}
        </p>
      )}

      {/* Attachments */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-100">
        {boq.boq_file_url ? (
          <a
            href={boq.boq_file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[13px] leading-none">download</span>
            {t('myRequests.viewFile')}
          </a>
        ) : <span />}
        {supportingDocs.length > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium">
            <span className="material-symbols-outlined text-[12px] leading-none text-slate-400">attach_file</span>
            {supportingDocs.length} {t('myRequests.supportingDocs')}
          </span>
        )}
      </div>
    </div>
  )
}

/* ── Empty State ─────────────────────────────────────────────────────────── */

function EmptyState({ icon, text, desc, ctaLabel, onCta }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
      <span className="material-symbols-outlined text-4xl text-slate-200 mb-3" style={{ fontVariationSettings: "'FILL' 0" }}>
        {icon}
      </span>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{text}</p>
      <p className="text-[11px] text-slate-400 leading-relaxed mb-3.5 max-w-[220px]">{desc}</p>
      <button
        onClick={onCta}
        className="font-headline font-bold uppercase text-xs tracking-wider px-4 py-2 bg-primary text-white hover:bg-primary-dark transition-colors shadow-xs"
      >
        {ctaLabel}
      </button>
    </div>
  )
}

/* ── Main Panel ──────────────────────────────────────────────────────────── */

export default function MyRequestsPanel({ isOpen, onClose, user, recoveryRequestType }) {
  const { t, i18n } = useTranslation()
  const { showError } = useNotification()
  const lang = i18n.language
  const isRTL = lang === 'ar'
  const panelRef = useRef(null)

  const [activeTab, setActiveTab] = useState('quotes')
  const [quotes, setQuotes]       = useState([])
  const [visits, setVisits]       = useState([])
  const [boqs, setBoqs]           = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [fetched, setFetched]     = useState(false)
  // Only animate during open/close — not during language switches while closed
  const [shouldTransition, setShouldTransition] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShouldTransition(true)
    } else {
      // Keep transition active long enough for the close animation, then disable
      const t = setTimeout(() => setShouldTransition(false), 320)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  const loadRequests = useCallback(async () => {
    setFetched(true)
    setLoading(true)
    setError(null)
    try {
      const [q, v, b] = await Promise.all([
        api.getMyQuotes(),
        api.getMyVisits(),
        api.getMyBOQs(),
      ])
      setQuotes(Array.isArray(q) ? q : [])
      setVisits(Array.isArray(v) ? v : [])
      setBoqs(Array.isArray(b) ? b : [])
      setFetched(true)
    } catch (err) {
      setError(t('myRequests.error'))
      showError(getApiErrorMessage(err, { t }))
    } finally {
      setLoading(false)
    }
  }, [showError, t])

  // Fetch on first open or when the user explicitly refreshes.
  useEffect(() => {
    if (isOpen && !fetched && !loading) loadRequests()
  }, [isOpen, fetched, loading, loadRequests])

  useEffect(() => {
    if (!isOpen) return
    const requestedTab = {
      quote: 'quotes',
      visit: 'visits',
      boq: 'boqs',
    }[recoveryRequestType]
    if (requestedTab) setActiveTab(requestedTab)
  }, [isOpen, recoveryRequestType])

  // Reset fetched on close so data refreshes on next open
  useEffect(() => {
    if (!isOpen) setFetched(false)
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const navigate = useNavigate()
  const goTo = (path) => { onClose(); navigate(path) }

  const tabs = [
    { key: 'quotes', label: t('myRequests.quotesTab'), icon: 'request_quote', count: quotes.length },
    { key: 'visits', label: t('myRequests.visitsTab'), icon: 'factory',       count: visits.length },
    { key: 'boqs',   label: t('myRequests.boqsTab'),   icon: 'receipt_long',  count: boqs.length },
  ]
  const refreshRequests = () => loadRequests()
  const recoveryTab = {
    quote: 'quotes',
    visit: 'visits',
    boq: 'boqs',
  }[recoveryRequestType]
  const recoveryTabIsEmpty = recoveryRequestType !== 'contact' &&
    recoveryTab === activeTab &&
    (activeTab === 'quotes' ? quotes.length === 0 : activeTab === 'visits' ? visits.length === 0 : boqs.length === 0)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 z-[200] transition-opacity duration-300"
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
        aria-hidden="true"
      />

      {/* Slide-in drawer */}
      <div
        ref={panelRef}
        className={`fixed top-0 ${isRTL ? 'left-0' : 'right-0'} h-full w-full max-w-[480px] bg-slate-50 shadow-2xl z-[210] flex flex-col ${shouldTransition ? 'transition-transform duration-300 ease-out' : ''}`}
        style={{ transform: isOpen ? 'translateX(0)' : isRTL ? 'translateX(-100%)' : 'translateX(100%)' }}
        role="dialog"
        aria-modal="true"
        aria-label={t('myRequests.title')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 shrink-0">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-white">{t('myRequests.title')}</p>
            {user && (
              <p className="text-[11px] text-slate-400 truncate mt-0.5 max-w-[260px]">{user.email}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1" aria-label="Close">
            <span className="material-symbols-outlined text-xl leading-none">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-white shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-primary border-b-2 border-primary bg-slate-50'
                  : 'text-slate-500 hover:text-slate-800 border-b-2 border-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-base leading-none shrink-0">{tab.icon}</span>
              <span className="font-headline">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`inline-flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[9px] font-bold rounded-full shrink-0 ${
                  activeTab === tab.key ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {recoveryRequestType && (
          <div className="flex items-start gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950">
            <p className="flex-1">
              {recoveryRequestType === 'contact'
                ? t('myRequests.contactRecoveryNote')
                : t('myRequests.recoveryNote')}
            </p>
            {recoveryRequestType !== 'contact' && <button
              type="button"
              onClick={refreshRequests}
              disabled={loading}
              className="inline-flex shrink-0 items-center gap-1 font-bold uppercase tracking-wide text-amber-950 underline disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>
                {loading ? 'progress_activity' : 'refresh'}
              </span>
              {t('myRequests.refresh')}
            </button>}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-primary rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{t('myRequests.loading')}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
              <span className="material-symbols-outlined text-4xl text-red-300">error</span>
              <p className="text-xs text-red-500 font-bold uppercase tracking-widest">{error}</p>
              <button
                onClick={refreshRequests}
                className="text-xs font-bold uppercase tracking-widest px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              >
                  {t('myRequests.retry')}
              </button>
            </div>
          ) : recoveryRequestType === 'contact' ? (
            <EmptyState
              icon="info"
              text={t('myRequests.contactRecoveryTitle')}
              desc={t('myRequests.contactRecoveryNote')}
              ctaLabel={t('myRequests.returnToForm')}
              onCta={onClose}
            />
          ) : activeTab === 'quotes' ? (
            quotes.length === 0 ? (
              recoveryTabIsEmpty ? (
                <EmptyState
                  icon="schedule"
                  text={t('myRequests.recoveryEmptyTitle')}
                  desc={t('myRequests.recoveryEmptyDesc')}
                  ctaLabel={t('myRequests.returnToForm')}
                  onCta={onClose}
                />
              ) : <EmptyState
                icon="request_quote"
                text={t('myRequests.noQuotes')}
                desc={t('myRequests.noQuotesDesc')}
                ctaLabel={t('myRequests.requestQuote')}
                onCta={() => goTo('/request?type=quote')}
              />
            ) : (
              <div className="p-3.5 space-y-2.5">
                {quotes.map((q) => <QuoteCard key={q.id} quote={q} lang={lang} t={t} />)}
              </div>
            )
          ) : activeTab === 'visits' ? (
            visits.length === 0 ? (
              recoveryTabIsEmpty ? (
                <EmptyState
                  icon="schedule"
                  text={t('myRequests.recoveryEmptyTitle')}
                  desc={t('myRequests.recoveryEmptyDesc')}
                  ctaLabel={t('myRequests.returnToForm')}
                  onCta={onClose}
                />
              ) : <EmptyState
                icon="factory"
                text={t('myRequests.noVisits')}
                desc={t('myRequests.noVisitsDesc')}
                ctaLabel={t('myRequests.requestVisit')}
                onCta={() => goTo('/request?type=visit')}
              />
            ) : (
              <div className="p-3.5 space-y-2.5">
                {visits.map((v) => <VisitCard key={v.id} visit={v} lang={lang} t={t} />)}
              </div>
            )
          ) : (
            boqs.length === 0 ? (
              recoveryTabIsEmpty ? (
                <EmptyState
                  icon="schedule"
                  text={t('myRequests.recoveryEmptyTitle')}
                  desc={t('myRequests.recoveryEmptyDesc')}
                  ctaLabel={t('myRequests.returnToForm')}
                  onCta={onClose}
                />
              ) : <EmptyState
                icon="receipt_long"
                text={t('myRequests.noBOQs')}
                desc={t('myRequests.noBOQsDesc')}
                ctaLabel={t('myRequests.requestBOQ')}
                onCta={() => goTo('/request?type=boq')}
              />
            ) : (
              <div className="p-3.5 space-y-2.5">
                {boqs.map((b) => <BOQCard key={b.id} boq={b} lang={lang} t={t} />)}
              </div>
            )
          )}
        </div>

        {/* Footer CTAs */}
        {!loading && !error && !recoveryRequestType && (
          <div className="shrink-0 border-t border-slate-200 px-4 pt-3 pb-4 bg-white space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => goTo('/request?type=quote')}
                className="flex items-center justify-center gap-1.5 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-sm leading-none">request_quote</span>
                {t('myRequests.requestQuote')}
              </button>
              <button
                onClick={() => goTo('/request?type=visit')}
                className="flex items-center justify-center gap-1.5 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-sm leading-none">factory</span>
                {t('myRequests.requestVisit')}
              </button>
            </div>
            <button
              onClick={() => goTo('/request?type=boq')}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-primary text-white hover:bg-primary-dark font-headline transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-base leading-none">receipt_long</span>
              {t('myRequests.requestBOQ')}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
