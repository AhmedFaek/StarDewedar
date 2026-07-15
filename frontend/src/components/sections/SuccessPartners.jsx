import { useTranslation } from 'react-i18next'

export default function SuccessPartners() {
  const { t } = useTranslation()

  const partners = [
    { id: 1, name: 'Pepsi', logo: '/images/pepsi_logo.svg' },
    { id: 2, name: 'Coca-Cola', logo: '/images/cocacola_logo.svg' },
    { id: 3, name: 'Nestle', logo: '/images/nestle_logo.webp' },
    { id: 4, name: 'Bisco Masr', logo: '/images/bisco_logo.png' },
  ]

  return (
    <section className="py-20 sm:py-24 lg:py-32 px-4 sm:px-8 md:px-16 bg-surface">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 sm:mb-20">
          <span className="text-tertiary font-headline font-bold tracking-[0.2em] uppercase text-s mb-4 block">
            {t('successPartners.badge')}
          </span>
          <h2 className="text-primary font-headline text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-tight mb-6">
            {t('successPartners.title')}
          </h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto text-base sm:text-lg font-body leading-relaxed">
            {t('successPartners.description')}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
          {partners.map((partner) => (
            <div key={partner.id} className="bg-surface-container-low rounded-lg p-6 sm:p-8 lg:p-12 flex items-center justify-center group hover:shadow-lg hover:bg-surface-container transition-all duration-300 border border-outline-variant/20 hover:border-tertiary-fixed/40">
              <img src={partner.logo} alt={partner.name} loading="lazy" className="h-16 sm:h-20 lg:h-24 w-auto object-contain grayscale group-hover:grayscale-0 transition-all duration-500 opacity-70 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
