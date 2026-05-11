import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { api } from '../../utils/api'
import ContentLoader from '../shared/ContentLoader'


export default function ProductCardsGrid() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
  }, [])

  if (loading) {
    return <ContentLoader rows={2} />
  }

  return (
    <section className="bg-surface-container-low py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-12 md:mb-16 gap-6 sm:gap-8">
          <div>
            <h2 className="font-headline text-3xl sm:text-4xl font-bold tracking-tighter text-primary uppercase">
              {t('productCards.sectionTitle')}
            </h2>
            <p className="text-outline mt-2 uppercase text-xs tracking-widest font-label">
              {t('productCards.sectionSubtitle')}
            </p>
          </div>
          <button onClick={() => navigate('/products')} className="flex items-center gap-2 font-label font-bold uppercase text-xs tracking-widest text-primary hover:text-tertiary transition-colors">
            {t('productCards.viewCatalog')}{' '}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {products.map((product, index) => {
            const isMiddle = index === 1
            const name = i18n.language === 'ar' ? product.name_ar : product.name_en
            const description = i18n.language === 'ar' ? product.description_ar : product.description_en
            const categoryName = i18n.language === 'ar' ? product.category?.name_ar : product.category?.name_en

            return (
              <div
                key={product.id}
                onClick={() => navigate(`/product-detail?id=${product.id}`)}
                className={`${isMiddle ? 'bg-primary' : 'bg-surface-container-lowest'} group cursor-pointer overflow-hidden flex flex-col transition-transform hover:scale-105`}
              >
                {/* Image Container */}
                <div className="h-48 sm:h-64 md:h-80 overflow-hidden">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={product.images?.[0]?.image_url || 'https://via.placeholder.com/400x300'}
                    alt={name}
                  />
                </div>

                {/* Content Container */}
                <div
                  className={`p-5 sm:p-6 md:p-8 flex-grow ${isMiddle ? 'voltage-gradient text-white' : 'text-on-surface'}`}
                >
                  <span className="text-[9px] sm:text-[10px] font-label font-bold uppercase tracking-[0.2em] block mb-3 sm:mb-4 opacity-75">
                    {categoryName}
                  </span>

                  <h3 className="font-headline text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">{name}</h3>

                  <p className={`mb-6 sm:mb-8 text-sm sm:text-base line-clamp-3 ${isMiddle ? 'text-on-primary-container' : 'text-on-surface-variant'}`}>
                    {description}
                  </p>

                  <div className="flex justify-between items-center mt-auto">
                    <span className="font-headline font-black text-sm">
                        EGP {product.price ? Number(product.price).toLocaleString() : 'N/A'}
                    </span>
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
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
