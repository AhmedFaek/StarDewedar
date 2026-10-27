import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { api } from '../../utils/api'
import ContentLoader from '../shared/ContentLoader'

export default function ProductCardsGrid() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const containerRef = useRef(null)
  const [hasIntersected, setHasIntersected] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasIntersected(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!hasIntersected) return
    const fetchProducts = async () => {
      try {
        const data = await api.getProducts()
        setProducts(data.slice(0, 3)) // Show only first 3
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [hasIntersected])

  if (loading && !hasIntersected) {
    // Render a minimal placeholder to reserve layout height before intersection
    return <div ref={containerRef} className="min-h-[400px]" />
  }

  if (loading) {
    return (
      <div ref={containerRef}>
        <ContentLoader rows={2} />
      </div>
    )
  }

  return (
    <section className="bg-surface-container-low py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-8 sm:mb-10 gap-4 sm:gap-6">
          <div>
            <h2 className="font-headline text-xl sm:text-2xl md:text-3xl lg:text-[2rem] font-bold tracking-tight text-deep-blue uppercase leading-snug">
              {t('productCards.sectionTitle')}
            </h2>
            <p className="text-slate-500 mt-1 uppercase text-xs tracking-widest font-label font-semibold">
              {t('productCards.sectionSubtitle')}
            </p>
          </div>
          <button 
            onClick={() => navigate('/products')} 
            className="group inline-flex items-center gap-1.5 font-headline font-bold uppercase text-xs tracking-wider text-primary hover:text-primary-dark transition-colors shrink-0"
          >
            <span>{t('productCards.viewCatalog')}</span>
            <span className="material-symbols-outlined text-sm rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {products.map((product, index) => {
            const isMiddle = index === 1
            const name = i18n.language === 'ar' ? product.name_ar : product.name_en
            const description = i18n.language === 'ar' ? product.description_ar : product.description_en
            const categoryName = i18n.language === 'ar' ? product.category?.name_ar : product.category?.name_en

            return (
              <div
                key={product.id}
                onClick={() => navigate(`/product-detail?id=${product.id}`)}
                className={`group cursor-pointer overflow-hidden flex flex-col transition-all duration-300 border ${
                  isMiddle
                    ? 'bg-primary border-primary text-white shadow-md hover:shadow-xl hover:-translate-y-1'
                    : 'bg-white border-slate-200/80 text-deep-blue shadow-xs hover:border-primary/50 hover:shadow-lg hover:-translate-y-1'
                }`}
              >
                {/* Image Container - compact and well-framed so the entire product fits */}
                <div className="h-44 sm:h-48 md:h-52 bg-white flex items-center justify-center p-3 sm:p-4 overflow-hidden border-b border-slate-100/60">
                  <img
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    src={product.images?.[0]?.image_url || 'https://via.placeholder.com/400x300'}
                    alt={name}
                    loading="lazy"
                  />
                </div>

                {/* Content Container */}
                <div className="p-4 sm:p-5 flex-grow flex flex-col">
                  <span className={`text-[10px] font-label font-bold uppercase tracking-wider block mb-1.5 ${
                    isMiddle ? 'text-white/80' : 'text-primary'
                  }`}>
                    {categoryName}
                  </span>

                  <h3 className={`font-headline text-base sm:text-lg font-bold mb-2 line-clamp-1 tracking-tight ${
                    isMiddle ? 'text-white' : 'text-deep-blue'
                  }`}>
                    {name}
                  </h3>

                  <p className={`text-xs sm:text-[13px] line-clamp-2 leading-relaxed mb-4 ${
                    isMiddle ? 'text-white/85' : 'text-slate-600'
                  }`}>
                    {description}
                  </p>

                  <div className={`flex justify-between items-center pt-3 mt-auto border-t ${
                    isMiddle ? 'border-white/20' : 'border-slate-100'
                  }`}>
                    <span className={`font-headline font-black text-xs sm:text-sm ${
                      isMiddle ? 'text-white' : 'text-deep-blue'
                    }`}>
                      EGP {product.price ? Number(product.price).toLocaleString() : 'N/A'}
                    </span>
                    <span className={`material-symbols-outlined text-base rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 ${
                      isMiddle ? 'text-white' : 'text-primary'
                    }`}>
                      arrow_forward
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
