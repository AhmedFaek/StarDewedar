import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useCompare, MAX_COMPARE } from '../utils/compareContext'
import { api } from '../utils/api'

// ── Comparison rows config ─────────────────────────────────────────────────────
// Each row defines a label key and how to extract the value from a product.
const ROWS = [
  {
    key: 'compare.rows.category',
    get: (p, lang) => (lang === 'ar' ? p.category?.name_ar : p.category?.name_en) || '—',
  },
  {
    key: 'compare.rows.price',
    get: (p) =>
      p.price
        ? `EGP ${Number(p.price).toLocaleString('en-EG', { minimumFractionDigits: 2 })}`
        : '—',
    highlight: true,
  },
  {
    key: 'compare.rows.description',
    get: (p, lang) => (lang === 'ar' ? p.description_ar : p.description_en) || '—',
    isText: true,
  },
]

// ── Empty slot ─────────────────────────────────────────────────────────────────
function EmptySlot({ onSelect, lang, allProducts, compareList }) {
  const { t, i18n } = useTranslation()
  const [query, setQuery] = useState('')

  const sameCategory = compareList.length > 0 ? compareList[0].category_id : null
  const filtered = allProducts.filter((p) => {
    const name = i18n.language === 'ar' ? p.name_ar : p.name_en
    const alreadyIn = compareList.some((c) => c.id === p.id)
    const samecat = sameCategory ? p.category_id === sameCategory : true
    return !alreadyIn && samecat && (!query || name.toLowerCase().includes(query.toLowerCase()))
  })

  return (
    <div className="flex flex-col items-center gap-4 p-6 sm:p-8 h-full min-h-[400px]">
      {/* Placeholder illustration */}
      <div className="w-32 h-32 rounded-full bg-surface-container-low flex items-center justify-center mb-2">
        <span className="material-symbols-outlined text-5xl text-outline/40">inventory_2</span>
      </div>

      {/* Search */}
      <div className="w-full relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('compare.drawer.addProduct')}
          className="w-full pl-9 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 text-sm font-body text-primary placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Suggestions */}
      {filtered.length > 0 && (
        <div className="w-full max-h-52 overflow-y-auto divide-y divide-outline-variant/10">
          {filtered.slice(0, 8).map((p) => {
            const name = i18n.language === 'ar' ? p.name_ar : p.name_en
            const img = p.images?.[0]?.image_url
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-primary/5 transition-colors text-left group"
              >
                {img ? (
                  <img src={img} alt={name} className="w-10 h-10 object-cover shrink-0 border border-outline-variant/20" />
                ) : (
                  <div className="w-10 h-10 bg-surface-container-high shrink-0" />
                )}
                <span className="font-headline text-sm font-bold text-primary leading-tight group-hover:text-primary/70 transition-colors">
                  {name}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {query && filtered.length === 0 && (
        <p className="text-outline text-xs text-center font-label">{t('compare.noResults')}</p>
      )}
    </div>
  )
}

// ── Product column header ──────────────────────────────────────────────────────
function ProductHeader({ product, onRemove }) {
  const { i18n, t } = useTranslation()
  const navigate = useNavigate()
  const name = i18n.language === 'ar' ? product.name_ar : product.name_en
  const img = product.images?.[0]?.image_url

  return (
    <div className="relative flex flex-col items-center gap-4 p-6 sm:p-8 border-b border-outline-variant/15 bg-surface-container-lowest">
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container transition-colors rounded-full"
        aria-label="Remove product"
      >
        <span className="material-symbols-outlined text-base">close</span>
      </button>

      {/* Image */}
      <div className="w-28 h-28 sm:w-36 sm:h-36 bg-surface-container-low flex items-center justify-center overflow-hidden border border-outline-variant/15">
        {img ? (
          <img src={img} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-4xl text-outline/30">inventory_2</span>
        )}
      </div>

      {/* Name */}
      <div className="text-center">
        <h3 className="font-headline font-black text-base sm:text-lg text-primary uppercase leading-tight">{name}</h3>
        <p className="text-[10px] text-outline font-label tracking-widest uppercase mt-1">
          {i18n.language === 'ar' ? product.category?.name_ar : product.category?.name_en}
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate(`/request-quote?productId=${product.id}`)}
        className="w-full bg-primary text-white py-2.5 text-[10px] font-headline font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-primary/90 transition-all mt-2"
      >
        {t('productDetail.requestQuote')}
        <span className="material-symbols-outlined text-xs">arrow_forward</span>
      </button>
    </div>
  )
}

// ── Main Compare Page ──────────────────────────────────────────────────────────
export default function ComparePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { compareList, addToCompare, removeFromCompare, clearCompare } = useCompare()
  const [allProducts, setAllProducts] = useState([])
  const [loadedProducts, setLoadedProducts] = useState(false)
  const [hideSimilar, setHideSimilar] = useState(false)

  // Load all products lazily when the page mounts
  useEffect(() => {
    if (loadedProducts) return
    api.getProducts().then((data) => {
      setAllProducts(data)
      setLoadedProducts(true)
    }).catch(console.error)
  }, [])

  const isEmpty = compareList.length === 0

  // How many columns: filled products + empty slots (up to MAX_COMPARE)
  const filledCount = compareList.length
  const emptySlots = MAX_COMPARE - filledCount

  // Build column values per row — used for "hide similar" logic
  const getValues = (rowDef) => compareList.map((p) => rowDef.get(p, i18n.language))
  const allSame = (values) => values.every((v) => v === values[0])

  const title = compareList.length >= 2
    ? `${i18n.language === 'ar' ? compareList[0].name_ar : compareList[0].name_en} vs ${i18n.language === 'ar' ? compareList[1].name_ar : compareList[1].name_en}${compareList[2] ? ` vs ${i18n.language === 'ar' ? compareList[2].name_ar : compareList[2].name_en}` : ''}`
    : t('compare.page.title')

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Header />
      <main className="flex-grow pt-24 pb-32 px-4 sm:px-8 max-w-screen-xl mx-auto w-full">

        {/* ── Page Header ── */}
        <div className="py-10 border-b border-outline-variant/15 mb-0">
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-tertiary mb-2">
            {t('compare.page.badge')}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline font-black tracking-tighter text-primary uppercase">
              {title}
            </h1>

            <div className="flex items-center gap-6">
              {/* Hide similarities toggle */}
              {compareList.length >= 2 && (
                <label className="flex items-center gap-3 cursor-pointer select-none group">
                  <span className="text-xs font-bold text-secondary group-hover:text-primary transition-colors">
                    {t('compare.page.hideSimilar')}
                  </span>
                  <button
                    role="switch"
                    aria-checked={hideSimilar}
                    onClick={() => setHideSimilar((v) => !v)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none ${hideSimilar ? 'bg-primary' : 'bg-outline-variant/40'}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${hideSimilar ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </label>
              )}

              {!isEmpty && (
                <button
                  onClick={clearCompare}
                  className="text-[10px] font-bold uppercase tracking-widest text-outline hover:text-primary transition-colors"
                >
                  {t('compare.drawer.clear')}
                </button>
              )}
            </div>
          </div>
        </div>

        {isEmpty ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
            <span className="material-symbols-outlined text-7xl text-outline/30">compare_arrows</span>
            <h2 className="text-2xl font-headline font-bold text-primary">{t('compare.page.empty')}</h2>
            <p className="text-secondary max-w-sm">{t('compare.page.emptyDesc')}</p>
            <button
              onClick={() => navigate('/products')}
              className="mt-4 bg-primary text-white px-8 py-4 font-headline font-bold uppercase text-xs tracking-widest hover:bg-primary/90 transition-all"
            >
              {t('compare.page.browseProducts')}
            </button>
          </div>
        ) : (
          <div>
            {/* ── Columns grid ── */}
            <div
              className="grid border border-outline-variant/15 overflow-hidden"
              style={{ gridTemplateColumns: `180px repeat(${MAX_COMPARE}, 1fr)` }}
            >
              {/* ── TOP ROW: label header + product headers ── */}
              {/* Label column top-left (blank) */}
              <div className="bg-surface-container-low border-b border-r border-outline-variant/15" />

              {/* Product columns */}
              {compareList.map((product) => (
                <div key={product.id} className="border-b border-r border-outline-variant/15 last:border-r-0">
                  <ProductHeader product={product} onRemove={() => removeFromCompare(product.id)} />
                </div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <div key={`empty-${i}`} className="border-b border-r border-outline-variant/15 last:border-r-0 bg-surface-container-lowest/50">
                  <EmptySlot
                    onSelect={(p) => addToCompare(p)}
                    allProducts={allProducts}
                    compareList={compareList}
                  />
                </div>
              ))}

              {/* ── DATA ROWS ── */}
              {ROWS.map((rowDef, rowIdx) => {
                const values = getValues(rowDef)
                const similar = allSame(values)
                if (hideSimilar && similar) return null

                const isOdd = rowIdx % 2 === 0

                return [
                  /* Label cell */
                  <div
                    key={`label-${rowIdx}`}
                    className={`flex items-start px-5 py-5 border-b border-r border-outline-variant/15 ${isOdd ? 'bg-surface-container-low' : 'bg-surface'}`}
                  >
                    <span className="font-label text-[11px] font-bold uppercase tracking-[0.2em] text-outline leading-tight">
                      {t(rowDef.key)}
                    </span>
                    {similar && (
                      <span className="ml-2 shrink-0 w-1.5 h-1.5 rounded-full bg-outline/30 mt-1" />
                    )}
                  </div>,

                  /* Value cells */
                  ...compareList.map((product, colIdx) => {
                    const val = rowDef.get(product, i18n.language)
                    const isDiff = !similar

                    return (
                      <div
                        key={`val-${rowIdx}-${product.id}`}
                        className={`px-6 py-5 border-b border-r border-outline-variant/15 last:border-r-0 ${isOdd ? 'bg-surface-container-low' : 'bg-surface'} ${isDiff ? 'bg-amber-50/20' : ''}`}
                      >
                        <p
                          className={`font-body text-sm leading-relaxed ${rowDef.highlight ? 'font-black text-xl font-headline text-primary' : ''} ${rowDef.isText ? 'text-secondary text-xs leading-relaxed' : 'text-primary font-semibold'}`}
                        >
                          {val}
                        </p>
                      </div>
                    )
                  }),

                  /* Empty slot cells */
                  ...Array.from({ length: emptySlots }).map((_, i) => (
                    <div
                      key={`empty-val-${rowIdx}-${i}`}
                      className={`px-6 py-5 border-b border-r border-outline-variant/15 last:border-r-0 ${isOdd ? 'bg-surface-container-lowest/40' : 'bg-surface-container-lowest/20'}`}
                    >
                      <div className="h-4 w-16 bg-outline-variant/10 rounded" />
                    </div>
                  )),
                ]
              })}
            </div>

            {/* ── Legend ── */}
            {!hideSimilar && compareList.length >= 2 && (
              <div className="mt-6 flex items-center gap-3 text-xs text-outline font-label">
                <div className="w-3 h-3 rounded-sm bg-amber-50/60 border border-amber-200/50" />
                <span>{t('compare.page.diffLegend')}</span>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
