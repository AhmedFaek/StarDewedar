import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../utils/api'

export default function ProjectShowcase() {
  const { t, i18n } = useTranslation()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.getProjects()
        setProjects(data.slice(0, 3)) // Show only first 3
      } catch (error) {
        console.error('Error fetching projects:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  if (loading) {
    return <div className="py-20 text-center">{t('common.loading') || 'Loading...'}</div>
  }

  const layoutMapping = [
      { colSpan: 'md:col-span-8 md:row-span-2', featured: true },
      { colSpan: 'md:col-span-4', featured: false },
      { colSpan: 'md:col-span-4', featured: false },
  ]

  return (
    <section className="bg-surface py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-8">
        <h2 className="font-headline text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-primary mb-12 md:mb-16 uppercase">
          {t('projectShowcase.title1')} <br />
          {t('projectShowcase.title2')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 md:h-[800px]">
          {projects.map((project, index) => {
            const layout = layoutMapping[index] || { colSpan: 'md:col-span-4', featured: false }
            const title = i18n.language === 'ar' ? project.title_ar : project.title_en
            const categoryName = i18n.language === 'ar' ? project.category?.name_ar : project.category?.name_en

            return (
              <div 
                key={project.id} 
                className={`${layout.colSpan} relative group overflow-hidden h-64 sm:h-80 md:h-auto cursor-pointer`}
                onClick={() => window.navigateTo('project-detail', project.id)}
              >
                <img 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                    src={project.images?.[0]?.image_url || 'https://via.placeholder.com/800x600'} 
                    alt={title} 
                />
                {!layout.featured && (<div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-all"></div>)}
                <div className={`absolute bottom-0 left-0 w-full p-6 sm:p-8 md:p-10 bg-gradient-to-t from-primary/90 to-transparent transition-all ${layout.featured ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <h4 className="font-headline text-lg sm:text-2xl md:text-3xl font-bold text-white mb-2">{title}</h4>
                  <p className="text-tertiary-fixed font-label uppercase text-xs tracking-widest">{categoryName}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
