/**
 * Request Page — Unified request hub for Visit, Quote, and BOQ.
 *
 * URL behavior:
 *   /request              → shows type selector, no form pre-selected
 *   /request?type=visit   → auto-selects Visit form
 *   /request?type=quote   → auto-selects Quote form
 *   /request?type=boq     → auto-selects BOQ form
 *
 * State preservation: all three forms remain mounted at all times;
 * only visibility changes when the user switches tabs. This ensures
 * partially-filled form data is not lost.
 */
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { usePrivatePageSeo } from '../hooks/usePrivatePageSeo'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import VisitFormSection from '../components/sections/VisitFormSection'
import QuoteForm from '../components/sections/QuoteForm'
import BOQFormSection from '../components/sections/BOQFormSection'
import QuoteSidebar from '../components/sections/QuoteSidebar'

const VALID_TYPES = ['visit', 'quote', 'boq']

// ── Request type card data ────────────────────────────────────────────────────

function getTypeCards(t) {
  return [
    {
      type: 'quote',
      icon: 'request_quote',
      label: t('requestPage.cards.quote'),
      description: t('requestPage.cards.quoteDesc'),
    },
    {
      type: 'boq',
      icon: 'description',
      label: t('requestPage.cards.boq'),
      description: t('requestPage.cards.boqDesc'),
    },
    {
      type: 'visit',
      icon: 'engineering',
      label: t('requestPage.cards.visit'),
      description: t('requestPage.cards.visitDesc'),
    },
  ]
}

// ── Type selector card ────────────────────────────────────────────────────────

function TypeCard({ type, icon, label, description, isActive, onClick }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      id={`request-type-${type}`}
      onClick={() => onClick(type)}
      aria-pressed={isActive}
      className={`
        group relative flex flex-col items-start text-start p-5 sm:p-6 rounded-2xl border transition-all duration-200 outline-none
        focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        ${isActive
          ? 'bg-gradient-to-br from-white via-sky-50/50 to-primary/5 border-primary shadow-md ring-2 ring-primary/20'
          : 'bg-white border-slate-200 hover:border-primary/50 hover:shadow-md shadow-2xs'
        }
      `}
    >
      {/* Active pill badge */}
      {isActive && (
        <div className="absolute top-3.5 end-3.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary text-white text-[10px] font-headline font-bold rtl:font-semibold uppercase tracking-wider shadow-2xs">
          <span className="material-symbols-outlined text-xs">check</span>
          <span>{t('requestPage.activeBadge')}</span>
        </div>
      )}

      {/* Icon Container */}
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3.5 transition-colors ${
          isActive
            ? 'bg-primary text-white shadow-sm shadow-primary/30'
            : 'bg-slate-100 text-slate-700 group-hover:bg-primary/10 group-hover:text-primary'
        }`}
      >
        <span className="material-symbols-outlined text-2xl">
          {icon}
        </span>
      </div>

      <div className="flex-1 w-full">
        <h3
          className={`font-headline font-bold text-sm sm:text-base tracking-tight leading-snug ${
            isActive ? 'text-deep-blue font-extrabold' : 'text-slate-900 group-hover:text-primary transition-colors'
          }`}
        >
          {label}
        </h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2 font-body">
          {description}
        </p>
      </div>

      <div
        className={`mt-4 pt-3 border-t w-full flex items-center justify-between text-[11px] font-headline font-bold uppercase tracking-wider transition-colors ${
          isActive
            ? 'border-primary/20 text-primary'
            : 'border-slate-100 text-slate-400 group-hover:text-primary'
        }`}
      >
        <span>{label}</span>
        <span className="material-symbols-outlined text-xs rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
          arrow_forward
        </span>
      </div>
    </button>
  )
}

// ── Main page component ───────────────────────────────────────────────────────

export default function Request() {
  const { t } = useTranslation()

  // Apply noindex/nofollow to request hub forms
  usePrivatePageSeo({ en: 'Submit a Request', ar: 'تقديم طلب' })

  // Read initial type from URL query param
  const getInitialType = () => {
    const params = new URLSearchParams(window.location.search)
    const type = params.get('type')
    if (VALID_TYPES.includes(type)) return type
    if (params.get('productId')) return 'quote'
    return null
  }

  const [activeType, setActiveType] = useState(getInitialType)
  const productId = new URLSearchParams(window.location.search).get('productId')

  // Sync activeType → URL without full navigation (preserves React state)
  const handleTypeSelect = useCallback((type) => {
    setActiveType(type)
    const url = new URL(window.location.href)
    url.searchParams.set('type', type)
    window.history.replaceState({}, '', url.toString())
  }, [])

  // On browser back/forward, keep activeType in sync
  useEffect(() => {
    const onPopState = () => setActiveType(getInitialType())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const cards = getTypeCards(t)

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />
      <main className="flex-grow pt-28 pb-16">

        {/* ── Hero section ──────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 sm:mb-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-headline text-[11px] font-bold uppercase tracking-wider mb-2.5">
              <span className="material-symbols-outlined text-sm">hub</span>
              <span>{t('requestPage.portalBadge')}</span>
            </div>
            <h1 className="font-headline font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight text-deep-blue leading-tight mb-2">
              {t('requestPage.heroTitle')}
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm lg:text-base leading-relaxed font-body max-w-2xl">
              {t('requestPage.heroDesc')}
            </p>
          </div>
        </section>

        {/* ── Type selector ─────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 sm:mb-10">
          <div className="flex items-center justify-between mb-3.5">
            <p className="font-headline text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('requestPage.selectLabel')}
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3.5 sm:gap-5">
            {cards.map((card) => (
              <TypeCard
                key={card.type}
                {...card}
                isActive={activeType === card.type}
                onClick={handleTypeSelect}
              />
            ))}
          </div>
        </section>

        {/* ── Forms ─────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Quote form inside unified SDC container */}
          <div className={activeType === 'quote' ? '' : 'hidden'} aria-hidden={activeType !== 'quote'}>
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_12px_40px_-12px_rgba(16,42,67,0.08)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
              <QuoteSidebar variant="quote" />
              <QuoteForm productId={productId} visible={activeType === 'quote'} />
            </div>
          </div>

          {/* BOQ form inside unified SDC container */}
          <div className={activeType === 'boq' ? '' : 'hidden'} aria-hidden={activeType !== 'boq'}>
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_12px_40px_-12px_rgba(16,42,67,0.08)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
              <QuoteSidebar variant="boq" />
              <BOQFormSection visible={activeType === 'boq'} />
            </div>
          </div>

          {/* Visit form inside unified SDC container */}
          <div className={activeType === 'visit' ? '' : 'hidden'} aria-hidden={activeType !== 'visit'}>
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_12px_40px_-12px_rgba(16,42,67,0.08)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
              <QuoteSidebar variant="visit" />
              <VisitFormSection visible={activeType === 'visit'} />
            </div>
          </div>

          {/* Empty state — show when no type selected */}
          {!activeType && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 sm:p-16 flex flex-col items-center justify-center text-center shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl">touch_app</span>
              </div>
              <h3 className="font-headline font-bold text-base sm:text-lg text-deep-blue">
                {t('requestPage.selectLabel')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1.5 font-body">
                {t('requestPage.heroDesc')}
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
