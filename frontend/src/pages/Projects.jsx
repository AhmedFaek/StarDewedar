import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { api } from '../utils/api'

export default function Projects() {
  const { t, i18n } = useTranslation()
  const [projects, setProjects] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0)
  const [categories, setCategories] = useState(['all'])
  const [loading, setLoading] = useState(true)

  const services = [
    t('projects.service1'), t('projects.service2'), t('projects.service3'), t('projects.service4'),
  ]

  const navigateToProject = (projectId) => {
    window.history.pushState({}, '', `/project-detail?id=${projectId}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsData, categoriesData] = await Promise.all([
          api.getProjects(),
          fetch('/api/categories').then(res => res.json())
        ])
        setProjects(projectsData)
        
        const projectCategories = categoriesData.filter(c => c.type === 'PROJECT')
        setCategories(['all', ...projectCategories.map(c => c.name_en)])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()

    const interval = setInterval(() => { setCurrentServiceIndex((prev) => (prev + 1) % services.length) }, 3000)
    return () => clearInterval(interval)
  }, [])

  const filteredProjects = activeFilter === 'all' ? projects : projects.filter((p) => p.category?.name_en === activeFilter)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="pt-24 pb-32">
        {/* Hero */}
        <section className="px-4 sm:px-8 md:px-16 mb-24">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border-l-4 border-primary rtl:border-l-0 rtl:border-r-4">
            <div className="md:col-span-8 bg-[#f2f4f7] p-8 sm:p-12 lg:p-24 flex flex-col justify-center">
              <span className="text-tertiary font-headline font-bold tracking-[0.2em] uppercase text-xs mb-6">{t('projects.badge')}</span>
              <h1 className="text-primary font-headline text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8">
                {t('projects.heroTitle1')}<br />{t('projects.heroTitle2')}
              </h1>
              <p className="text-on-surface-variant max-w-xl text-lg leading-relaxed font-body">{t('projects.heroDesc')}</p>
            </div>
            <div className="md:col-span-4 relative overflow-hidden h-[400px] md:h-auto bg-sky-950">
              <img className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay grayscale hover:grayscale-0 transition-all duration-700" alt="Low voltage distribution panels" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZbMWu98ThJxswfzhwi-taNKZMRt_RrDAS1rYNKei2-4lQvzObFlqIM2qO7PsTNk1oYzCd-z5Nn580XQakhX436e-e6LRqsENV0iZ6kz_fd8wY-qqcYofxiHWniYXZSX3cumlB1MP2nl_4cvNJIS2Q3U2SxyRR9yM5meI-ZS-aX2rrFFlYj05leb6SWTneedFFau2RrngmUI9B6QVpQhbo2ordDZmio9YGvHOagnraQFm0GD0-cgW00t4uUfsrfHEfuaSnD2dDuVhj" />
              <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-12">
                <div className="border-2 border-white/20 p-6 sm:p-8 w-full h-full flex items-end">
                  <div>
                    <p className="text-tertiary-fixed font-label text-[13px] tracking-[0.3em] uppercase mb-2">{t('projects.coreServices')}</p>
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
              <h2 className="text-primary font-headline text-2xl sm:text-3xl font-bold tracking-tight mb-2">{t('projects.projectArchives')}</h2>
              <p className="text-secondary text-xs sm:text-sm font-label uppercase tracking-widest">{t('projects.filterByClass')}</p>
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              {categories.map((filter) => (
                <button key={filter} onClick={() => setActiveFilter(filter)}
                  className={`px-6 sm:px-8 py-2 sm:py-3 text-xs font-headline font-bold uppercase tracking-widest transition-all ${activeFilter === filter ? 'bg-primary text-white' : 'bg-surface-container-high text-primary hover:bg-outline-variant'}`}>
                  {filter === 'all' ? t('projects.allProjects') : (projects.find(p => p.category?.name_en === filter)?.category?.[i18n.language === 'ar' ? 'name_ar' : 'name_en'] || filter)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Project Grid */}
        <section className="px-4 sm:px-8 md:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8">
            {filteredProjects.map((project, index) => {
              // Determine layout based on index or property if needed
              let colSpan = "lg:col-span-4"
              if (index === 0) colSpan = "lg:col-span-8"
              if (index === 3) colSpan = "lg:col-span-8"
              if (index === 4 || index === 5) colSpan = "lg:col-span-6"

              const title = i18n.language === 'ar' ? project.title_ar : project.title_en
              const description = i18n.language === 'ar' ? project.description_ar : project.description_en
              const categoryName = i18n.language === 'ar' ? project.category?.name_ar : project.category?.name_en

              return (
                <div key={project.id} className={`${colSpan} group cursor-pointer`} onClick={() => navigateToProject(project.id)}>
                   <div className="relative overflow-hidden bg-slate-200 aspect-video">
                    <img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt={title} src={project.images?.[0]?.image_url || 'https://via.placeholder.com/800x450'} />
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex gap-2">
                      <span className="bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-headline font-bold uppercase px-3 py-1 tracking-tighter">{categoryName}</span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-primary font-headline text-2xl font-black uppercase tracking-tighter mb-4">{title}</h3>
                    <p className="text-on-surface-variant leading-relaxed font-body text-sm line-clamp-2">{description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-24 sm:mt-32 px-4 sm:px-8 md:px-16">
          <div className="voltage-gradient p-8 sm:p-12 lg:p-24 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
              <h2 className="text-white font-headline text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter leading-none mb-4 sm:mb-6">{t('projects.ctaTitle')}</h2>
              <p className="text-white text-base sm:text-lg font-body">{t('projects.ctaDesc')}</p>
            </div>
            <button
              onClick={() => {
                window.history.pushState({}, '', '/contact')
                window.dispatchEvent(new PopStateEvent('popstate'))
              }}
              className="bg-tertiary-fixed text-black px-6 sm:px-12 py-4 sm:py-6 font-headline font-bold uppercase tracking-widest transition-all text-xs sm:text-sm shrink-0 w-full sm:w-auto"
            >
              {t('ctaBanner.button')}
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
