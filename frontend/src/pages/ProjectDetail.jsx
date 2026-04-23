import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export default function ProjectDetail() {
  const { t } = useTranslation()
  const [project, setProject] = useState(null)

  const projects = [
    {
      id: '1', title: 'MAIN DISTRIBUTION PANEL – FOOD FACTORY',
      description: 'Design and installation of low voltage main distribution panels for a large-scale food processing factory. The system ensures stable power delivery across production lines with high safety compliance.',
      client_name: 'El Rashidi Food Industries', budget: 3200000, start_date: '2024-01-15', end_date: '2024-03-10', location: 'Alexandria, Egypt',
      category: { name: 'Electrical Panels' },
      images: [
        { image_url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837' },
        { image_url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789' },
        { image_url: 'https://images.unsplash.com/photo-1581093458791-9d09d3f44b94' }
      ]
    },
    {
      id: '2', title: 'STREET LIGHTING SYSTEM – NEW CAIRO',
      description: 'Complete outdoor lighting system using high-efficiency LED floodlights and poles. Designed for long lifetime and low maintenance across residential zones.',
      client_name: 'New Cairo Municipality', budget: 8500000, start_date: '2023-08-01', end_date: '2024-02-20',
      category: { name: 'Lighting Systems' },
      images: [
        { image_url: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231' },
        { image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d' }
      ]
    },
    {
      id: '3', title: 'INDUSTRIAL CONTROL PANELS – TEXTILE FACTORY',
      description: 'Custom-built control panels for automation and motor control systems. Integrated protection systems and monitoring for high-load machinery.',
      client_name: 'Delta Textile Co.', budget: 2100000, start_date: '2024-02-01', end_date: '2024-04-15',
      category: { name: 'Control Panels' },
      images: [
        { image_url: 'https://images.unsplash.com/photo-1581093588401-22f59c9d2c0b' },
        { image_url: 'https://images.unsplash.com/photo-1581091870622-6c3f5e4f0b02' }
      ]
    }
  ]

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id') || '1'
    const found = projects.find((p) => p.id === id) || projects[0]
    setProject(found)
  }, [])

  if (!project) return null

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-EG', { year: 'numeric', month: 'short' })
  }

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A'
    return Number(amount).toLocaleString()
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="flex-grow pt-20">
        {/* HERO */}
        <section className="relative h-[600px] bg-primary overflow-hidden">
          {project.images?.[0] && (
            <img src={project.images[0].image_url} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent"></div>
          <div className="relative h-full flex flex-col justify-end px-8 pb-20 max-w-7xl mx-auto">
            <span className="bg-tertiary-fixed text-black px-3 py-1 text-[10px] uppercase tracking-widest w-fit mb-6">{project.category?.name}</span>
            <h1 className="text-white font-headline text-6xl md:text-8xl font-black tracking-tight mb-6">{project.title}</h1>
          </div>
        </section>

        {/* MAIN GRID */}
        <section className="py-24 px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* LEFT */}
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-surface-container-low p-12">
                <h2 className="text-3xl font-headline font-black mb-6 border-l-4 border-tertiary-fixed pl-4 rtl:border-l-0 rtl:border-r-4 rtl:pl-0 rtl:pr-4">{t('projectDetail.projectOverview')}</h2>
                <p className="text-secondary leading-relaxed text-lg">{project.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.images?.slice(1).map((img, i) => (
                  <div key={i} className="overflow-hidden">
                    <img src={img.image_url} className="w-full h-full object-cover hover:scale-105 transition" />
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT */}
            <div className="lg:col-span-4 space-y-6">
              <div className="sticky top-32 space-y-6">
                <div className="bg-primary text-white p-8">
                  <h3 className="text-xs uppercase tracking-[0.3em] mb-6">{t('projectDetail.projectInfo')}</h3>
                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] uppercase text-white/60">{t('projectDetail.client')}</span>
                      <p className="text-xl font-bold">{project.client_name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-white/60">{t('projectDetail.category')}</span>
                      <p className="text-xl font-bold">{project.category?.name}</p>
                    </div>
                    {project.location && (
                      <div>
                        <span className="text-[10px] uppercase text-white/60">{t('projectDetail.location')}</span>
                        <p className="text-xl font-bold">{project.location}</p>
                      </div>
                    )}
                    <div className="border-t border-white/10 pt-6">
                      <span className="text-[10px] uppercase text-white/60">{t('projectDetail.budget')}</span>
                      <p className="text-3xl font-black text-tertiary-fixed">EGP {formatCurrency(project.budget)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-low p-8">
                  <h3 className="text-xs uppercase tracking-[0.3em] mb-6">{t('projectDetail.timeline')}</h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] uppercase text-outline">{t('projectDetail.start')}</span>
                      <p className="font-bold">{formatDate(project.start_date)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-outline">{t('projectDetail.end')}</span>
                      <p className="font-bold">{formatDate(project.end_date)}</p>
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