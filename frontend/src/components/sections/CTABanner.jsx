import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export default function CTABanner() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <section className="bg-primary py-12 sm:py-16 overflow-hidden relative">
      <div className="container mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8 md:gap-12 relative z-10">
        <h2 className="font-headline text-xl sm:text-2xl md:text-3xl lg:text-[2rem] font-bold tracking-tight leading-snug text-white uppercase max-w-2xl">
          {t('ctaBanner.title')}
        </h2>
        <button 
          onClick={() => navigate('/contact')}
          className="bg-white text-primary px-6 sm:px-8 py-3 sm:py-3.5 font-headline font-bold uppercase tracking-wider hover:bg-slate-50 hover:text-primary-dark transition-all text-xs shrink-0 w-full sm:w-auto shadow-sm"
        >
          {t('ctaBanner.button')}
        </button>
      </div>

      {/* Watermark branding */}
      <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none overflow-hidden">
        <div className="font-headline font-black text-[15vw] sm:text-[20vw] md:text-[25vw] leading-none uppercase -rotate-12 whitespace-nowrap text-white opacity-[0.12]">
          SDC
        </div>
      </div>
    </section>
  )
}
