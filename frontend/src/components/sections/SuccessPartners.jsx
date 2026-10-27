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
          <span className="text-primary font-headline font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
            {t('successPartners.badge')}
          </span>
          <h2 className="text-deep-blue font-headline text-xl sm:text-2xl md:text-3xl lg:text-[2rem] font-bold tracking-tight leading-snug mb-4">
            {t('successPartners.title')}
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-xs sm:text-sm md:text-base font-body leading-relaxed">
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
