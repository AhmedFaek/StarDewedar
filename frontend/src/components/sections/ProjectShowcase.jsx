import { useTranslation } from 'react-i18next'

const projects = [
  {
    id: 1, title: 'Solaris Grid Expansion', category: 'Power Generation | 2023',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDT6TZ7zZca3kZDUX76NaYR-t-xLD4G5rq_BtA0hvW-L41qvYNNctx4ionv0vbY6zijVwaJujFYQnB1eQUp0tMHGYPnOIFE5JkcV0DkC0XjLrOULEA-rdvtyAzfKj6spYB96vqyxvpcRA6ukT941LY3nc6pZE592_9bbXNAA7FLn26U3pnIS6rATA8hXAtBD0iM0zJdZe2AowIwcMuWUmw8B6WDIWKppRhJz_t9V2sKC7mH4Mvq9XRXbVnV9MyKXBxvfHBuo_BkcMvf',
    colSpan: 'md:col-span-8 md:row-span-2', rowSpan: 'h-full', featured: true,
  },
  {
    id: 2, title: 'Data Center Integration', category: 'Infrastructure | 2023',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpkqNNzlGETxffYxX0wLmcTJw_cg31SUHKV4epvi0dqHWFOuLfdIXAo4xEiI6BEwgxP9P2QUd7EPs4aqTImCG_oqMjWjt2D6ZWGpPb9futo2gDy4uiK8LDYcWE5HldkHCXAujq5ciqIM-sOkCr43JGD5VFT0GUAQyI9zUviXXbDoEyDKCXs_T30BMc8olVfVMhHCnrke31sLVMRFVTlvW6VJZ89eA7ABHMCw_JVXGEdWosKiwnuG980HqZJXgK0knt4u0YFMYSTr9j',
    colSpan: 'md:col-span-4', rowSpan: 'h-80', featured: false,
  },
  {
    id: 3, title: 'Industrial Construction', category: 'Manufacturing | 2023',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1oNoj21nPD-7EOOMhtg2mqJkCwrwSkO7beAseJQjJrV44vALHrXwmg7vbr77dvdLT3kH7I_s9p4FbzGld4wEn4AYMRgNkKkXTxoiYcnOVxQQSJIioIPB8RDSK7ni6-l8n7GdrtJhJP0ypEKUcDJPDJo7Ms2TBhhSWuwEY44HV8CBePCI30BRwUUrj_CrDI3P8p7IyOs8oTqdoqzhur9e0058knNP1S3q-fGZmKX9oNpnxP-10W2vEXnhO0QY4PPw1KuRn2CvhVlQu',
    colSpan: 'md:col-span-4', rowSpan: 'h-80', featured: false,
  },
]

export default function ProjectShowcase() {
  const { t } = useTranslation()

  return (
    <section className="bg-surface py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-8">
        <h2 className="font-headline text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-primary mb-12 md:mb-16 uppercase">
          {t('projectShowcase.title1')} <br />
          {t('projectShowcase.title2')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 md:h-[800px]">
          {projects.map((project) => (
            <div key={project.id} className={`${project.colSpan} relative group overflow-hidden h-64 sm:h-80 md:h-auto`}>
              <img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" src={project.image} alt={project.title} />
              {!project.featured && (<div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-all"></div>)}
              <div className={`absolute bottom-0 left-0 w-full p-6 sm:p-8 md:p-10 bg-gradient-to-t from-primary/90 to-transparent transition-all ${project.featured ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <h4 className="font-headline text-lg sm:text-2xl md:text-3xl font-bold text-white mb-2">{project.title}</h4>
                <p className="text-tertiary-fixed font-label uppercase text-xs tracking-widest">{project.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
