import { useEffect, useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export default function ProductDetail() {
  const [product, setProduct] = useState(null)
  const [activeImage, setActiveImage] = useState('')
  
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);

  const productDatabase = {
    'ax-90': {
      id: 'ax-90',
      name: 'AX-Series Distribution Hub',
      category: 'Electrical Panels',
      price: 4250.00,
      catalogUrl: '/catalogs/ax-series-hub.pdf', // Added path
      longDescription: 'The AX-Series Distribution Hub represents the pinnacle of industrial power management technology. Engineered to handle the most demanding automation environments, this system combines modular flexibility with exceptional reliability. Our proprietary thermal management system enables continuous operation at peak loads without mechanical stress.',
      mainImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8nS1LP4Rhj0Z8ixlFMJ9t1QMuX5wpo1I2XJBCnRVYFjJuQfb6gcYihSXCWYgA3Rx_rxg34wm7WquftKjjTHw847g9g6BVtJIfiWN6QDiTUwt7jI2oe25V5R-nVcJs1nJN-PbrSGbnzGsmIi4acvlHHXqYLUjTEwjvG1K6ew4zX4njsHB6u7mXmlVsw6ta83-CuHxal2-Sc2ANsaIZTTA8I0lTA9pY1zNkq46TFtLrfJmj0E6RIHGGsMD0DiqDG8Msz2YEYbZAD8wz',
      detailImages: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBnrwnBy7tuptrkYBIS5Ezs6g2xWsrC0-kf8ljTTkaIxFE_KJ5fOiXBprWF9YBD2cXEPMFhq7dC7FFHEE0_NS-bYBVz9v3NXvupwgCLcVnCTwURaQl1dwoJRnYd0WLA_cZr1BRkirMYZmjzpy2OGRb5X2OQ6-hcnMAHLolTxnL3aks2J-kW4ue8KorrbL1qniKA6Xa4fYRe-oJQEMhVPBfmMgkuxuJag8FHb8uRWHrVho5pJQn-ylvmsAIBCEEd_7uaz-VKjcLlMdZT',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCCNUTbIbwAytpZESOD-SJAHeexj3oMopOpA8HrYWuWiG3pAkJ7NklBI9zSyJIW15rbcdZVi1G9Jbn9_VFh9K81D1b3nmmiPa7GvJN3aQa3z3i7lygCf_vXCYGf9nNZrdnVFnmlLbzkNNt5dKkckLKUT7WQpYopc25tAR7YVBVUjnom82eYanGZ5OKJxsntYgU4RCqv7xnJWA-lSAIkEeqGR84CDiOksb3EdwDAbA3XuP7VnCvZCnSbfgAU3jN1ATeK53v4aEdlrSXP',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAYgRRuRit-eA5OnDhscObtvxvI6qON12NxFnMbavWNDUrGHCh6cST00ZehoAIKO0ewpRMFHjwKeexhbwtPQzoBHtVvXKE82OzHZlwq-xM-aw_-UcbGyL0_ag4zaHcb8Hi_V3zvuD4DKRREramSTi91x4zwMpcIkaozcSMjyI31pEjgMzzuMy6GjP5EFEk_I6MRFGmN2J92V3QUdhRONJEYQAWiuXl0qIHOSxNQwFA-tdpXZekEIn2cV-T6tjEpqD4ZJHZKqh6KhgTF'
      ],
      specifications: {
        'Nominal Voltage': 'Up to 600 VDC',
        'Current Rating': '100A - 1000A Continuous',
        'Frequency': '50 / 60 Hz Auto-sensing',
        'Operational Temp': '-30°C to +70°C',
        'Enclosure Material': 'Steel with Powder Coating',
        'Compliance': 'IEEE 1547, UL 1741, CE'
      },
    },
    'lum-tx500': {
      id: 'lum-tx500',
      name: 'Titan High-Bay Luminaire',
      category: 'Lighting',
      price: 850.00,
      catalogUrl: '/catalogs/titan-high-bay.pdf', // Added path
      longDescription: 'The Titan High-Bay Luminaire revolutionizes industrial lighting with cutting-edge LED technology and intelligent thermal management. Designed specifically for high-bay applications, it delivers superior light quality while minimizing energy consumption.',
      mainImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBb7fNIy_bV5M-CHPo75Z6kp6x309j-H2OITswYwiDMGw3FsshUC_GisqZcYmeCl3c_eyendYoErnwxL6k0I0Qocz4nNo-LCeUMANaqe852FfqIGy_7HL4_AZ389mFAzjllaOeGaum6gBCZHMszSi4df_VqQVpdUFSRZJZkEhA0i6EBinLs7k9b1GKZwHBHbHotWEFArIua1mtBLQlngEMJjywqDl-kWA3OmMkn09j1qkx5MsbfCdE-pEjNwTbonbGyXSaAjPPDV_gp',
      detailImages: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBnrwnBy7tuptrkYBIS5Ezs6g2xWsrC0-kf8ljTTkaIxFE_KJ5fOiXBprWF9YBD2cXEPMFhq7dC7FFHEE0_NS-bYBVz9v3NXvupwgCLcVnCTwURaQl1dwoJRnYd0WLA_cZr1BRkirMYZmjzpy2OGRb5X2OQ6-hcnMAHLolTxnL3aks2J-kW4ue8KorrbL1qniKA6Xa4fYRe-oJQEMhVPBfmMgkuxuJag8FHb8uRWHrVho5pJQn-ylvmsAIBCEEd_7uaz-VKjcLlMdZT',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCCNUTbIbwAytpZESOD-SJAHeexj3oMopOpA8HrYWuWiG3pAkJ7NklBI9zSyJIW15rbcdZVi1G9Jbn9_VFh9K81D1b3nmmiPa7GvJN3aQa3z3i7lygCf_vXCYGf9nNZrdnVFnmlLbzkNNt5dKkckLKUT7WQpYopc25tAR7YVBVUjnom82eYanGZ5OKJxsntYgU4RCqv7xnJWA-lSAIkEeqGR84CDiOksb3EdwDAbA3XuP7VnCvZCnSbfgAU3jN1ATeK53v4aEdlrSXP',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAYgRRuRit-eA5OnDhscObtvxvI6qON12NxFnMbavWNDUrGHCh6cST00ZehoAIKO0ewpRMFHjwKeexhbwtPQzoBHtVvXKE82OzHZlwq-xM-aw_-UcbGyL0_ag4zaHcb8Hi_V3zvuD4DKRREramSTi91x4zwMpcIkaozcSMjyI31pEjgMzzuMy6GjP5EFEk_I6MRFGmN2J92V3QUdhRONJEYQAWiuXl0qIHOSxNQwFA-tdpXZekEIn2cV-T6tjEpqD4ZJHZKqh6KhgTF'
      ],
      specifications: {
        'Light Output': '45,000 Lumens',
        'Power Consumption': '400W',
        'Lifespan': '50,000+ Hours',
        'Compliance': 'ISO 9001, CE, RoHS'
      },
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const productId = params.get('id') || 'ax-90'
    const foundProduct = productDatabase[productId] || productDatabase['ax-90']
    
    setProduct(foundProduct)
    setActiveImage(foundProduct.mainImage)
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

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />

      <main className="flex-grow pt-24 pb-20 px-4 sm:px-8 max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-20">
          
          {/* Gallery Container */}
          <div className="lg:col-span-7 grid grid-cols-6 gap-3 md:gap-4">
            <div 
              className="col-span-6 bg-surface-container-low aspect-[16/10] relative overflow-hidden cursor-crosshair group"
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
                    height: "220px",
                    width: "220px",
                    top: `${coords.y - 110}px`,
                    left: `${coords.x - 110}px`,
                    backgroundImage: `url('${activeImage}')`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: `${imgSize.width * 2.5}px ${imgSize.height * 2.5}px`,
                    backgroundPosition: `${-coords.x * 2.5 + 110}px ${-coords.y * 2.5 + 110}px`,
                    border: "2px solid rgba(255,255,255,0.5)",
                    boxShadow: "0 15px 35px rgba(0,0,0,0.4)",
                    borderRadius: "4px",
                    zIndex: 10
                  }}
                />
              )}
              
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined">zoom_in</span>
              </div>
            </div>

            <div className="col-span-6 flex flex-wrap gap-3 md:gap-4">
              {allImages.map((image, idx) => (
                <div
                  key={idx}
                  className={`w-20 h-20 md:w-24 md:h-24 bg-surface-container-low cursor-pointer overflow-hidden border-2 transition-all ${
                    activeImage === image ? 'border-primary scale-95' : 'border-transparent hover:border-outline-variant'
                  }`}
                  onClick={() => setActiveImage(image)}
                >
                  <img
                    alt={`View ${idx + 1}`}
                    className={`w-full h-full object-cover transition-opacity ${
                      activeImage === image ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                    }`}
                    src={image}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info Panel */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-32">
            <div className="space-y-4">
              <span className="inline-block bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 font-label text-[10px] font-bold tracking-widest uppercase">
                {product.category}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-black tracking-tighter leading-none text-primary uppercase">
                {product.name}
              </h1>
              <p className="text-secondary leading-relaxed font-body text-lg">
                {product.longDescription}
              </p>
            </div>

            <div className="pt-6 border-t border-outline-variant/15">
              <p className="text-tertiary font-label text-[10px] tracking-widest uppercase font-black mb-2">
                Starting Price
              </p>
              <p className="text-4xl font-headline font-black text-primary">
                EGP {product.price.toLocaleString('en-EG', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
              <button className="w-full bg-primary text-white py-6 text-sm font-headline font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:brightness-110 transition-all shadow-xl shadow-primary/20">
                Request a Technical Quote
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              
              {/* Download Catalog Button */}
              <a 
                href={product.catalogUrl} 
                download
                className="w-full border border-primary text-primary py-4 text-xs font-headline font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                Download Product Catalog (PDF)
              </a>
            </div>
          </div>
        </div>

        {/* Technical Specifications Section */}
        <div className="bg-surface-container-low p-8 md:p-12 border border-outline-variant/10">
          <h2 className="text-xs font-label font-black uppercase tracking-[0.4em] text-primary mb-10 flex items-center gap-4">
            <span className="w-12 h-[2px] bg-primary"></span>
            Technical Data Sheet
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16">
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="flex justify-between py-4 border-b border-outline-variant/10">
                <span className="text-[10px] font-bold font-label uppercase tracking-widest text-secondary">{key}</span>
                <span className="text-sm font-medium text-primary text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}