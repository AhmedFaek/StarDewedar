import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { api } from '../utils/api'
import ContentLoader from '../components/shared/ContentLoader'

export default function Projects() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0)
  const [categories, setCategories] = useState(['all'])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const itemsPerPage = 6

  const services = [
    t('projects.service1'),
    t('projects.service2'),
    t('projects.service3'),
    t('projects.service4'),
  ]

  const navigateToProject = (id) => navigate(`/project-detail?id=${id}`)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsData, categoriesData] = await Promise.all([
          api.getProjects(),
          api.getCategories(),
        ])
        setProjects(projectsData)

        const projectCategories = (categoriesData || []).filter(
          (category) => String(category.type || '').toLowerCase() === 'project'
        )
        setCategories(['all', ...projectCategories.map((category) => category.name_en)])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    const interval = setInterval(() => {
      setCurrentServiceIndex((prev) => (prev + 1) % services.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeFilter])

  const formatCurrency = (amount) => {
    if (!amount) return i18n.language === 'ar' ? 'غير محدد' : 'N/A'
    return `EGP ${Number(amount).toLocaleString('en-EG')}`
  }

  const getProjectLayoutClasses = (index) => {
    let colSpan = 'lg:col-span-4'
    if (index === 0) colSpan = 'lg:col-span-8'
    if (index === 3) colSpan = 'lg:col-span-8'
    if (index === 4 || index === 5) colSpan = 'lg:col-span-6'
    return colSpan
  }

  const getImageHeightClasses = (index) => {
    if (index === 0 || index === 3) return 'h-72 sm:h-80 lg:h-[26rem]'
    if (index === 4 || index === 5) return 'h-64 sm:h-72'
    return 'h-60 sm:h-64'
  }

  const filteredProjects = useMemo(() => {
    return activeFilter === 'all'
      ? projects
      : projects.filter((project) => project.category?.name_en === activeFilter)
  }, [projects, activeFilter])

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProjects = useMemo(() => {
    return filteredProjects.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredProjects, startIndex, itemsPerPage])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        <Header />
        <main className="flex-grow"><ContentLoader variant="projects" /></main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="pt-32 pb-32">
        <section className="px-4 sm:px-8 md:px-16 mb-24">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border-l-4 border-primary rtl:border-l-0 rtl:border-r-4">
            <div className="md:col-span-8 bg-[#f2f4f7] p-8 sm:p-12 lg:p-24 flex flex-col justify-center">
              <span className="text-tertiary font-headline font-bold tracking-[0.2em] uppercase text-xs mb-6">
                {t('projects.badge')}
              </span>
              <h1 className="text-primary font-headline text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8">
                {t('projects.heroTitle1')}
                <br />
                {t('projects.heroTitle2')}
              </h1>
              <p className="text-on-surface-variant max-w-xl text-lg leading-relaxed font-body">
                {t('projects.heroDesc')}
              </p>
            </div>
            <div className="md:col-span-4 relative overflow-hidden h-[400px] md:h-auto bg-sky-950">
              <img
                className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay grayscale hover:grayscale-0 transition-all duration-700"
                alt="Low voltage distribution panels"
                src="/images/projects_hero.webp"
              />
              <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-12">
                <div className="border-2 border-white/20 p-6 sm:p-8 w-full h-full flex items-end">
                  <div>
                    <p className="text-tertiary-fixed font-label text-[13px] tracking-[0.3em] uppercase mb-2">
                      {t('projects.coreServices')}
                    </p>
                    <span className="text-white font-headline text-3xl sm:text-4xl font-bold transition-all duration-500">
                      {String(currentServiceIndex + 1).padStart(2, '0')}. {services[currentServiceIndex]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-8 md:px-16 mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-outline-variant/30 pb-6 sm:pb-8 gap-6 sm:gap-8">
            <div>
              <h2 className="text-primary font-headline text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                {t('projects.projectArchives')}
              </h2>
              <p className="text-secondary text-xs sm:text-sm font-label uppercase tracking-widest">
                {t('projects.filterByClass')}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              {categories.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-6 sm:px-8 py-2 sm:py-3 text-xs font-headline font-bold uppercase tracking-widest transition-all ${
                    activeFilter === filter
                      ? 'bg-primary text-white'
                      : 'bg-surface-container-high text-primary hover:bg-outline-variant'
                  }`}
                >
                  {filter === 'all'
                    ? t('projects.allProjects')
                    : (projects.find((project) => project.category?.name_en === filter)?.category?.[
                        i18n.language === 'ar' ? 'name_ar' : 'name_en'
                      ] || filter)}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-8 md:px-16">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
            {paginatedProjects.map((project, index) => {
              const title = i18n.language === 'ar' ? project.title_ar : project.title_en
              const description = i18n.language === 'ar' ? project.description_ar : project.description_en
              const categoryName = i18n.language === 'ar' ? project.category?.name_ar : project.category?.name_en
              const location = i18n.language === 'ar' ? project.location_ar : project.location_en
              const colSpan = getProjectLayoutClasses(index)
              const imageHeight = getImageHeightClasses(index)
              const isFeatured = index === 0 || index === 3

              return (
                <article
                  key={project.id}
                  className={`${colSpan} group cursor-pointer overflow-hidden border border-outline-variant/15 bg-surface-container-lowest transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,14,36,0.12)]`}
                  onClick={() => navigateToProject(project.id)}
                >
                  <div className={`relative overflow-hidden bg-slate-200 ${imageHeight}`}>
                    <img
                      className="h-full w-full object-cover grayscale-[0.2] transition-all duration-700 group-hover:scale-[1.03] group-hover:grayscale-0"
                      loading="lazy"
                      alt={title}
                      src={project.images?.[0]?.image_url || 'https://via.placeholder.com/800x450'}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/30 to-transparent opacity-90"></div>
                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span className="bg-tertiary-fixed px-3 py-1 text-[10px] font-headline font-bold uppercase tracking-[0.18em] text-on-tertiary-fixed">
                          {categoryName}
                        </span>
                        {location && (
                          <span className="bg-white/10 px-3 py-1 text-[10px] font-label font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                            {location}
                          </span>
                        )}
                      </div>
                      <h3 className={`font-headline font-black tracking-tighter text-white ${isFeatured ? 'text-3xl sm:text-4xl max-w-3xl' : 'text-2xl'}`}>
                        {title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6 p-5 sm:p-6 lg:p-7">
                    <p className={`font-body leading-relaxed text-on-surface-variant ${isFeatured ? 'line-clamp-3 text-base' : 'line-clamp-2 text-sm'}`}>
                      {description}
                    </p>

                    <div className="grid grid-cols-1 gap-3 border-t border-outline-variant/15 pt-5 sm:grid-cols-2">
                      <div className="rounded-sm bg-surface-container-low px-4 py-3">
                        <p className="mb-1 text-[10px] font-label font-bold uppercase tracking-[0.18em] text-secondary">
                          {t('projects.client')}
                        </p>
                        <p className="text-sm font-headline font-bold text-primary">
                          {project.client_name || (i18n.language === 'ar' ? 'غير محدد' : 'N/A')}
                        </p>
                      </div>
                      <div className="rounded-sm bg-surface-container-low px-4 py-3">
                        <p className="mb-1 text-[10px] font-label font-bold uppercase tracking-[0.18em] text-secondary">
                          {t('projectDetail.budget')}
                        </p>
                        <p className="text-sm font-headline font-bold text-primary">
                          {formatCurrency(project.budget)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-outline-variant/15 pt-5">
                      <span className="text-[10px] font-label font-bold uppercase tracking-[0.22em] text-secondary">
                        {i18n.language === 'ar' ? 'عرض المشروع' : 'View Project'}
                      </span>
                      <span className="flex h-11 w-11 items-center justify-center bg-primary text-white transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {filteredProjects.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-secondary font-label uppercase tracking-widest">
                {i18n.language === 'ar' ? 'لا توجد مشاريع مطابقة لهذا التصنيف.' : 'No projects match this filter.'}
              </p>
            </div>
          )}

          {filteredProjects.length > 0 && (
            <div className="mt-12 flex flex-col gap-4 border-t border-outline-variant/20 pt-8 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-label uppercase tracking-widest text-secondary">
                {i18n.language === 'ar'
                  ? `عرض ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, filteredProjects.length)} من ${filteredProjects.length}`
                  : `Showing ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, filteredProjects.length)} of ${filteredProjects.length}`}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-xs font-headline font-bold uppercase tracking-widest text-primary bg-surface-container-high hover:bg-outline-variant disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {i18n.language === 'ar' ? 'السابق' : 'Previous'}
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-10 px-3 py-2 text-xs font-headline font-bold transition-all ${
                      currentPage === page
                        ? 'bg-primary text-white'
                        : 'bg-surface-container-high text-primary hover:bg-outline-variant'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-xs font-headline font-bold uppercase tracking-widest text-primary bg-surface-container-high hover:bg-outline-variant disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {i18n.language === 'ar' ? 'التالي' : 'Next'}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="mt-24 sm:mt-32 px-4 sm:px-8 md:px-16">
          <div className="voltage-gradient p-8 sm:p-12 lg:p-24 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
              <h2 className="text-white font-headline text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter leading-none mb-4 sm:mb-6">
                {t('projects.ctaTitle')}
              </h2>
              <p className="text-white text-base sm:text-lg font-body">
                {t('projects.ctaDesc')}
              </p>
            </div>
            <button
              onClick={() => navigate('/contact')}
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
