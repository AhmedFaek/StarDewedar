import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { api } from '../utils/api'
import ContentLoader from '../components/shared/ContentLoader'
import FavouriteButton from '../components/shared/FavouriteButton'

export default function Products() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [maxPrice, setMaxPrice] = useState(1000000)
  const [sortBy, setSortBy] = useState('featured')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          api.getProducts(),
          api.getCategories(),
        ])
        setProducts(productsData)
        
        const productCategories = (categoriesData || []).filter(
          (category) => String(category.type || '').toLowerCase() === 'product'
        )
        setCategories(productCategories)

        // Update maxPrice based on products if any exist
        if (productsData.length > 0) {
            const max = Math.max(...productsData.map(p => Number(p.price || 0)))
            if (max > 0) setMaxPrice(Math.ceil(max / 1000) * 1000 + 5000)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const name = (i18n.language === 'ar' ? product.name_ar : product.name_en) || ''
        const categoryId = product.category?.id || product.category_id || ''
        
        const matchesCategory = selectedCategory === 'all' || categoryId === selectedCategory
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesPrice = product.price ? Number(product.price) <= maxPrice : true

        return matchesCategory && matchesSearch && matchesPrice
      })
      .sort((a, b) => {
        if (sortBy === 'low-high') return Number(a.price) - Number(b.price)
        if (sortBy === 'high-low') return Number(b.price) - Number(a.price)
        return 0
      })
  }, [products, selectedCategory, searchTerm, maxPrice, sortBy, i18n.language])

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="flex-grow pt-32 pb-20">
        {loading ? (
          <ContentLoader variant="products" />
        ) : (

          <>
            {/* Hero */}
            <header className="relative w-full h-64 md:h-[409px] flex items-center px-4 sm:px-8 md:px-16 overflow-hidden bg-primary">
              <div className="absolute inset-0 opacity-40">
                <img alt="Industrial component" className="w-full h-full object-cover object-center" src="/images/products_hero.webp" />
              </div>
              <div className="relative z-10 max-w-4xl">
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-headline font-black text-white tracking-tighter leading-none mb-3 md:mb-4">
                  {t('products.heroTitle1')} <br className="hidden sm:block" /> {t('products.heroTitle2')}
                </h1>
                <p className="text-white font-body text-base sm:text-lg md:text-lg max-w-xl">{t('products.heroDesc')}</p>
              </div>
            </header>

            {/* Filter Bar */}
            <section className="bg-surface-container-low px-4 sm:px-8 md:px-16 py-6 border-b border-outline-variant/10">
              <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                <div className="flex flex-wrap gap-2">
                  <button
                    key="all-products"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 font-label text-[10px] uppercase tracking-widest font-bold transition-all ${
                      selectedCategory === 'all'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-surface-container-lowest text-primary hover:bg-surface-variant'
                    }`}
                  >
                    {t('products.allProducts')}
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 font-label text-[10px] uppercase tracking-widest font-bold transition-all ${
                        selectedCategory === category.id
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'bg-surface-container-lowest text-primary hover:bg-surface-variant'
                      }`}
                    >
                      {i18n.language === 'ar' ? category.name_ar : category.name_en}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                  <div className="flex flex-col gap-1 min-w-[150px]">
                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary">
                      {t('products.maxPrice')}: EGP{maxPrice.toLocaleString()}
                    </label>
                    <input type="range" min="0" max="1000000" step="1000" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-primary" />
                  </div>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-surface-container-lowest border-none px-4 py-2 font-label text-[10px] uppercase tracking-widest font-bold text-primary outline-none focus:ring-1 focus:ring-tertiary">
                    <option value="featured">{t('products.featured')}</option>
                    <option value="low-high">{t('products.priceLowHigh')}</option>
                    <option value="high-low">{t('products.priceHighLow')}</option>
                  </select>
                  <div className="relative flex-grow lg:w-64">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
                    <input type="text" placeholder={t('products.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-surface-container-lowest border-none focus:ring-1 focus:ring-tertiary px-10 py-2 font-label text-[10px] tracking-widest outline-none" />
                  </div>
                </div>
              </div>
            </section>

            {/* Product Grid */}
            <section className="px-4 sm:px-8 md:px-16 py-12">
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="group bg-surface-container-lowest border border-outline-variant/15 flex flex-col">
                      <div className="aspect-[4/3] overflow-hidden bg-surface-container-high relative">
                        <img alt={i18n.language === 'ar' ? product.name_ar : product.name_en} loading="lazy" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" src={product.images?.[0]?.image_url || 'https://via.placeholder.com/400x300'} />
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <FavouriteButton productId={product.id} size="sm" />
                        </div>
                      </div>
                      <div className="p-8 flex-grow flex flex-col">
                        <span className="text-tertiary font-label text-[10px] tracking-widest uppercase font-black mb-2">
                          {i18n.language === 'ar' ? product.category?.name_ar : product.category?.name_en}
                        </span>
                        <h3 className="text-2xl font-headline font-bold text-primary mb-3 tracking-tight">
                          {i18n.language === 'ar' ? product.name_ar : product.name_en}
                        </h3>
                        <p className="text-secondary text-sm font-body leading-relaxed mb-8 line-clamp-3">
                          {i18n.language === 'ar' ? product.description_ar : product.description_en}
                        </p>
                        <div className="mt-auto pt-4 border-t border-outline-variant/10 flex justify-between items-center">
                          <span className="text-primary font-headline font-black text-base">
                            EGP {product.price ? Number(product.price).toLocaleString('en-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
                          </span>
                          <button onClick={() => navigate(`/product-detail?id=${product.id}`)} className="group/btn flex items-center gap-2 text-primary font-label text-xs uppercase tracking-widest font-bold hover:text-tertiary transition-colors">
                            {t('products.viewDetails')}
                            <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <span className="material-symbols-outlined text-6xl text-outline mb-4">inventory_2</span>
                  <p className="text-secondary font-label uppercase tracking-widest">{t('products.noProducts')}</p>
                  <button onClick={() => { setSelectedCategory('all'); setMaxPrice(1000000); setSearchTerm(''); }} className="mt-4 text-primary font-black text-xs underline underline-offset-4 uppercase tracking-widest">
                    {t('products.resetFilters')}
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
