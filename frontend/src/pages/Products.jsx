import { useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState('All Products')
  const [searchTerm, setSearchTerm] = useState('')
  
  // New State for Price and Sorting
  const [maxPrice, setMaxPrice] = useState(15000)
  const [sortBy, setSortBy] = useState('featured') // 'low-high', 'high-low', 'featured'

  const categories = ['All Products', 'Electrical Panels', 'Lighting', 'Components']

  const products = [
    {
      id: 1,
      name: 'AX-Series Distribution Hub',
      category: 'Electrical Panels',
      price: 4250.00,
      description: 'High-density power distribution unit designed for heavy industrial automation and plant-wide control systems.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8nS1LP4Rhj0Z8ixlFMJ9t1QMuX5wpo1I2XJBCnRVYFjJuQfb6gcYihSXCWYgA3Rx_rxg34wm7WquftKjjTHw847g9g6BVtJIfiWN6QDiTUwt7jI2oe25V5R-nVcJs1nJN-PbrSGbnzGsmIi4acvlHHXqYLUjTEwjvG1K6ew4zX4njsHB6u7mXmlVsw6ta83-CuHxal2-Sc2ANsaIZTTA8I0lTA9pY1zNkq46TFtLrfJmj0E6RIHGGsMD0DiqDG8Msz2YEYbZAD8wz',
      tags: ['600V', 'IP67']
    },
    {
      id: 2,
      name: 'Titan High-Bay Luminaire',
      category: 'Lighting',
      price: 850.00,
      description: 'Precision-engineered LED lighting with thermal management for high-ceiling industrial facilities and warehouses.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBb7fNIy_bV5M-CHPo75Z6kp6x309j-H2OITswYwiDMGw3FsshUC_GisqZcYmeCl3c_eyendYoErnwxL6k0I0Qocz4nNo-LCeUMANaqe852FfqIGy_7HL4_AZ389mFAzjllaOeGaum6gBCZHMszSi4df_VqQVpdUFSRZJZkEhA0i6EBinLs7k9b1GKZwHBHbHotWEFArIua1mtBLQlngEMJjywqDl-kWA3OmMkn09j1qkx5MsbfCdE-pEjNwTbonbGyXSaAjPPDV_gp',
      tags: ['LED', '45000LM']
    },
    {
      id: 3,
      name: 'Kinetix Contactors',
      category: 'Components',
      price: 125.00,
      description: 'Heavy-duty electromagnetic contactors designed for reliable motor control and switching in demanding environments.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeA9xivMYHEQVRXeUu7Gpu2S2NUvcBZLJOx3iCgVABUarBpO6C9nB9ct6sFZQQnV5GFqSYIHE6fRlT2Xyo3c87haMjDU48FmxkJWiVvkvgCQPVntDgvB4ZNvzHI0QSs4UQUpM3PrpsKZ1D9oOOmCFBOos_15pHL7IZaa-t7CwK_ZRUGPtABJeY6M5UI0Ic4hZ6_eCq3sdDoSHUvv_D0pr1IV7t97eAo_tlQ8Y_oezoWbcXrFpEBsi3AAcJhQx21VV54cNk_uKlfD14',
      tags: ['COPPER', '200A']
    },
    {
      id: 4,
      name: 'Modular Switchgear M3',
      category: 'Electrical Panels',
      price: 12800.00,
      description: 'Customizable medium-voltage switchgear for safe and efficient grid management and large-scale facility operations.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBM8hsJFNvXajguPWDhJNBkwJUx6z0VVxt2s_qW9uimQ8pGkOc1OEFZIZAEaGS9-igX0JAovtOdLtnftJe9EqzVRr-D-axm2URksGkskvtHihwXV-w7l5jmF1nuXD7OOjqlG0Ud3ii8CTS9O4XQkPmbmm0zoYdGgSUCrTPpUakmN28CkmVaz07cWhe3k51hg8eiXH3HxY6JeO-kxgkKvovtG9-iekW2vKa4Z4DwyXvl_rtl-P6fWet5QPp83rYMMvzCuaKH3ZszSwEB',
      tags: ['MV', 'MODULAR']
    },
    {
      id: 5,
      name: 'Precision Flow Sensor',
      category: 'Components',
      price: 340.00,
      description: 'Integrated sensor technology for real-time monitoring of fluid dynamics in high-pressure industrial conduits.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkOAh1N_6mvfTt1mHbrjI3IGALDG7FbvwSP1OuTJFqpgPxOfwgIs-Dl9BoolHid2jo0mt5bVqDplvhNEKroQSX0VWjBPRK_PM_hllqZywHiQFGkSjHJsSCBInED2e9DZmzO9_syPsxZBqIwuYCS2SjcwwFsFtbbCR6hCKVJkd5PTDU_eHg2U-zL-xrvOxrrSWomxrgAuotdFdwiQm-5UUL7GnZEDtQBY1xuN0Agn9bxLLLFINfptEHxL_75sCXhPax8LktoEa8Xcpx',
      tags: ['SENSE', 'ULTRA']
    },
    {
      id: 6,
      name: 'Armor-Plate Breaker',
      category: 'Components',
      price: 1150.00,
      description: 'Ultra-reliable circuit protection with rapid interrupt technology for mission-critical power infrastructure.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBG73Tc8eOyRvJXqO0fZo5XbcpttmkZFLMJkADjsBH_Ng39UX0U4Fn8wiRM2dicVOIvoiAiLkgOUIra5GHNg54R8Oe6Pbk_A7WmpqRaDGdOL90ya4WMICUMfmXOE67ChBBw9BxKT7l9TwW7cugUrAmXrBr7eBFKp2jEFAVZhwO7iUrxvOWa9N-PiPeCeBjk7eHhIeEMV7QdJHsIKKByz3YJk79gT-D0gMVJ68p1pE9SYyXLu_dl_NsxTdLroTihoonIqdDLug_CgX6X',
      tags: ['SAFE', '100KA']
    }
  ]

  // Combined Filter and Sort Logic
  const filteredProducts = products
    .filter((product) => {
      const matchesCategory = selectedCategory === 'All Products' || product.category === selectedCategory
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesPrice = product.price <= maxPrice
      return matchesCategory && matchesSearch && matchesPrice
    })
    .sort((a, b) => {
      if (sortBy === 'low-high') return a.price - b.price
      if (sortBy === 'high-low') return b.price - a.price
      return 0 // Keep original order for 'featured'
    })

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />

      <main className="flex-grow pt-24 pb-20">
        {/* Hero Section */}
        <header className="relative w-full h-64 md:h-[409px] flex items-center px-4 sm:px-8 md:px-16 overflow-hidden bg-primary">
          <div className="absolute inset-0 opacity-40">
            <img
              alt="Industrial component"
              className="w-full h-full object-cover object-center"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNuFcnQtiTph6QqIP5XDSvlK5zO66HXwz7fz7sgm8YIcsMT2eze9dACmqIL8wt5zWM-_xGniBB9pzzvGd6lRQ7X830QqOHXfrmZEgnQobHBTqiVSQVtAWFr1OMh6qZpplQ908--jyN4ikMf0zC9wFBDCzN9hIWdSovz7_8kixqyl2L4mMnCjb3zYiw6PEFZvcq5HuLqCAivtT6HdRovF4gUffC2oxZTzE5CZIVf1DZuMEO7wz5mN5ERpnO9QE3lgbj-jaxvLWrCUef"
            />
          </div>
          <div className="relative z-10 max-w-4xl">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-headline font-black text-white tracking-tighter leading-none mb-3 md:mb-4">
              ENGINEERED <br className="hidden sm:block" />
              POWER
            </h1>
            <p className="text-white font-body text-base sm:text-lg md:text-lg max-w-xl">
              Premium industrial electrical solutions built for long-term operational integrity and resilience.
            </p>
          </div>
        </header>

        {/* Filter Bar */}
        <section className="bg-surface-container-low px-4 sm:px-8 md:px-16 py-6 border-b border-outline-variant/10">
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
            
            {/* Left: Category Buttons */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 font-label text-[10px] uppercase tracking-widest font-bold transition-all ${
                    selectedCategory === category
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-surface-container-lowest text-primary hover:bg-surface-variant'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Right: Advanced Controls */}
            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
              
              {/* Price Range Slider */}
              <div className="flex flex-col gap-1 min-w-[150px]">
                <label className="text-[9px] font-black uppercase tracking-widest text-secondary">
                  Max Price: ${maxPrice.toLocaleString()}
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="15000" 
                  step="100"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              {/* Sort Dropdown */}
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-surface-container-lowest border-none px-4 py-2 font-label text-[10px] uppercase tracking-widest font-bold text-primary outline-none focus:ring-1 focus:ring-tertiary"
              >
                <option value="featured">Featured</option>
                <option value="low-high">Price: Low to High</option>
                <option value="high-low">Price: High to Low</option>
              </select>

              {/* Search */}
              <div className="relative flex-grow lg:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">
                  search
                </span>
                <input
                  type="text"
                  placeholder="SEARCH PRODUCTS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface-container-lowest border-none focus:ring-1 focus:ring-tertiary px-10 py-2 font-label text-[10px] tracking-widest outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Product Grid */}
        <section className="px-4 sm:px-8 md:px-16 py-12">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group bg-surface-container-lowest border border-outline-variant/15 flex flex-col"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-surface-container-high relative">
                    <img
                      alt={product.name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      src={product.image}
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      {product.tags.map((tag) => (
                        <span key={tag} className="bg-secondary-container text-on-secondary-container px-2 py-1 text-[9px] font-bold tracking-widest uppercase">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-8 flex-grow flex flex-col">
                    <span className="text-tertiary font-label text-[10px] tracking-widest uppercase font-black mb-2">
                      {product.category}
                    </span>
                    <h3 className="text-2xl font-headline font-bold text-primary mb-3 tracking-tight">
                      {product.name}
                    </h3>
                    <p className="text-secondary text-sm font-body leading-relaxed mb-8">
                      {product.description}
                    </p>
                    <div className="mt-auto pt-4 border-t border-outline-variant/10 flex justify-between items-center">
                      <span className="text-primary font-headline font-black text-base">
                        {/* EGP or LE is typically used as the symbol */}
                        EGP {product.price.toLocaleString('en-EG', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                        })}
                      </span>
                      <button className="group/btn flex items-center gap-2 text-primary font-label text-xs uppercase tracking-widest font-bold hover:text-tertiary transition-colors">
                        View Details
                        <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">
                          arrow_forward
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <span className="material-symbols-outlined text-6xl text-outline mb-4">inventory_2</span>
              <p className="text-secondary font-label uppercase tracking-widest">No products match your current filters.</p>
              <button 
                onClick={() => {setSelectedCategory('All Products'); setMaxPrice(15000); setSearchTerm('');}}
                className="mt-4 text-primary font-black text-xs underline underline-offset-4 uppercase tracking-widest"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </section>

        {/* Consultation Banner omitted for brevity */}
      </main>
      <Footer />
    </div>
  )
}