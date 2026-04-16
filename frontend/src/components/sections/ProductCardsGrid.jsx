const products = [
  {
    id: 1,
    category: 'Product Category 01',
    title: 'Electrical Panels',
    description: 'Custom-designed control centers for heavy power regulation and distribution.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBDOBAuDcWDLzWDhRwr6Ms_nc_sw7ADHHEAlAD2b5TteqQc0WMTLYdMGPcVT9FSDaXysMjjAGKmytA0VUlhfpVgRW-64jF3XBHSziY2zYnRt3p4gJHv9YQ2JXRQ2S8GCItQB-kz_MZh-34a7ziEQWYjP_c8AVSQO6xZVYV2cFYcNmEmcqy14VkCflVnG0IvjQ90LR-JDZt2xq4V2_YZdGLA3l-hD8ii48n4jJP2NWMNtHjTaPNdx_XUYDegY24UYEa_9CP9J7f3KKzc',
    tags: ['600V Rated', 'IP67 Shield'],
    bgColor: 'bg-surface-container-lowest',
    textColor: 'text-on-surface',
  },
  {
    id: 2,
    category: 'Product Category 02',
    title: 'Industrial Lighting',
    description: 'Heavy-duty LED arrays designed for maximum visibility in high-heat environments.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDYqEKkMA3g4HsSR3JNljqrLWz82f8Had2RD14tN5Ika24xrQ6S9mPcKsrudx1kn1qpP33YsxVswG44-0JtcwmfKQjH2Hv5OeiLMMiP21WEOLfqe66C45QsLNFp8Ioc8vFy2kEJJyRafMM35p2gxQ9K7TkxznPhy_iGdI3BcWGzysc6rv4TAhbhfzOmxImPwnnleqeJdv8x08aTiWS7sg37J1KFmYjzM20OzsKqc1MsXRtSCLogzAin9_Jc0IYqxNqIWrtzdA56HpMq',
    tags: ['High Bay', 'Shock Resistant'],
    bgColor: 'bg-primary',
    textColor: 'text-white',
    gradient: true,
  },
  {
    id: 3,
    category: 'Product Category 03',
    title: 'Sub-Components',
    description: 'Replacement parts and specialized gear for mission-critical maintenance.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB9fxM-0QqsnuXQT2gcoNQ2G7WrHcXcZimNFwXk9cxm7Sktcrkj029eQ1A6gx2zxBYUiwUewDqhqty23OyB-XaNrc7ja9PwFjlzKW1IoiqdVPFI_v4Kh0jM6oeZb1u5YIT2NW78IlidzIyb9lHfFncYNCKOIEH3hyK-YLxvJk_-qHFor3Nz9ls10hNjqmZ0Heu-0y3x0yMHejk-8LjYsf-K3gBEJYCIz-bccYx9qwmz-bmuCEmdy0ghSN24t2HIbAphgwlYZEh8',
    tags: ['Modular', 'Low Impedance'],
    bgColor: 'bg-surface-container-lowest',
    textColor: 'text-on-surface',
  },
]

export default function ProductCardsGrid() {
  return (
    <section className="bg-surface-container-low py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-12 md:mb-16 gap-6 sm:gap-8">
          <div>
            <h2 className="font-headline text-3xl sm:text-4xl font-bold tracking-tighter text-primary uppercase">
              Engineered Products
            </h2>
            <p className="text-outline mt-2 uppercase text-xs tracking-widest font-label">
              Precision components for heavy infrastructure
            </p>
          </div>
          <a className="flex md:flex items-center gap-2 font-label font-bold uppercase text-xs tracking-widest text-primary hover:text-tertiary transition-colors">
            View Catalog{' '}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className={`${product.bgColor} group cursor-pointer overflow-hidden flex flex-col transition-transform hover:scale-105`}
            >
              {/* Image Container */}
              <div className="h-48 sm:h-64 md:h-80 overflow-hidden">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src={product.image}
                  alt={product.title}
                />
              </div>

              {/* Content Container */}
              <div
                className={`p-5 sm:p-6 md:p-8 flex-grow ${product.gradient ? 'voltage-gradient' : ''} ${product.textColor}`}
              >
                <span className="text-[9px] sm:text-[10px] font-label font-bold uppercase tracking-[0.2em] block mb-3 sm:mb-4 opacity-75">
                  {product.category}
                </span>

                <h3 className="font-headline text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">{product.title}</h3>

                <p className={`mb-6 sm:mb-8 text-sm sm:text-base ${product.textColor === 'text-white' ? 'text-on-primary-container' : 'text-on-surface-variant'}`}>
                  {product.description}
                </p>

                {/* Tags */}
                <div className="flex gap-2 flex-wrap">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase ${
                        product.gradient
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-secondary-container text-on-surface'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
