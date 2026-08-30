import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { api } from '../utils/api'
import ContentLoader from '../components/shared/ContentLoader'

export default function ProjectDetail() {
  const { t, i18n } = useTranslation()
  const [searchParams] = useSearchParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const allImages = project?.images || []

  const openLightbox = (index) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)
  const prevImage = () => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))
  const nextImage = () => setLightboxIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))

  const handleKeyDown = useCallback((e) => {
    if (lightboxIndex === null) return
    if (e.key === 'Escape') closeLightbox()
    if (e.key === 'ArrowLeft') prevImage()
    if (e.key === 'ArrowRight') nextImage()
  }, [lightboxIndex, allImages.length])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const id = searchParams.get('id')

  useEffect(() => {
    if (!id) { setLoading(false); return }
    setLoading(true)
    api.getProjectById(id)
      .then(found => { setProject(found); window.scrollTo(0, 0) })
      .catch(err => console.error('Error fetching project:', err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        <Header />
        <main className="flex-grow"><ContentLoader variant="detail" /></main>
        <Footer />
      </div>
    )
  }

  if (!project) {
      return (
          <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-grow flex items-center justify-center">
                  <p>Project not found</p>
              </main>
              <Footer />
          </div>
      )
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString(
      i18n.language === 'ar' ? 'ar-EG' : 'en-EG',
      { day: 'numeric', month: 'short', year: 'numeric' }
    )
  }

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A'
    return Number(amount).toLocaleString()
  }

  const getDurationInDays = (startDate, endDate) => {
    if (!startDate || !endDate) return null

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null

    const millisecondsPerDay = 1000 * 60 * 60 * 24
    const diffInMilliseconds = end.getTime() - start.getTime()
    const diffInDays = Math.ceil(diffInMilliseconds / millisecondsPerDay)

    return diffInDays >= 0 ? diffInDays + 1 : null
  }

  const getDurationLabel = () => {
    const translated = t('projectDetail.duration')
    return translated === 'projectDetail.duration'
      ? (i18n.language === 'ar' ? 'المدة' : 'Duration')
      : translated
  }

  const formatDurationDays = (days) => {
    if (!days) return 'N/A'

    if (i18n.language === 'ar') {
      if (days === 1) return 'يوم واحد'
      if (days === 2) return 'يومان'
      if (days >= 3 && days <= 10) return `${days} أيام`
      return `${days} يوم`
    }

    return `${days} ${days === 1 ? 'day' : 'days'}`
  }

  const title = i18n.language === 'ar' ? project.title_ar : project.title_en
  const description = i18n.language === 'ar' ? project.description_ar : project.description_en
  const categoryName = i18n.language === 'ar' ? project.category?.name_ar : project.category?.name_en
  const location = i18n.language === 'ar' ? project.location_ar : project.location_en
  const durationInDays = getDurationInDays(project.start_date, project.end_date)

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="flex-grow pt-20">
        {/* HERO */}
        <section className="relative h-[600px] bg-primary overflow-hidden">
          {project.images?.[0] && (
            <img
              src={project.images[0].image_url}
              className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay cursor-pointer"
              alt={title}
              onClick={() => openLightbox(0)}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent pointer-events-none"></div>
          <div className="relative h-full flex flex-col justify-end px-8 pb-20 max-w-7xl mx-auto pointer-events-none">
            <span className="bg-tertiary-fixed text-black px-3 py-1 text-[10px] uppercase tracking-widest w-fit mb-6">{categoryName}</span>
            <h1 className="text-white font-headline text-6xl md:text-8xl font-black tracking-tight mb-6">{title}</h1>
          </div>
        </section>

        {/* MAIN GRID */}
        <section className="py-24 px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* LEFT */}
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-surface-container-low p-12">
                <h2 className="text-3xl font-headline font-black mb-6 border-l-4 border-tertiary-fixed pl-4 rtl:border-l-0 rtl:border-r-4 rtl:pl-0 rtl:pr-4">{t('projectDetail.projectOverview')}</h2>
                <p className="text-secondary leading-relaxed text-lg">{description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.images?.slice(1).map((img, i) => (
                  <div
                    key={i}
                    className="overflow-hidden aspect-video bg-surface-container-high cursor-pointer group"
                    onClick={() => openLightbox(i + 1)}
                  >
                    <img src={img.image_url} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" alt={`Detail ${i}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT */}
            <div className="lg:col-span-4 space-y-6">
              <div className="sticky top-32 space-y-6">
                <div className="bg-primary text-white p-8">
                  <h3 className="text-sm uppercase tracking-[0.3em] mb-6">{t('projectDetail.projectInfo')}</h3>
                  <div className="space-y-6">
                    <div>
                      <span className="text-[12px] uppercase text-white/60">{t('projectDetail.client')}</span>
                      <p className="text-xl font-bold">{project.client_name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[12px] uppercase text-white/60">{t('projectDetail.category')}</span>
                      <p className="text-xl font-bold">{categoryName}</p>
                    </div>
                    {location && (
                      <div>
                        <span className="text-[12px] uppercase text-white/60">{t('projectDetail.location')}</span>
                        <p className="text-xl font-bold">{location}</p>
                      </div>
                    )}
                    <div className="border-t border-white/10 pt-6">
                      <span className="text-[12px] uppercase text-white/60">{t('projectDetail.budget')}</span>
                      <p className="text-3xl font-black text-tertiary-fixed">EGP {formatCurrency(project.budget)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-low p-8">
                  <h3 className="text-sm uppercase tracking-[0.3em] mb-6">{t('projectDetail.timeline')}</h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm uppercase text-outline">{t('projectDetail.start')}</span>
                      <p className="text-lg font-bold">{formatDate(project.start_date)}</p>
                    </div>
                    <div>
                      <span className="text-sm uppercase text-outline">{t('projectDetail.end')}</span>
                      <p className="text-lg font-bold">{formatDate(project.end_date)}</p>
                    </div>
                    <div>
                      <span className="text-sm uppercase text-outline">{getDurationLabel()}</span>
                      <p className="text-lg font-bold">
                        {formatDurationDays(durationInDays)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Fullscreen Lightbox */}
      {lightboxIndex !== null && allImages[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 z-10 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-4xl">close</span>
          </button>

          {/* Counter */}
          <div className="absolute top-6 left-6 text-white/50 text-sm font-mono tracking-widest">
            {lightboxIndex + 1} / {allImages.length}
          </div>

          {/* Prev button */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevImage() }}
              className="absolute left-4 md:left-8 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
              aria-label="Previous image"
            >
              <span className="material-symbols-outlined text-2xl">chevron_left</span>
            </button>
          )}

          {/* Image */}
          <img
            src={allImages[lightboxIndex].image_url}
            alt={`Project image ${lightboxIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain select-none"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next button */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextImage() }}
              className="absolute right-4 md:right-8 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
              aria-label="Next image"
            >
              <span className="material-symbols-outlined text-2xl">chevron_right</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
