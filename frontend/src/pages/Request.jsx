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
      type: 'visit',
      icon: 'engineering',
      label: t('requestPage.cards.visit'),
      description: t('requestPage.cards.visitDesc'),
    },
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
  ]
}

// ── Type selector card ────────────────────────────────────────────────────────

function TypeCard({ type, icon, label, description, isActive, onClick }) {
  return (
    <button
      type="button"
      id={`request-type-${type}`}
      onClick={() => onClick(type)}
      aria-pressed={isActive}
      className={`
        group flex flex-col items-start gap-3 p-6 sm:p-8 border-2 transition-all text-left
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        ${isActive
          ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
          : 'border-surface-variant bg-surface-container-lowest text-primary hover:border-primary hover:shadow-md hover:scale-[1.01]'
        }
      `}
    >
      <span className={`material-symbols-outlined text-3xl sm:text-4xl transition-colors ${isActive ? 'text-white' : 'text-primary group-hover:text-primary'}`}>
        {icon}
      </span>
      <div>
        <p className={`font-headline font-black text-base sm:text-lg uppercase tracking-tight leading-tight ${isActive ? 'text-white' : 'text-primary'}`}>
          {label}
        </p>
        <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${isActive ? 'text-white/80' : 'text-secondary'}`}>
          {description}
        </p>
      </div>
      <div className={`mt-auto flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-white/80' : 'text-tertiary group-hover:text-primary'}`}>
        <span>{label}</span>
        <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
      </div>
    </button>
  )
}

// ── Main page component ───────────────────────────────────────────────────────

export default function Request() {
  const { t } = useTranslation()

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
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="flex-grow pt-32 pb-20">

        {/* ── Hero section ──────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 mb-12 sm:mb-16">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-end">
            <div>
              <h1 className="font-headline font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tighter text-primary leading-[0.9] mb-6 sm:mb-8">
                {t('requestPage.heroTitle')}
              </h1>
              <div className="h-1 w-20 sm:w-32 bg-tertiary-fixed mb-6 sm:mb-8" />
            </div>
            <div className="pb-2 sm:pb-4">
              <p className="text-secondary text-base sm:text-lg lg:text-xl leading-relaxed max-w-lg">
                {t('requestPage.heroDesc')}
              </p>
            </div>
          </div>
        </section>

        {/* ── Type selector ─────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 mb-10 sm:mb-12">
          <p className="font-label text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-secondary mb-4 sm:mb-6">
            {t('requestPage.selectLabel')}
          </p>
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
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
        <section className="max-w-7xl mx-auto px-4 sm:px-8">
          {/* Animate-in indicator bar */}
          {activeType && (
            <div className="h-1 w-full bg-surface-variant mb-8 sm:mb-10 overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500 w-full" />
            </div>
          )}

          {/* All three forms are always mounted; hidden via CSS to preserve state */}
          <VisitFormSection visible={activeType === 'visit'} />

          {/* Quote form inside its original layout shell */}
          <div className={activeType === 'quote' ? '' : 'hidden'} aria-hidden={activeType !== 'quote'}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden shadow-2xl">
              <QuoteSidebar />
              <QuoteForm productId={productId} visible={activeType === 'quote'} />
            </div>
          </div>

          <BOQFormSection visible={activeType === 'boq'} />

          {/* Empty state — show when no type selected */}
          {!activeType && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="material-symbols-outlined text-6xl text-surface-variant mb-4">touch_app</span>
              <p className="text-secondary font-bold uppercase tracking-widest text-sm">
                {t('requestPage.selectLabel')}
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}


