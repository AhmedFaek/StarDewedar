import { useEffect, useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export default function ProductDetail() {
  const [product, setProduct] = useState(null)
  const [activeImage, setActiveImage] = useState('')
  const [relatedProducts, setRelatedProducts] = useState([])
  
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);

  const productDatabase = {
    'ax-90': {
      id: 'ax-90',
      name: 'AX-Series Distribution Hub',
      category: 'Lighting',
      price: 4250.00,
      catalogUrl: '/catalogs/ax-series-hub.pdf',
      longDescription: 'The AX-Series Distribution Hub represents the pinnacle of industrial power management technology. Engineered to handle the most demanding automation environments, this system combines modular flexibility with exceptional reliability.',
      mainImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8nS1LP4Rhj0Z8ixlFMJ9t1QMuX5wpo1I2XJBCnRVYFjJuQfb6gcYihSXCWYgA3Rx_rxg34wm7WquftKjjTHw847g9g6BVtJIfiWN6QDiTUwt7jI2oe25V5R-nVcJs1nJN-PbrSGbnzGsmIi4acvlHHXqYLUjTEwjvG1K6ew4zX4njsHB6u7mXmlVsw6ta83-CuHxal2-Sc2ANsaIZTTA8I0lTA9pY1zNkq46TFtLrfJmj0E6RIHGGsMD0DiqDG8Msz2YEYbZAD8wz',
      detailImages: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBnrwnBy7tuptrkYBIS5Ezs6g2xWsrC0-kf8ljTTkaIxFE_KJ5fOiXBprWF9YBD2cXEPMFhq7dC7FFHEE0_NS-bYBVz9v3NXvupwgCLcVnCTwURaQl1dwoJRnYd0WLA_cZr1BRkirMYZmjzpy2OGRb5X2OQ6-hcnMAHLolTxnL3aks2J-kW4ue8KorrbL1qniKA6Xa4fYRe-oJQEMhVPBfmMgkuxuJag8FHb8uRWHrVho5pJQn-ylvmsAIBCEEd_7uaz-VKjcLlMdZT',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCCNUTbIbwAytpZESOD-SJAHeexj3oMopOpA8HrYWuWiG3pAkJ7NklBI9zSyJIW15rbcdZVi1G9Jbn9_VFh9K81D1b3nmmiPa7GvJN3aQa3z3i7lygCf_vXCYGf9nNZrdnVFnmlLbzkNNt5dKkckLKUT7WQpYopc25tAR7YVBVUjnom82eYanGZ5OKJxsntYgU4RCqv7xnJWA-lSAIkEeqGR84CDiOksb3EdwDAbA3XuP7VnCvZCnSbfgAU3jN1ATeK53v4aEdlrSXP',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAYgRRuRit-eA5OnDhscObtvxvI6qON12NxFnMbavWNDUrGHCh6cST00ZehoAIKO0ewpRMFHjwKeexhbwtPQzoBHtVvXKE82OzHZlwq-xM-aw_-UcbGyL0_ag4zaHcb8Hi_V3zvuD4DKRREramSTi91x4zwMpcIkaozcSMjyI31pEjgMzzuMy6GjP5EFEk_I6MRFGmN2J92V3QUdhRONJEYQAWiuXl0qIHOSxNQwFA-tdpXZekEIn2cV-T6tjEpqD4ZJHZKqh6KhgTF'
      ],
    },
    'lum-tx500': {
      id: 'lum-tx500',
      name: 'Titan High-Bay Luminaire',
      category: 'Lighting',
      price: 850.00,
      catalogUrl: '/catalogs/titan-high-bay.pdf',
      longDescription: 'The Titan High-Bay Luminaire revolutionizes industrial lighting with cutting-edge LED technology and intelligent thermal management. Designed specifically for high-bay applications.',
      mainImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBb7fNIy_bV5M-CHPo75Z6kp6x309j-H2OITswYwiDMGw3FsshUC_GisqZcYmeCl3c_eyendYoErnwxL6k0I0Qocz4nNo-LCeUMANaqe852FfqIGy_7HL4_AZ389mFAzjllaOeGaum6gBCZHMszSi4df_VqQVpdUFSRZJZkEhA0i6EBinLs7k9b1GKZwHBHbHotWEFArIua1mtBLQlngEMJjywqDl-kWA3OmMkn09j1qkx5MsbfCdE-pEjNwTbonbGyXSaAjPPDV_gp',
      detailImages: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBnrwnBy7tuptrkYBIS5Ezs6g2xWsrC0-kf8ljTTkaIxFE_KJ5fOiXBprWF9YBD2cXEPMFhq7dC7FFHEE0_NS-bYBVz9v3NXvupwgCLcVnCTwURaQl1dwoJRnYd0WLA_cZr1BRkirMYZmjzpy2OGRb5X2OQ6-hcnMAHLolTxnL3aks2J-kW4ue8KorrbL1qniKA6Xa4fYRe-oJQEMhVPBfmMgkuxuJag8FHb8uRWHrVho5pJQn-ylvmsAIBCEEd_7uaz-VKjcLlMdZT',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCCNUTbIbwAytpZESOD-SJAHeexj3oMopOpA8HrYWuWiG3pAkJ7NklBI9zSyJIW15rbcdZVi1G9Jbn9_VFh9K81D1b3nmmiPa7GvJN3aQa3z3i7lygCf_vXCYGf9nNZrdnVFnmlLbzkNNt5dKkckLKUT7WQpYopc25tAR7YVBVUjnom82eYanGZ5OKJxsntYgU4RCqv7xnJWA-lSAIkEeqGR84CDiOksb3EdwDAbA3XuP7VnCvZCnSbfgAU3jN1ATeK53v4aEdlrSXP'
      ],
    }
  }

  // Load product and filter related items
  useEffect(() => {
    const handleIdChange = () => {
      const params = new URLSearchParams(window.location.search)
      const productId = params.get('id') || 'ax-90'
      const foundProduct = productDatabase[productId] || productDatabase['ax-90']
      
      setProduct(foundProduct)
      setActiveImage(foundProduct.mainImage)

      // Filter logic: same category, different ID
      const related = Object.values(productDatabase).filter(
        item => item.category === foundProduct.category && item.id !== foundProduct.id
      )
      setRelatedProducts(related)
      window.scrollTo(0, 0)
    }

    handleIdChange()
    window.addEventListener('popstate', handleIdChange)
    return () => window.removeEventListener('popstate', handleIdChange)
  }, [])

  if (!product) return null

  const allImages = [product.mainImage, ...product.detailImages]

  const handleMouseEnter = (e) => {
    const elem = e.currentTarget;
    const { width, height } = elem.getBoundingClientRect();
    setImgSize({ width, height });
    setShowMagnifier(true);
  };

  const handleMouseMove = (e) => {
    const elem = e.currentTarget;
    const { top, left } = elem.getBoundingClientRect();
    const x = e.pageX - left - window.pageXOffset;
    const y = e.pageY - top - window.pageYOffset;
    setCoords({ x, y });
  };

  const navigateToProduct = (id) => {
    const newUrl = `${window.location.pathname}?id=${id}`
    window.history.pushState({}, '', newUrl)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Header />

      <main className="flex-grow pt-24 pb-20 px-4 sm:px-8 max-w-screen-2xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-24">
          
          {/* Gallery Section */}
          <div className="lg:col-span-7 grid grid-cols-6 gap-4">
            <div 
              className="col-span-6 bg-surface-container-low aspect-[16/10] relative overflow-hidden cursor-crosshair group border border-outline-variant/10"
              onMouseEnter={handleMouseEnter}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setShowMagnifier(false)}
            >
              <img
                alt={product.name}
                className="w-full h-full object-cover"
                src={activeImage}
              />
              
              {showMagnifier && (
                <div
                  style={{
                    position: "absolute",
                    pointerEvents: "none",
                    height: "250px",
                    width: "250px",
                    top: `${coords.y - 125}px`,
                    left: `${coords.x - 125}px`,
                    backgroundImage: `url('${activeImage}')`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: `${imgSize.width * 2.5}px ${imgSize.height * 2.5}px`,
                    backgroundPosition: `${-coords.x * 2.5 + 125}px ${-coords.y * 2.5 + 125}px`,
                    border: "1px solid rgba(255,255,255,0.2)",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                    borderRadius: "2px",
                    zIndex: 10
                  }}
                />
              )}
            </div>

            <div className="col-span-6 flex flex-wrap gap-4">
              {allImages.map((image, idx) => (
                <button
                  key={idx}
                  className={`w-20 h-20 bg-surface-container-low overflow-hidden border-2 transition-all ${
                    activeImage === image ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  onClick={() => setActiveImage(image)}
                >
                  <img src={image} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Info Section */}
          <div className="lg:col-span-5 space-y-10 lg:sticky lg:top-32">
            <div className="space-y-4">
              <span className="inline-block bg-primary/10 text-primary px-3 py-1 font-label text-[10px] font-bold tracking-[0.2em] uppercase">
                {product.category}
              </span>
              <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tighter leading-none text-primary uppercase italic">
                {product.name}
              </h1>
              <p className="text-secondary/80 leading-relaxed font-body text-lg max-w-xl">
                {product.longDescription}
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-tertiary font-label text-[10px] tracking-widest uppercase font-black mb-1">Price Point</p>
                <p className="text-4xl font-headline font-black text-primary">
                  EGP {product.price.toLocaleString('en-EG', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => navigateToProduct(`quote-${product.id}`)}
                  className="w-full bg-primary text-white py-5 text-xs font-headline font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-primary/90 transition-all"
                >
                  Request A Quote
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
                <a 
                  href={product.catalogUrl} 
                  download
                  className="w-full border border-outline-variant text-primary py-4 text-[10px] font-headline font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-3 hover:bg-surface-container-high transition-all"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  Technical Data Sheet (PDF)
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="pt-20 border-t border-outline-variant/15">
            <div className="flex flex-col mb-12">
              <h2 className="text-3xl font-headline font-black text-primary uppercase italic">Related Products</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => navigateToProduct(item.id)}
                  className="group cursor-pointer"
                >
                  <div className="aspect-[4/3] bg-surface-container-low overflow-hidden mb-5 border border-outline-variant/10">
                    <img 
                      src={item.mainImage} 
                      alt={item.name} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                    />
                  </div>
                  <p className="text-[9px] font-bold tracking-widest uppercase text-tertiary mb-1">{item.category}</p>
                  <h3 className="text-lg font-headline font-bold text-primary leading-tight group-hover:text-primary/70 transition-colors uppercase">
                    {item.name}
                  </h3>
                  <p className="text-sm font-body mt-2 text-secondary font-bold">
                    EGP {item.price.toLocaleString('en-EG')}
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