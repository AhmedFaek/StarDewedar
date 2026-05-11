import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import ContentLoader from '../components/shared/ContentLoader'
import FavouriteButton from '../components/shared/FavouriteButton'
import { api } from '../utils/api'
import { getUser, isLoggedIn } from '../utils/auth'

export default function SavedProducts() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const user = getUser()

  useEffect(() => {
    if (!isLoggedIn()) {
      setLoading(false)
      return
    }
    api.getSavedProducts()
      .then(data => setProducts(data))
      .catch(err => console.error('Failed to load saved products:', err))
      .finally(() => setLoading(false))
  }, [])

  // Remove a product from the local list when it's unfavourited
  const handleUnsaved = (productId) => {
    setProducts(prev => prev.filter(p => p.id !== productId))
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Header />
      <main className="flex-grow"><ContentLoader variant="saved-products" /></main>
      <Footer />
    </div>
  )


  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Header />
      <main className="flex-grow pt-32 pb-20 px-4 sm:px-8 md:px-16 max-w-screen-2xl mx-auto w-full">

        {/* ── Page header ──────────────────────────────────────────────────────── */}
        <div className="mb-12 border-b border-outline-variant/20 pb-8">
          <div className="flex items-center gap-4 mb-3">
            <span className="material-symbols-outlined text-red-400 text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}>
              favorite
            </span>
            <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tighter text-primary uppercase">
              {t('favourites.myFavourites')}
            </h1>
          </div>
          {user && (
            <p className="text-secondary text-sm font-body">
              {t('favourites.savedFor')} <strong>{user.name}</strong>
              {' — '}
              {products.length === 0
                ? t('favourites.noSaved')
                : `${products.length} ${products.length === 1 ? t('favourites.item') : t('favourites.items')}`}
            </p>
          )}
        </div>

        {/* ── Not logged in ───────────────────────────────────────────────────── */}
        {!isLoggedIn() && (
          <div className="py-24 text-center">
            <span className="material-symbols-outlined text-7xl text-outline mb-6 block">
              lock
            </span>
            <p className="text-secondary font-label uppercase tracking-widest text-sm mb-2">
              {t('favourites.loginRequired')}
            </p>
            <p className="text-outline text-xs mb-6">{t('favourites.loginDesc')}</p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-primary text-white font-headline font-bold uppercase text-xs tracking-widest hover:bg-primary/90 transition-all"
            >
              {t('favourites.goBack')}
            </button>
          </div>
        )}

        {/* ── Empty state ─────────────────────────────────────────────────────── */}
        {isLoggedIn() && products.length === 0 && (
          <div className="py-24 text-center">
            <span
              className="material-symbols-outlined text-7xl text-slate-300 mb-6 block"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}
            >
              favorite
            </span>
            <p className="text-secondary font-label uppercase tracking-widest text-sm mb-2">
              {t('favourites.empty')}
            </p>
            <p className="text-outline text-xs mb-8">{t('favourites.emptyDesc')}</p>
            <button
              onClick={() => navigate('/products')}
              className="px-6 py-3 bg-primary text-white font-headline font-bold uppercase text-xs tracking-widest hover:bg-primary/90 transition-all flex items-center gap-2 mx-auto"
            >
              <span className="material-symbols-outlined text-sm">grid_view</span>
              {t('favourites.browseProducts')}
            </button>
          </div>
        )}

        {/* ── Product Grid ─────────────────────────────────────────────────────── */}
        {isLoggedIn() && products.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0">
              {products.map((product) => {
                const name = i18n.language === 'ar' ? product.name_ar : product.name_en
                const desc = i18n.language === 'ar' ? product.description_ar : product.description_en
                const catName = i18n.language === 'ar' ? product.category?.name_ar : product.category?.name_en

                return (
                  <div
                    key={product.id}
                    className="group bg-surface-container-lowest border border-outline-variant/15 flex flex-col"
                  >
                    {/* Image */}
                    <div className="aspect-[4/3] overflow-hidden bg-surface-container-high relative">
                      <img
                        src={product.images?.[0]?.image_url || 'https://via.placeholder.com/400x300'}
                        alt={name}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                      {/* Favourite toggle — always visible since we're on the saved page */}
                      <div className="absolute top-3 right-3">
                        <FavouriteButton
                          productId={product.id}
                          size="sm"
                          onUnsaved={() => handleUnsaved(product.id)}
                        />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-6 flex-grow flex flex-col">
                      <span className="text-tertiary font-label text-[10px] tracking-widest uppercase font-black mb-2">
                        {catName}
                      </span>
                      <h3 className="text-xl font-headline font-bold text-primary mb-2 tracking-tight">
                        {name}
                      </h3>
                      <p className="text-secondary text-sm font-body leading-relaxed mb-6 line-clamp-2">
                        {desc}
                      </p>
                      <div className="mt-auto pt-4 border-t border-outline-variant/10 flex justify-between items-center">
                        <span className="text-primary font-headline font-black text-sm">
                          EGP {product.price
                            ? Number(product.price).toLocaleString('en-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : 'N/A'}
                        </span>
                        <button
                          onClick={() => navigate(`/product-detail?id=${product.id}`)}
                          className="group/btn flex items-center gap-2 text-primary font-label text-xs uppercase tracking-widest font-bold hover:text-tertiary transition-colors"
                        >
                          {t('products.viewDetails')}
                          <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Browse more */}
            <div className="mt-16 pt-8 border-t border-outline-variant/10 text-center">
              <button
                onClick={() => navigate('/products')}
                className="inline-flex items-center gap-2 text-primary font-headline font-bold uppercase text-xs tracking-widest hover:text-tertiary transition-colors"
              >
                <span className="material-symbols-outlined text-sm">grid_view</span>
                {t('favourites.browseMore')}
              </button>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
