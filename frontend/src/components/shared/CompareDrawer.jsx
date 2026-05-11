import { useTranslation } from 'react-i18next'
import { useCompare, MAX_COMPARE } from '../../utils/compareContext'

export default function CompareDrawer() {
  const { t, i18n } = useTranslation()
  const { compareList, removeFromCompare, clearCompare } = useCompare()

  if (compareList.length === 0) return null

  const handleCompare = () => {
    const ids = compareList.map((p) => p.id).join(',')
    window.navigateTo('compare', null, ids)
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up"
      style={{ animation: 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1) both' }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      {/* Backdrop blur bar */}
      <div className="bg-primary/95 backdrop-blur-xl border-t border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center gap-4">

          {/* Label */}
          <div className="shrink-0 hidden sm:block">
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/50">
              {t('compare.drawer.comparing')}
            </p>
            <p className="text-white font-headline font-black text-sm">
              {compareList.length} / {MAX_COMPARE} {t('compare.drawer.products')}
            </p>
          </div>

          {/* Product chips */}
          <div className="flex gap-3 flex-1 justify-center flex-wrap">
            {compareList.map((product) => {
              const name = i18n.language === 'ar' ? product.name_ar : product.name_en
              const img = product.images?.[0]?.image_url
              return (
                <div
                  key={product.id}
                  className="flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-2 rounded-sm group"
                >
                  {img && (
                    <img src={img} alt={name} className="w-7 h-7 object-cover rounded-sm opacity-90" />
                  )}
                  <span className="text-white font-headline text-xs font-bold truncate max-w-[120px]">{name}</span>
                  <button
                    onClick={() => removeFromCompare(product.id)}
                    className="text-white/50 hover:text-white ml-1 transition-colors"
                    aria-label="Remove"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              )
            })}

            {/* Empty slots — click to go browse products */}
            {Array.from({ length: MAX_COMPARE - compareList.length }).map((_, i) => (
              <button
                key={`slot-${i}`}
                onClick={() => window.navigateTo('products')}
                className="flex items-center gap-2 border border-white/25 border-dashed px-4 py-2 rounded-sm opacity-60 hover:opacity-100 hover:border-white/60 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-white text-sm">add</span>
                <span className="text-white font-label text-[10px] tracking-widest uppercase">
                  {t('compare.drawer.addProduct')}
                </span>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={clearCompare}
              className="text-white/50 hover:text-white text-[10px] font-bold tracking-widest uppercase transition-colors"
            >
              {t('compare.drawer.clear')}
            </button>
            <button
              onClick={handleCompare}
              disabled={compareList.length < 2}
              className="bg-white text-primary px-6 py-3 font-headline font-black text-xs uppercase tracking-[0.15em] flex items-center gap-2 hover:bg-tertiary-fixed transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('compare.drawer.compareNow')}
              <span className="material-symbols-outlined text-sm">compare_arrows</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
