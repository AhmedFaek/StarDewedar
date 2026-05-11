import { useEffect, useState } from 'react'
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
            <img src={project.images[0].image_url} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" alt={title} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent"></div>
          <div className="relative h-full flex flex-col justify-end px-8 pb-20 max-w-7xl mx-auto">
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
                  <div key={i} className="overflow-hidden aspect-video">
                    <img src={img.image_url} className="w-full h-full object-cover hover:scale-105 transition" alt={`Detail ${i}`} />
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
                      <span className="text-[12px] uppercase text-outline">{t('projectDetail.start')}</span>
                      <p className="font-bold">{formatDate(project.start_date)}</p>
                    </div>
                    <div>
                      <span className="text-[12px] uppercase text-outline">{t('projectDetail.end')}</span>
                      <p className="font-bold">{formatDate(project.end_date)}</p>
                    </div>
                    <div>
                      <span className="text-[12px] uppercase text-outline">{getDurationLabel()}</span>
                      <p className="font-bold">
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
    </div>
  )
}
