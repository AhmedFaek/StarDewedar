import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { setPageMeta, setJsonLd, removeJsonLd, buildUrl, truncate } from '../utils/seo'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { api } from '../utils/api'
import ContentLoader from '../components/shared/ContentLoader'
import FavouriteButton from '../components/shared/FavouriteButton'
import { useCompare } from '../utils/compareContext'
import { useNotification } from '../hooks/useNotification.js'

export default function ProductDetail() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addToCompare, removeFromCompare, isInCompare } = useCompare()
  const { showWarning } = useNotification()
  const [product, setProduct] = useState(null)
  const [activeImage, setActiveImage] = useState('')
  const [relatedProducts, setRelatedProducts] = useState([])
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 })
  const [showMagnifier, setShowMagnifier] = useState(false)
  const [loading, setLoading] = useState(true)
  const rectRef = useRef({ top: 0, left: 0 })

  const productId = searchParams.get('id')

  useEffect(() => {
    if (!productId) {
      setLoading(false)
      return
    }
    setLoading(true)
    ;(async () => {
      try {
        const foundProduct = await api.getProductById(productId)
        setProduct(foundProduct)
        setActiveImage(foundProduct.images?.[0]?.image_url || '')
        const allProducts = await api.getProducts()
        const related = allProducts.filter((item) => item.category_id === foundProduct.category_id && item.id !== foundProduct.id)
        setRelatedProducts(related)
        window.scrollTo(0, 0)
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setLoading(false)
      }
    })()
  }, [productId])

  useEffect(() => {
    if (!product) return

    const lang = i18n.language === 'ar' ? 'ar' : 'en'
    const isAr = lang === 'ar'
    const productName = isAr ? product.name_ar : product.name_en
    const productDesc = isAr ? product.description_ar : product.description_en
    const categoryLabel = isAr ? product.category?.name_ar : product.category?.name_en
    const productImage = product.images?.[0]?.image_url || null

    setPageMeta({
      title: productName
        ? `${productName} | Star Dewedar`
        : 'Product | Star Dewedar',
      description: truncate(productDesc) || (
        isAr
          ? `اكتشف ${productName} من شركة ستار ديودار. اطلب عرض سعر أو تنزيل الكتالوج الآن.`
          : `Discover ${productName} from Star Dewedar Co. Request a quote or download the datasheet.`
      ),
      canonical: buildUrl(`/product-detail?id=${product.id}`),
      ogType: 'website',
      ogImage: productImage,
      lang,
    })

    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: buildUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Products', item: buildUrl('/products') },
        ...(categoryLabel ? [{ '@type': 'ListItem', position: 3, name: categoryLabel, item: buildUrl(`/products?category=${product.category_id}`) }] : []),
        { '@type': 'ListItem', position: categoryLabel ? 4 : 3, name: productName, item: buildUrl(`/product-detail?id=${product.id}`) },
      ],
    }

    const productSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': buildUrl(`/product-detail?id=${product.id}#product`),
      name: productName,
      description: truncate(productDesc, 500) || undefined,
      ...(productImage ? { image: [productImage] } : {}),
      ...(categoryLabel ? { category: categoryLabel } : {}),
      brand: {
        '@type': 'Brand',
        name: 'Star Dewedar',
      },
      ...(product.price ? {
        offers: {
          '@type': 'Offer',
          price: String(product.price),
          priceCurrency: 'EGP',
          availability: 'https://schema.org/InStock',
          url: buildUrl(`/product-detail?id=${product.id}`),
          seller: {
            '@id': buildUrl('/#organization'),
          },
        },
      } : {
        seller: {
          '@id': buildUrl('/#organization'),
        },
      }),
    }

    setJsonLd(`product-${product.id}`, productSchema)
    setJsonLd(`product-${product.id}-breadcrumb`, breadcrumb)

    return () => {
      removeJsonLd(`product-${product.id}`)
      removeJsonLd(`product-${product.id}-breadcrumb`)
    }
  }, [product, i18n.language])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-surface text-on-surface">
        <Header />
        <main className="flex-grow"><ContentLoader variant="product-detail" /></main>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <p>{t('products.noProducts')}</p>
        </main>
        <Footer />
      </div>
    )
  }

  const allImages = product.images?.map((img) => img.image_url) || []

  const handleCompareClick = () => {
    if (isInCompare(product.id)) {
      removeFromCompare(product.id)
      return
    }

    const result = addToCompare(product)
    if (result.error === 'max') {
      showWarning(t('notifications.compareLimitWarning'))
    } else if (result.error === 'category') {
      showWarning(t('notifications.compareCategoryWarning'))
    }
  }

  const handleMouseEnter = (e) => {
    const elem = e.currentTarget
    const rect = elem.getBoundingClientRect()
    rectRef.current = {
      top: rect.top + window.pageYOffset,
      left: rect.left + window.pageXOffset,
    }
    setImgSize({ width: rect.width, height: rect.height })
    setShowMagnifier(true)
  }

  const handleMouseMove = (e) => {
    const { top, left } = rectRef.current
    setCoords({
      x: e.pageX - left,
      y: e.pageY - top,
    })
  }

  const name = i18n.language === 'ar' ? product.name_ar : product.name_en
  const description = i18n.language === 'ar' ? product.description_ar : product.description_en
  const navigateToProduct = (id) => navigate(`/product-detail?id=${id}`)
  const categoryName = i18n.language === 'ar' ? product.category?.name_ar : product.category?.name_en

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Header />
      <main className="flex-grow pt-32 pb-20 px-4 sm:px-8 max-w-screen-2xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-20">
          {/* Main Visuals Column */}
          <div className="lg:col-span-7 grid grid-cols-6 gap-4">
            <div
              className="col-span-6 bg-white aspect-[16/10] relative overflow-hidden cursor-crosshair group border border-slate-200/80 shadow-xs p-6 sm:p-8 flex items-center justify-center"
              onMouseEnter={handleMouseEnter}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setShowMagnifier(false)}
            >
              <img
                alt={name}
                className="w-full h-full object-contain select-none"
                src={activeImage || 'https://via.placeholder.com/800x500'}
              />
              {showMagnifier && (
                <div
                  style={{
                    position: 'absolute',
                    pointerEvents: 'none',
                    height: '240px',
                    width: '240px',
                    top: `${coords.y - 120}px`,
                    left: `${coords.x - 120}px`,
                    backgroundImage: `url('${activeImage}')`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: `${imgSize.width * 2}px ${imgSize.height * 2}px`,
                    backgroundPosition: `${-coords.x * 2 + 120}px ${-coords.y * 2 + 120}px`,
                    border: '1px solid rgba(27,117,186,0.3)',
                    boxShadow: '0 12px 36px rgba(0,0,0,0.22)',
                    borderRadius: '2px',
                    backgroundColor: '#fff',
                    zIndex: 10,
                  }}
                />
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="col-span-6 flex flex-wrap gap-3">
                {allImages.map((image, idx) => (
                  <button
                    key={idx}
                    className={`w-16 h-16 sm:w-20 sm:h-20 bg-white p-1.5 overflow-hidden border transition-all ${
                      activeImage === image
                        ? 'border-primary ring-1 ring-primary/30 shadow-xs'
                        : 'border-slate-200/80 opacity-70 hover:opacity-100 hover:border-slate-300'
                    }`}
                    onClick={() => setActiveImage(image)}
                  >
                    <img src={image} alt={`Thumb ${idx}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details & Actions Column */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-32">
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="inline-flex items-center bg-primary/10 text-primary px-3 py-1 font-label text-[10px] font-bold tracking-[0.2em] uppercase leading-none">
                  {categoryName}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-[1.85rem] font-headline font-black tracking-tight leading-snug text-deep-blue uppercase">
                {name}
              </h1>
              <p className="text-slate-600 leading-relaxed font-body text-sm sm:text-base max-w-xl">
                {description}
              </p>
            </div>

            <div className="space-y-6 pt-1 border-t border-slate-100">
              <div>
                <p className="text-slate-400 font-label text-[11px] tracking-widest uppercase font-bold mb-1.5">
                  {t('productDetail.pricePoint')}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-500 font-headline uppercase tracking-wider">
                    {i18n.language === 'ar' ? 'ج.م' : 'EGP'}
                  </span>
                  <span className="text-2xl sm:text-3xl font-headline font-black text-deep-blue tracking-tight">
                    {product.price ? Number(product.price).toLocaleString('en-EG', { minimumFractionDigits: 2 }) : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Action Buttons Consolidated */}
              <div className="flex flex-col gap-2.5">
                {/* Primary CTA: Request a Quote */}
                <button
                  onClick={() => navigate(`/request-quote?productId=${product.id}`)}
                  className="w-full bg-primary text-white py-3.5 px-6 text-xs font-headline font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary-dark shadow-xs transition-all group"
                >
                  <span>{t('productDetail.requestQuote')}</span>
                  <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180">
                    arrow_forward
                  </span>
                </button>

                {/* Secondary Actions Side-by-Side: Compare & Favorite */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleCompareClick}
                    className={`w-full py-3 px-3 text-[11px] font-headline font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                      isInCompare(product.id)
                        ? 'bg-primary/10 border-primary text-primary shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-primary hover:text-primary hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {isInCompare(product.id) ? 'check_circle' : 'compare_arrows'}
                    </span>
                    <span className="truncate">
                      {isInCompare(product.id) ? t('compare.button.alreadyIn') : t('compare.button.add')}
                    </span>
                  </button>

                  <FavouriteButton
                    productId={product.id}
                    size="sm"
                    showLabel={true}
                    allowGuestPrompt={true}
                    className="!w-full !h-auto !rounded-none py-3 px-3 border border-slate-200 !bg-white hover:!bg-slate-50 text-slate-700 hover:text-red-500 font-headline text-[11px] font-bold uppercase tracking-wider gap-2 flex-row transition-all shadow-none"
                  />
                </div>

                {/* Datasheet Download */}
                {product.catalogs?.[0] && (
                  <a
                    href={product.catalogs[0].file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full border border-slate-200 bg-white text-slate-700 hover:text-primary hover:border-primary hover:bg-slate-50 py-2.5 px-4 text-[11px] font-headline font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all mt-0.5"
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                    <span>{t('productDetail.dataSheet')}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="pt-16 border-t border-slate-200/80">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-[11px] font-bold tracking-widest uppercase text-primary font-label mb-1">
                  {i18n.language === 'ar' ? 'تشكيلة مماثلة' : 'Engineered Systems'}
                </p>
                <h2 className="text-2xl font-headline font-black text-deep-blue uppercase tracking-tight">
                  {t('productDetail.relatedProducts')}
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigateToProduct(item.id)}
                  className="group cursor-pointer bg-white border border-slate-200/80 p-4 transition-all duration-300 hover:shadow-md hover:border-primary/40 flex flex-col"
                >
                  <div className="aspect-[4/3] bg-slate-50 overflow-hidden mb-4 p-4 flex items-center justify-center">
                    <img
                      src={item.images?.[0]?.image_url || 'https://via.placeholder.com/400x300'}
                      alt={i18n.language === 'ar' ? item.name_ar : item.name_en}
                      loading="lazy"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1 font-label">
                    {i18n.language === 'ar' ? item.category?.name_ar : item.category?.name_en}
                  </p>
                  <h3 className="text-sm font-headline font-bold text-deep-blue leading-snug group-hover:text-primary transition-colors uppercase line-clamp-2 min-h-[2.5rem]">
                    {i18n.language === 'ar' ? item.name_ar : item.name_en}
                  </h3>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-baseline gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {i18n.language === 'ar' ? 'ج.م' : 'EGP'}
                    </span>
                    <span className="text-sm font-headline font-black text-deep-blue">
                      {item.price ? Number(item.price).toLocaleString('en-EG') : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}

