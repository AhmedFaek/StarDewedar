import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { api } from '../utils/api'
import PageLoader from '../components/shared/PageLoader'

export default function ProductDetail() {
  const { t, i18n } = useTranslation()
  const [product, setProduct] = useState(null)
  const [activeImage, setActiveImage] = useState('')
  const [relatedProducts, setRelatedProducts] = useState([])
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 })
  const [showMagnifier, setShowMagnifier] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleIdChange = async () => {
      setLoading(true)
      const params = new URLSearchParams(window.location.search)
      const productId = params.get('id')
      
      if (!productId) {
        setLoading(false)
        return
      }

      try {
        const foundProduct = await api.getProductById(productId)
        setProduct(foundProduct)
        console.log('Fetched product:', foundProduct)
        setActiveImage(foundProduct.images?.[0]?.image_url || '')
        
        // Fetch all products to find related ones (by category)
        const allProducts = await api.getProducts()
        const related = allProducts.filter(item => 
          item.category_id === foundProduct.category_id && item.id !== foundProduct.id
        )
        setRelatedProducts(related)
        window.scrollTo(0, 0)
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setLoading(false)
      }
    }
    handleIdChange()
    window.addEventListener('popstate', handleIdChange)
    return () => window.removeEventListener('popstate', handleIdChange)
  }, [])

  if (loading) {
    return <PageLoader label={t('common.loading') || 'Loading product'} />
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

  const allImages = product.images?.map(img => img.image_url) || []

  const handleMouseEnter = (e) => { const elem = e.currentTarget; const { width, height } = elem.getBoundingClientRect(); setImgSize({ width, height }); setShowMagnifier(true) }
  const handleMouseMove = (e) => { const elem = e.currentTarget; const { top, left } = elem.getBoundingClientRect(); setCoords({ x: e.pageX - left - window.pageXOffset, y: e.pageY - top - window.pageYOffset }) }
  const navigateToProduct = (id) => { window.history.pushState({}, '', `${window.location.pathname}?id=${id}`); window.dispatchEvent(new PopStateEvent('popstate')) }

  const name = i18n.language === 'ar' ? product.name_ar : product.name_en
  const description = i18n.language === 'ar' ? product.description_ar : product.description_en
  const categoryName = i18n.language === 'ar' ? product.category?.name_ar : product.category?.name_en

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Header />
      <main className="flex-grow pt-24 pb-20 px-4 sm:px-8 max-w-screen-2xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-24">
          {/* Gallery */}
          <div className="lg:col-span-7 grid grid-cols-6 gap-4">
            <div className="col-span-6 bg-surface-container-low aspect-[16/10] relative overflow-hidden cursor-crosshair group border border-outline-variant/10" onMouseEnter={handleMouseEnter} onMouseMove={handleMouseMove} onMouseLeave={() => setShowMagnifier(false)}>
              <img alt={name} className="w-full h-full object-cover" src={activeImage || 'https://via.placeholder.com/800x500'} />
              {showMagnifier && (
                <div style={{ position: "absolute", pointerEvents: "none", height: "250px", width: "250px", top: `${coords.y - 125}px`, left: `${coords.x - 125}px`, backgroundImage: `url('${activeImage}')`, backgroundRepeat: "no-repeat", backgroundSize: `${imgSize.width * 2.5}px ${imgSize.height * 2.5}px`, backgroundPosition: `${-coords.x * 2.5 + 125}px ${-coords.y * 2.5 + 125}px`, border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", borderRadius: "2px", zIndex: 10 }} />
              )}
            </div>
            <div className="col-span-6 flex flex-wrap gap-4">
              {allImages.map((image, idx) => (
                <button key={idx} className={`w-20 h-20 bg-surface-container-low overflow-hidden border-2 transition-all ${activeImage === image ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`} onClick={() => setActiveImage(image)}>
                  <img src={image} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="lg:col-span-5 space-y-10 lg:sticky lg:top-32">
            <div className="space-y-4">
              <span className="inline-block bg-primary/10 text-primary px-3 py-1 font-label text-[10px] font-bold tracking-[0.2em] uppercase">{categoryName}</span>
              <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tighter leading-none text-primary uppercase italic">{name}</h1>
              <p className="text-secondary/80 leading-relaxed font-body text-lg max-w-xl">{description}</p>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-tertiary font-label text-[14px] tracking-widest uppercase font-black mb-1">{t('productDetail.pricePoint')}</p>
                <p className="text-4xl font-headline font-black text-primary">
                    EGP {product.price ? Number(product.price).toLocaleString('en-EG', { minimumFractionDigits: 2 }) : 'N/A'}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={() => window.navigateTo('quote', product.id)} className="w-full bg-primary text-white py-5 text-xs font-headline font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-primary/90 transition-all">
                  {t('productDetail.requestQuote')}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
                {product.catalogs?.[0] && (
                  <a href={product.catalogs[0].file_url} target="_blank" rel="noopener noreferrer" className="w-full border border-outline-variant text-primary py-4 text-[10px] font-headline font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-3 hover:bg-surface-container-high transition-all">
                    <span className="material-symbols-outlined text-base">download</span>
                    {t('productDetail.dataSheet')}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="pt-20 border-t border-outline-variant/15">
            <h2 className="text-3xl font-headline font-black text-primary uppercase italic mb-12">{t('productDetail.relatedProducts')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((item) => (
                <div key={item.id} onClick={() => navigateToProduct(item.id)} className="group cursor-pointer">
                  <div className="aspect-[4/3] bg-surface-container-low overflow-hidden mb-5 border border-outline-variant/10">
                    <img src={item.images?.[0]?.image_url || 'https://via.placeholder.com/400x300'} alt={i18n.language === 'ar' ? item.name_ar : item.name_en} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />
                  </div>
                  <p className="text-[9px] font-bold tracking-widest uppercase text-tertiary mb-1">
                      {i18n.language === 'ar' ? item.category?.name_ar : item.category?.name_en}
                  </p>
                  <h3 className="text-lg font-headline font-bold text-primary leading-tight group-hover:text-primary/70 transition-colors uppercase">
                      {i18n.language === 'ar' ? item.name_ar : item.name_en}
                  </h3>
                  <p className="text-sm font-body mt-2 text-secondary font-bold">
                      EGP {item.price ? Number(item.price).toLocaleString('en-EG') : 'N/A'}
                  </p>
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
