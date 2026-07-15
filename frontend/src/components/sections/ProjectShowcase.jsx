import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { api } from '../../utils/api'
import ContentLoader from '../shared/ContentLoader'

export default function ProjectShowcase() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const containerRef = useRef(null)
  const [hasIntersected, setHasIntersected] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasIntersected(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!hasIntersected) return
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
  }, [hasIntersected])

  if (loading && !hasIntersected) {
    return <div ref={containerRef} className="min-h-[400px]" />
  }

  if (loading) {
    return (
      <div ref={containerRef}>
        <ContentLoader rows={2} />
      </div>
    )
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
                onClick={() => navigate(`/project-detail?id=${project.id}`)}
              >
                <img 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                    src={project.images?.[0]?.image_url || 'https://via.placeholder.com/800x600'} 
                    alt={title}
                    loading="lazy"
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
