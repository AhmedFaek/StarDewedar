import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../utils/api.js'

/* ── Status Badge ─────────────────────────────────────────────────────────── */

const STATUS_COLORS = {
  pending:  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  contacted: { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  closed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
}

function StatusBadge({ status }) {
  const key = status?.toLowerCase() ?? 'pending'
  const c = STATUS_COLORS[key] ?? STATUS_COLORS.pending
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border ${c.bg} ${c.text} ${c.border}`}>
      {status ?? 'pending'}
    </span>
  )
}

/* ── Single Quote Card ───────────────────────────────────────────────────── */

function QuoteCard({ quote, lang, t }) {
  const productName = quote.product
    ? (quote.product[`name_${lang}`] ?? quote.product.name_en)
    : quote.custom_product_name ?? t('myRequests.customProduct')

  const date = new Date(quote.created_at).toLocaleDateString(
    lang === 'ar' ? 'ar-EG' : 'en-GB',
    { year: 'numeric', month: 'short', day: 'numeric' }
  )

  return (
    <div className="border border-slate-100 bg-white hover:border-yellow-300 hover:shadow-md transition-all duration-200 p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-black text-slate-900 uppercase tracking-tight leading-snug line-clamp-2 flex-1">
          {productName}
        </p>
        <StatusBadge status={quote.status} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
          <span className="material-symbols-outlined text-[12px] leading-none">calendar_today</span>
          {date}
        </span>
        {quote.phone && (
          <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
            <span className="material-symbols-outlined text-[12px] leading-none">phone</span>
            {quote.phone}
          </span>
        )}
      </div>
      {quote.details && (
        <p className="mt-2 text-[10px] text-slate-500 leading-relaxed line-clamp-2">{quote.details}</p>
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
    <div className="border border-slate-100 bg-white hover:border-slate-900 hover:shadow-md transition-all duration-200 p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-black text-slate-900 uppercase tracking-tight leading-snug flex-1">
          {visit.factory_name}
        </p>
        <StatusBadge status={visit.status} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-1">
        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
          <span className="material-symbols-outlined text-[12px] leading-none">calendar_today</span>
          {t('myRequests.submitted')}: {date}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
          <span className="material-symbols-outlined text-[12px] leading-none">event</span>
          {t('myRequests.preferredDate')}: {preferred}
        </span>
      </div>
      <p className="text-[10px] text-slate-400 font-medium">
        {visit.factory_activity}{visit.address ? ` · ${visit.address}` : ''}
      </p>
    </div>
  )
}

/* ── Empty State ─────────────────────────────────────────────────────────── */

function EmptyState({ icon, text, desc, ctaLabel, onCta }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <span className="material-symbols-outlined text-5xl text-slate-200 mb-4" style={{ fontVariationSettings: "'FILL' 0" }}>
        {icon}
      </span>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{text}</p>
      <p className="text-[12px] text-slate-300 leading-relaxed mb-4 max-w-[200px]">{desc}</p>
      <button
        onClick={onCta}
        className="font-headline font-bold uppercase text-[10px] tracking-widest px-4 py-2 bg-slate-900 text-white hover:bg-yellow-400 hover:text-slate-900 transition-colors"
      >
        {ctaLabel}
      </button>
    </div>
  )
}

/* ── Main Panel ──────────────────────────────────────────────────────────── */

export default function MyRequestsPanel({ isOpen, onClose, user }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const isRTL = lang === 'ar'
  const panelRef = useRef(null)

  const [activeTab, setActiveTab] = useState('quotes')
  const [quotes, setQuotes]       = useState([])
  const [visits, setVisits]       = useState([])
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

  // Fetch on first open
  useEffect(() => {
    if (!isOpen || fetched) return
    setLoading(true)
    setError(null)
    Promise.all([api.getMyQuotes(), api.getMyVisits()])
      .then(([q, v]) => {
        setQuotes(Array.isArray(q) ? q : [])
        setVisits(Array.isArray(v) ? v : [])
        setFetched(true)
      })
      .catch(() => setError(t('myRequests.error')))
      .finally(() => setLoading(false))
  }, [isOpen, fetched, t])

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

  const navigate = (page) => { onClose(); window.navigateTo(page) }

  const tabs = [
    { key: 'quotes', label: t('myRequests.quotes'), icon: 'request_quote', count: quotes.length },
    { key: 'visits', label: t('myRequests.visits'), icon: 'factory',       count: visits.length },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] transition-opacity duration-300"
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
        aria-hidden="true"
      />

      {/* Slide-in drawer */}
      <div
        ref={panelRef}
        className={`fixed top-0 ${isRTL ? 'left-0' : 'right-0'} h-full w-full max-w-sm bg-slate-50 shadow-2xl z-[210] flex flex-col ${shouldTransition ? 'transition-transform duration-300 ease-out' : ''}`}
        style={{ transform: isOpen ? 'translateX(0)' : isRTL ? 'translateX(-100%)' : 'translateX(100%)' }}
        role="dialog"
        aria-modal="true"
        aria-label={t('myRequests.title')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 shrink-0">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-white">{t('myRequests.title')}</p>
            {user && (
              <p className="text-[10px] text-slate-400 truncate mt-0.5 max-w-[200px]">{user.email}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Close">
            <span className="material-symbols-outlined text-xl leading-none">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-white shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                activeTab === tab.key
                  ? 'text-slate-900 border-b-2 border-yellow-400 bg-slate-50'
                  : 'text-slate-400 hover:text-slate-600 border-b-2 border-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-sm leading-none">{tab.icon}</span>
              {tab.label}
              {tab.count > 0 && (
                <span className={`inline-flex items-center justify-center w-4 h-4 text-[8px] font-black rounded-full ${
                  activeTab === tab.key ? 'bg-yellow-400 text-slate-900' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-yellow-400 rounded-full animate-spin" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('myRequests.loading')}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
              <span className="material-symbols-outlined text-4xl text-red-300">error</span>
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{error}</p>
              <button
                onClick={() => setFetched(false)}
                className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              >
                  {t('myRequests.retry')}
              </button>
            </div>
          ) : activeTab === 'quotes' ? (
            quotes.length === 0 ? (
              <EmptyState
                icon="request_quote"
                text={t('myRequests.noQuotes')}
                desc={t('myRequests.noQuotesDesc')}
                ctaLabel={t('myRequests.requestQuote')}
                onCta={() => navigate('request-quote')}
              />
            ) : (
              <div className="p-4 space-y-3">
                {quotes.map((q) => <QuoteCard key={q.id} quote={q} lang={lang} t={t} />)}
              </div>
            )
          ) : (
            visits.length === 0 ? (
              <EmptyState
                icon="factory"
                text={t('myRequests.noVisits')}
                desc={t('myRequests.noVisitsDesc')}
                ctaLabel={t('myRequests.requestVisit')}
                onCta={() => navigate('request-visit')}
              />
            ) : (
              <div className="p-4 space-y-3">
                {visits.map((v) => <VisitCard key={v.id} visit={v} lang={lang} t={t} />)}
              </div>
            )
          )}
        </div>

        {/* Footer CTAs */}
        {!loading && !error && (
          <div className="shrink-0 border-t border-slate-200 px-4 pt-4 pb-6 bg-white grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate('request-quote')}
              className="flex items-center justify-center gap-1.5 py-2.5 text-[9px] font-black uppercase tracking-widest border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-sm leading-none">request_quote</span>
              {t('myRequests.requestQuote')}
            </button>
            <button
              onClick={() => navigate('request-visit')}
              className="flex items-center justify-center gap-1.5 py-2.5 text-[9px] font-black uppercase tracking-widest bg-yellow-400 text-slate-900 hover:bg-yellow-300 transition-colors"
            >
              <span className="material-symbols-outlined text-sm leading-none">factory</span>
              {t('myRequests.requestVisit')}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
