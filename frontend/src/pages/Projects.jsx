import { useState, useEffect } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export default function Projects() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0)

  const services = [
    'ELECTRICAL PANELS',
    'LIGHTING SYSTEMS',
    'INDUSTRIAL INSTALLATIONS',
    'POWER DISTRIBUTION',
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentServiceIndex((prev) => (prev + 1) % services.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const projects = [
    {
      id: 1,
      title: 'North-West Power Corridor',
      category: 'Infrastructure',
      featured: true,
      size: 'large',
      description: 'A complete overhaul of the regional high-voltage grid, implementing modern smart-switching technology and redundant transmission pathways for 2.4GW capacity.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHtssFw4tOHI1pbStcgpVbZE5cwRCGHUTrAodBEUT1wH43NfurSliXD53LHf3MK-372DeLzxNSPCFkb1YzIeP6PuqOd-vt1ScBwFP8Ks1vhk9j9PBweCSTvHEpM9fMXAzvPqTVQhZmPLYjQguS992KqMkTqJQ0og5E5kuAbH4-Od8jrddXBeC1DLASORRGgYrKAJwri6csXCy-hkVf--seIU4vTy1KAyFaoiiMgTnYkpGQ-B29kt-a98P12HGME-LdhKr8E_bG2mwi',
      arrow: true,
    },
    {
      id: 2,
      title: 'Aero-Core Test Cell',
      category: 'Custom',
      size: 'small-box',
      description: 'High-frequency power modulation system for aerospace turbine testing facilities.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBy0OVJuuxfxFwdSMMUKSPeX2Yy5ZpGrbum_knmd29M_z7nF4szW-plCVfmfjvJqf7tcx0ucauR2Iqo7Cfhh8JjeRB5AMazNzJjDDQ49SQpswKjW9U8AxeWua61haUTUUOCejJ2-a8qcwvCC1EUNht4Th9zJhYiwpiXEhrDDdGL_jRhfS8hiNkDK9CsZw5phK9N9amby_Of4piIV5czxCCCvFVJBQ_PLL3U81QdC5aeHPogePsAttBAq8n_CS97bOOetl7VNSkZAkuq',
      specs: {
        client: 'PepsiCo',
        budget: '15000000',
      },
    },
    {
      id: 3,
      title: 'Steel-Works Phase IV',
      category: 'Factory',
      size: 'tall',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASsKzx1aYkM-FcHgF41nCnZgSlFr5uJShNvIrrn1gMVoo4x9f6LjMDN0NF6Tk5r03R55H1uqvwn7FVe63KDorPRa_wpptQKEsYairxrP4myv4NjzoFFkN3NHGCNFs5OEeCGU6K1_D3iGT-1HprDtFwpINr3rGjbROXFgrr8K7HvVDP19FjnB4IEJJbR_0qWoqh3pGwGuzQTTIWWAzj3EqA1-Zst1RzI_ObjJwPO8Z29biQL-i0GmKk4yNneq-oEGAt3psce6vEYP2o',
    },
    {
      id: 4,
      title: 'Marine Grid Integration',
      category: 'Infrastructure',
      size: 'split',
      description: 'Specialized shoreline power converters for naval ports, reducing dock-side emissions through high-efficiency shore-to-ship power links.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3wwmFkMJLM2ik03KMsI9Gm-gOq43RXpG2di8Q4QAIKTOxYat5wJn5wi7ZMlxE_7GcMm08UxsucPsCXOZv4DRGZQazh8eGFdLtDLMGKcgdDvqztpMLjyRfFyGsZzW-zx6ov9_RbQxXBqAx8FqifeLYfVynSHUHJYE5wfxc1E57IWtOF5OvdWMrAEE38P2TIeLOey1xQUhr3TM3YTfPLxOqt5bnYP5ZTcF3WRqLkWHQCmbi_Clj71X_NRIBn3-dlK64cxGjGTm2PqXP',
    },
    {
      id: 5,
      title: 'Project Zenith: Tier IV DC',
      category: 'Data Center',
      size: 'half',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQeWI4KfqYYW5RTB9tvrfTTYu5La25zuok9Yx69nqaMJReAB5MCwXLI_K2H4Cu59GQsFgo1Gs',
    },
    {
      id: 6,
      title: 'Atlas Smelter Automation',
      category: 'Heavy Manufacturing',
      size: 'half',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAiySKuaFgToFL3_V_8FHIEdmNNjyWxRM5-dsNg9EN7MqD2YEpLQX94f7knOpkIl-metpaeYZtR4p6ste9HISKsBy0XQO53EvoQREJGpLQFuycAK5LWh8Kb5Kd9VisHSCoKn7_JKwzmMCk7lUpOriLm0Bc-J8l8O7aiCUnUR-Iy4vp_MiOGGgyQTkj78i4cCq7o5hvZ1x7B66L3zk2xlFUkOlwnFhdprDuJ2wzD4o6mp79Q1dd5z3uu7ii7nZxWEh-7jE82O1y7JSQg',
    },
  ]

  const filters = ['all', 'Factory', 'Infrastructure', 'Custom']

  const filteredProjects =
    activeFilter === 'all' ? projects : projects.filter((p) => p.category === activeFilter)

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />

      <main className="pt-24 pb-32">
        {/* Hero Section */}
        <section className="px-4 sm:px-8 md:px-16 mb-24">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border-l-4 border-primary">
            {/* Left Content */}
            <div className="md:col-span-8 bg-[#f2f4f7] p-8 sm:p-12 lg:p-24 flex flex-col justify-center">
            <span className="text-tertiary font-headline font-bold tracking-[0.2em] uppercase text-xs mb-6">
                STAR DEWEDAR PROJECTS
            </span>
            <h1 className="text-primary font-headline text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8">
                ENGINEERING<br />POWER.
            </h1>
                <p className="text-on-surface-variant max-w-xl text-lg leading-relaxed font-body">
                From industrial facilities to commercial infrastructures, Star Dewedar delivers
                high-performance electrical solutions. Our projects include low-voltage panels,
                power distribution systems, and advanced lighting installations — engineered
                for reliability, safety, and long-term operation.
                </p>
            </div>

            {/* Right Image Area */}
            <div className="md:col-span-4 relative overflow-hidden h-[400px] md:h-auto bg-sky-950"> {/* Swapped to Navy/Sky-950 */}
            <img
                className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay grayscale hover:grayscale-0 transition-all duration-700"
                alt="Low voltage distribution panels"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZbMWu98ThJxswfzhwi-taNKZMRt_RrDAS1rYNKei2-4lQvzObFlqIM2qO7PsTNk1oYzCd-z5Nn580XQakhX436e-e6LRqsENV0iZ6kz_fd8wY-qqcYofxiHWniYXZSX3cumlB1MP2nl_4cvNJIS2Q3U2SxyRR9yM5meI-ZS-aX2rrFFlYj05leb6SWTneedFFau2RrngmUI9B6QVpQhbo2ordDZmio9YGvHOagnraQFm0GD0-cgW00t4uUfsrfHEfuaSnD2dDuVhj"
            />
            <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-12">
                <div className="border-2 border-white/20 p-6 sm:p-8 w-full h-full flex items-end">
                <div>
                    <p className="text-tertiary-fixed font-label text-[10px] tracking-[0.3em] uppercase mb-2">CORE SERVICES</p>
                    <span className="text-white font-headline text-3xl sm:text-4xl font-bold transition-all duration-500">
                      {String(currentServiceIndex + 1).padStart(2, '0')}. {services[currentServiceIndex]}
                    </span>
                </div>
                </div>
            </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="px-4 sm:px-8 md:px-16 mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-outline-variant/30 pb-6 sm:pb-8 gap-6 sm:gap-8">
            <div>
              <h2 className="text-primary font-headline text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                Project Archives
              </h2>
              <p className="text-secondary text-xs sm:text-sm font-label uppercase tracking-widest">
                Filter by infrastructure class
              </p>
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-6 sm:px-8 py-2 sm:py-3 text-xs font-headline font-bold uppercase tracking-widest transition-all ${
                    activeFilter === filter
                      ? 'bg-primary text-white'
                      : 'bg-surface-container-high text-primary hover:bg-outline-variant'
                  }`}
                >
                  {filter === 'all' ? 'All Projects' : filter}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Project Grid */}
        <section className="px-4 sm:px-8 md:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Project 1: Large Featured */}
            {filteredProjects[0] && (
              <div className="lg:col-span-8 group cursor-pointer">
                <div className="relative overflow-hidden bg-slate-200 aspect-[16/9]">
                  <img
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    alt={filteredProjects[0].title}
                    src={filteredProjects[0].image}
                  />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex gap-2">
                    <span className="bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-headline font-bold uppercase px-3 py-1 tracking-tighter">
                      {filteredProjects[0].category}
                    </span>
                    {filteredProjects[0].featured && (
                      <span className="bg-primary text-white text-[10px] font-headline font-bold uppercase px-3 py-1 tracking-tighter">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="max-w-2xl">
                    <h3 className="text-primary font-headline text-2xl sm:text-3xl font-black uppercase tracking-tighter mb-4">
                      {filteredProjects[0].title}
                    </h3>
                    <p className="text-on-surface-variant leading-relaxed font-body text-sm sm:text-base">
                      {filteredProjects[0].description}
                    </p>
                  </div>
                  {filteredProjects[0].arrow && (
                    <span className="material-symbols-outlined text-3xl sm:text-4xl text-primary flex-shrink-0 mt-1">
                      arrow_outward
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Project 2: Small Box */}
            {filteredProjects[1] && (
              <div className="lg:col-span-4 group cursor-pointer">
                <div className="bg-surface-container p-6 sm:p-8 h-full flex flex-col">
                  <div className="relative overflow-hidden aspect-square mb-6 sm:mb-8">
                    <img
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                      alt={filteredProjects[1].title}
                      src={filteredProjects[1].image}
                    />
                  </div>
                  <span className="text-tertiary font-label text-xs font-bold tracking-widest uppercase mb-2">
                    {filteredProjects[1].category}
                  </span>
                  <h3 className="text-primary font-headline text-xl sm:text-2xl font-bold uppercase tracking-tight mb-4">
                    {filteredProjects[1].title}
                  </h3>
                  <p className="text-secondary text-xs sm:text-sm leading-relaxed mb-auto font-body">
                    {filteredProjects[1].description}
                  </p>
                  {filteredProjects[1].specs && (
                    <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-outline-variant/30 flex gap-4 sm:gap-6">
                        <div className="flex flex-col border-l border-outline-variant/20 pl-4 sm:pl-6">

                        {/* Label */}
                        <span className="text-[10px] uppercase font-headline font-bold tracking-[0.2em] text-outline mb-3">
                            Client
                        </span>

                        {/* Plate */}
                        <div className="relative bg-surface-container-lowest px-4 py-3">

                            {/* Ghost Border */}
                            <div className="absolute inset-0 border border-outline-variant/15 pointer-events-none"></div>

                            {/* Content */}
                            <span className="text-primary font-headline font-bold text-base sm:text-lg tracking-tight">
                            {filteredProjects[1].specs.client}
                            </span>
                        </div>
                        </div>
                        <div className="flex flex-col border-l border-outline-variant/20 pl-4 sm:pl-6 flex-1">
                        
                        {/* Label */}
                        <span className="text-[10px] uppercase font-headline font-bold tracking-[0.2em] text-outline mb-3">
                            Project Budget
                        </span>

                        {/* Plate Container */}
                        <div className="relative bg-surface-container-lowest px-5 py-4">

                            {/* Ghost Border */}
                            <div className="absolute inset-0 border border-outline-variant/15 pointer-events-none"></div>

                            {/* Content */}
                            <div className="flex items-end gap-3">

                            {/* Value */}
                            <span className="text-primary font-headline font-black text-2xl sm:text-3xl tracking-tight">
                                {new Intl.NumberFormat('en-EG', {
                                    style: 'currency',
                                    currency: 'EGP',
                                    maximumFractionDigits: 0,
                                    }).format(filteredProjects[1].specs.budget)}
                            </span>

                            </div>
                        </div>
                        </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Project 3: Tall */}
            {filteredProjects[2] && (
              <div className="lg:col-span-4 group cursor-pointer">
                <div className="relative overflow-hidden bg-primary aspect-[4/5]">
                  <img
                    className="w-full h-full object-cover opacity-80 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
                    alt={filteredProjects[2].title}
                    src={filteredProjects[2].image}
                  />
                  <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full bg-gradient-to-t from-primary/90 to-transparent">
                    <span className="bg-white/10 backdrop-blur-md text-white text-[10px] font-headline font-bold uppercase px-3 py-1 mb-3 sm:mb-4 inline-block">
                      {filteredProjects[2].category}
                    </span>
                    <h3 className="text-white font-headline text-xl sm:text-2xl font-bold uppercase leading-none">
                      {filteredProjects[2].title}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            {/* Project 4: Split */}
            {filteredProjects[3] && (
              <div className="lg:col-span-8 group cursor-pointer">
                <div className="grid grid-cols-1 md:grid-cols-2 h-full gap-0">
                  <div className="bg-surface-container-high p-6 sm:p-12 flex flex-col justify-center">
                    <span className="text-tertiary font-label text-xs font-bold tracking-widest uppercase mb-3 sm:mb-4">
                      {filteredProjects[3].category}
                    </span>
                    <h3 className="text-primary font-headline text-2xl sm:text-4xl font-black uppercase tracking-tighter mb-4 sm:mb-6">
                      {filteredProjects[3].title}
                    </h3>
                    <p className="text-on-surface-variant mb-6 sm:mb-8 font-body text-sm sm:text-base">
                      {filteredProjects[3].description}
                    </p>
                    <button className="flex items-center gap-3 sm:gap-4 text-primary font-headline font-bold uppercase text-xs tracking-widest group-hover:gap-6 transition-all">
                      View Technical Specs{' '}
                      <span className="material-symbols-outlined text-lg">trending_flat</span>
                    </button>
                  </div>
                  <div className="relative overflow-hidden min-h-[300px] sm:min-h-[400px]">
                    <img
                      className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                      alt={filteredProjects[3].title}
                      src={filteredProjects[3].image}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Project 5: Half */}
            {filteredProjects[4] && (
              <div className="lg:col-span-6 group cursor-pointer">
                <div className="relative overflow-hidden aspect-video">
                  <img
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    alt={filteredProjects[4].title}
                    src={filteredProjects[4].image}
                  />
                  <div className="absolute inset-0 border-[16px] border-surface-container-lowest/0 group-hover:border-surface-container-lowest/10 transition-all duration-500"></div>
                </div>
                <div className="py-6 sm:py-8 border-b border-outline-variant/30">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="w-2 h-2 bg-tertiary"></div>
                    <span className="text-secondary text-[10px] font-headline font-bold uppercase tracking-widest">
                      {filteredProjects[4].category}
                    </span>
                  </div>
                  <h3 className="text-primary font-headline text-2xl sm:text-3xl font-black uppercase tracking-tight">
                    {filteredProjects[4].title}
                  </h3>
                </div>
              </div>
            )}

            {/* Project 6: Half */}
            {filteredProjects[5] && (
              <div className="lg:col-span-6 group cursor-pointer">
                <div className="relative overflow-hidden aspect-video">
                  <img
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    alt={filteredProjects[5].title}
                    src={filteredProjects[5].image}
                  />
                  <div className="absolute inset-0 border-[16px] border-surface-container-lowest/0 group-hover:border-surface-container-lowest/10 transition-all duration-500"></div>
                </div>
                <div className="py-6 sm:py-8 border-b border-outline-variant/30">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="w-2 h-2 bg-tertiary"></div>
                    <span className="text-secondary text-[10px] font-headline font-bold uppercase tracking-widest">
                      {filteredProjects[5].category}
                    </span>
                  </div>
                  <h3 className="text-primary font-headline text-2xl sm:text-3xl font-black uppercase tracking-tight">
                    {filteredProjects[5].title}
                  </h3>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-24 sm:mt-32 px-4 sm:px-8 md:px-16">
          <div className="voltage-gradient p-8 sm:p-12 lg:p-24 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
              <h2 className="text-white font-headline text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter leading-none mb-4 sm:mb-6">
                HAVE A COMPLEX REQUIREMENT?
              </h2>
              <p className="text-white text-base sm:text-lg font-body">
                Our engineering team specializes in non-standard industrial environments and extreme load requirements.
              </p>
            </div>
            <button className="bg-tertiary-fixed text-on-tertiary-fixed px-8 sm:px-12 py-4 sm:py-5 font-headline font-black uppercase text-xs sm:text-sm tracking-widest hover:scale-105 transition-all flex-shrink-0">
              Consult an Engineer
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
