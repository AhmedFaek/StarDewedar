import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { setPageMeta, setJsonLd, removeJsonLd, buildUrl } from '../utils/seo'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { api } from '../utils/api'
import ContentLoader from '../components/shared/ContentLoader'
import FavouriteButton from '../components/shared/FavouriteButton'

export default function Products() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || 'all')
  const [searchTerm, setSearchTerm] = useState('')
  const [maxPrice, setMaxPrice] = useState(1000000)
  const [sortBy, setSortBy] = useState('featured')
  const [loading, setLoading] = useState(true)

  // Auto-sync selectedCategory whenever URL ?category= changes or categories load
  useEffect(() => {
    const catParam = searchParams.get('category')
    if (catParam) {
      if (catParam === 'all') {
        setSelectedCategory('all')
      } else {
        const match = categories.find(
          (c) =>
            String(c.id) === String(catParam) ||
            (c.name_en && c.name_en.toLowerCase() === catParam.toLowerCase()) ||
            (c.name_ar && c.name_ar.toLowerCase() === catParam.toLowerCase())
        )
        if (match) {
          setSelectedCategory(match.id)
        } else {
          setSelectedCategory(catParam)
        }
      }
    } else {
      setSelectedCategory('all')
    }
  }, [searchParams, categories])

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

  useEffect(() => {
    const lang = i18n.language === 'ar' ? 'ar' : 'en'
    const isAr = lang === 'ar'

    // If a category is selected, use its name in the title
    const activeCategory = categories.find((c) => c.id === selectedCategory)
    const categoryName = activeCategory
      ? (isAr ? activeCategory.name_ar : activeCategory.name_en)
      : null

    const title = categoryName
      ? (isAr
          ? `${categoryName} | منتجات ستار ديودار`
          : `${categoryName} | Star Dewedar Products`)
      : (isAr ? 'المنتجات | ستار ديودار' : 'Products | Star Dewedar')

    const description = categoryName
      ? (isAr
          ? `تصفح منتجات ${categoryName} من شركة ستار ديودار. معدات جهد منخفض عالية الجودة للمشاريع الصناعية والتجارية.`
          : `Browse ${categoryName} products from Star Dewedar Co. High-quality low-voltage electrical equipment for industrial and commercial projects.`)
      : (isAr
          ? 'تصفح كتالوج منتجات شركة ستار ديودار. لوحات توزيع، أنظمة تحكم، ومعدات كهربائية صناعية.'
          : 'Browse Star Dewedar Co.’s complete product catalog. Distribution panels, control systems, and industrial electrical equipment for every project.')

    const canonicalPath = selectedCategory !== 'all'
      ? `/products?category=${selectedCategory}`
      : '/products'

    setPageMeta({
      title,
      description,
      canonical: buildUrl(canonicalPath),
      ogType: 'website',
      lang,
    })

    setJsonLd('products-page', {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': buildUrl('/products#webpage'),
      name: isAr ? 'المنتجات — ستار ديودار' : 'Products — Star Dewedar',
      url: buildUrl('/products'),
      publisher: {
        '@id': buildUrl('/#organization'),
      },
    })

    return () => removeJsonLd('products-page')
  }, [i18n.language, selectedCategory, categories])

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId)
    const newParams = new URLSearchParams(searchParams)
    if (catId === 'all') {
      newParams.delete('category')
    } else {
      newParams.set('category', catId)
    }
    setSearchParams(newParams, { replace: true })
  }

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const name = (i18n.language === 'ar' ? product.name_ar : product.name_en) || ''
        const categoryId = product.category?.id || product.category_id || ''
        const categoryNameEn = product.category?.name_en || ''
        const categoryNameAr = product.category?.name_ar || ''
        
        const matchesCategory =
          selectedCategory === 'all' ||
          String(categoryId) === String(selectedCategory) ||
          categoryNameEn.toLowerCase() === String(selectedCategory).toLowerCase() ||
          categoryNameAr.toLowerCase() === String(selectedCategory).toLowerCase()

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
            <header className="relative w-full h-64 md:h-[409px] flex items-center px-4 sm:px-8 md:px-16 overflow-hidden bg-deep-blue">
              <div className="absolute inset-0 opacity-40">
                <img alt="Industrial component" className="w-full h-full object-cover object-center" src="/images/products_hero.webp" />
              </div>
              <div className="relative z-10 max-w-4xl">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-headline font-black text-white tracking-tight leading-tight mb-3 md:mb-4">
                  {t('products.heroTitle1')} <br className="hidden sm:block" /> {t('products.heroTitle2')}
                </h1>
                <p className="text-white font-body text-sm sm:text-base md:text-lg max-w-xl">{t('products.heroDesc')}</p>
              </div>
            </header>

            {/* Filter Bar */}
            <section className="bg-surface-container-low px-4 sm:px-8 md:px-16 py-5 border-b border-outline-variant/15">
              <div className="max-w-7xl mx-auto space-y-3.5">
                {/* Row 1: Category Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                  <button
                    key="all-products"
                    onClick={() => handleCategorySelect('all')}
                    className={`shrink-0 px-4 py-2 font-label text-[11px] uppercase tracking-wider font-bold transition-all border ${
                      selectedCategory === 'all'
                        ? 'bg-primary border-primary text-white shadow-xs'
                        : 'bg-white border-slate-200 text-deep-blue hover:border-primary/50 hover:text-primary hover:bg-slate-50'
                    }`}
                  >
                    {t('products.allProducts')}
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className={`shrink-0 px-4 py-2 font-label text-[11px] uppercase tracking-wider font-bold transition-all border ${
                        String(selectedCategory) === String(category.id)
                          ? 'bg-primary border-primary text-white shadow-xs'
                          : 'bg-white border-slate-200 text-deep-blue hover:border-primary/50 hover:text-primary hover:bg-slate-50'
                      }`}
                    >
                      {i18n.language === 'ar' ? category.name_ar : category.name_en}
                    </button>
                  ))}
                </div>

                {/* Row 2: Search Input & Controls Toolbar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-slate-200/60">
                  {/* Search Bar */}
                  <div className="relative flex-grow max-w-md">
                    <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder={t('products.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary ps-9 pe-8 py-2 text-xs font-body text-deep-blue placeholder:text-slate-400 outline-none transition-colors"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-deep-blue text-xs"
                        aria-label="Clear search"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    )}
                  </div>

                  {/* Right Side: Price Slider & Sort Dropdown */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
                    {/* Price Slider */}
                    <div className="flex items-center gap-2.5 bg-white border border-slate-200 px-3 py-2 min-w-[210px]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                        {t('products.maxPrice')}:
                      </span>
                      <span className="text-[11px] font-black text-primary whitespace-nowrap">
                        EGP {maxPrice.toLocaleString()}
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="1000000"
                        step="1000"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        className="w-24 sm:w-28 accent-primary cursor-pointer"
                        aria-label={t('products.maxPrice')}
                      />
                    </div>

                    {/* Sort By Dropdown */}
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-white border border-slate-200 ps-3.5 pe-8 py-2 font-headline text-[11px] uppercase tracking-wider font-bold text-deep-blue outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer appearance-none"
                        aria-label="Sort products"
                      >
                        <option value="featured">{t('products.featured')}</option>
                        <option value="low-high">{t('products.priceLowHigh')}</option>
                        <option value="high-low">{t('products.priceHighLow')}</option>
                      </select>
                      <span className="material-symbols-outlined absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                        expand_more
                      </span>
                    </div>
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
                        <img alt={i18n.language === 'ar' ? product.name_ar : product.name_en} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={product.images?.[0]?.image_url || 'https://via.placeholder.com/400x300'} />
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <FavouriteButton productId={product.id} size="sm" />
                        </div>
                      </div>
                      <div className="p-8 flex-grow flex flex-col">
                        <span className="text-tertiary font-label text-[10px] tracking-widest uppercase font-black mb-2">
                          {i18n.language === 'ar' ? product.category?.name_ar : product.category?.name_en}
                        </span>
                        <h3 className="text-2xl font-headline font-bold text-on-surface mb-3 tracking-tight">
                          {i18n.language === 'ar' ? product.name_ar : product.name_en}
                        </h3>
                        <p className="text-secondary text-sm font-body leading-relaxed mb-8 line-clamp-3">
                          {i18n.language === 'ar' ? product.description_ar : product.description_en}
                        </p>
                        <div className="mt-auto pt-4 border-t border-outline-variant/10 flex justify-between items-center">
                          <span className="text-on-surface font-headline font-black text-base">
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
