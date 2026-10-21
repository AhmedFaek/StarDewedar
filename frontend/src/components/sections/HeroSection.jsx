import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export default function HeroSection() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isRtl = i18n.dir?.() === 'rtl' || i18n.language === 'ar'

  // Desktop panoramic: Arabic uses clean blueprint version to avoid text overlap; English uses full branded version
  const desktopHeroImage = isRtl ? '/logo/hero-sdc-ar.webp' : '/logo/hero-sdc.webp'
  // Mobile card visual: always uses the full uncropped brand graphic
  const mobileHeroImage = '/logo/hero-sdc.webp'

  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden pt-20 sm:pt-24 pb-12 sm:pb-16 bg-[#F3F6F9]">
      {/* Desktop & Widescreen Panoramic Background Layer (lg+) */}
      <div className="absolute inset-0 z-0 hidden lg:block pointer-events-none">
        <picture>
          <source srcSet={desktopHeroImage} type="image/webp" />
          <img
            src={desktopHeroImage}
            alt="Star Dewedar Company - General Contracting & Engineering"
            width={1774}
            height={887}
            fetchPriority="high"
            loading="eager"
            decoding="async"
            style={{
              objectPosition: isRtl ? '15% 50%' : '88% 50%',
            }}
            className="w-full h-full object-cover transition-all duration-700"
          />
        </picture>

        {/* Directional gradient shield ensuring 100% typographic contrast on text side */}
        <div className="absolute inset-0 bg-gradient-to-r rtl:bg-gradient-to-l from-[#F3F6F9] via-[#F3F6F9]/95 via-35% to-transparent pointer-events-none"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Hero Text Content */}
          <div className="lg:col-span-6 xl:col-span-5">
            <span className="inline-block bg-primary text-white px-4 py-1.5 font-label font-bold uppercase tracking-widest text-xs mb-6 shadow-sm animate-fade-in-up">
              {t('hero.badge')}
            </span>

            <h1 className="font-headline text-3xl sm:text-5xl md:text-5xl xl:text-6xl font-black text-deep-blue leading-tight tracking-tighter mb-6 animate-fade-in-up animate-delay-100">
              {t('hero.title1')}
              <br />
              <span className="text-primary">
                {t('hero.title2')}
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-8 max-w-xl font-body leading-relaxed animate-fade-in-up animate-delay-200">
              {t('hero.description')}
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-4 animate-fade-in-up animate-delay-300">
              <button
                onClick={() => navigate('/request')}
                className="bg-primary text-white px-8 py-4 sm:py-5 font-headline font-bold uppercase tracking-widest hover:bg-primary-dark transition-all text-sm shadow-md"
              >
                {t('hero.ctaQuote')}
              </button>

              <button
                onClick={() => navigate('/projects')}
                className="border-2 border-deep-blue text-deep-blue px-8 py-4 sm:py-5 font-headline font-bold uppercase tracking-widest hover:bg-deep-blue hover:text-white transition-all text-sm bg-white/70 backdrop-blur-sm"
              >
                {t('hero.ctaProjects')}
              </button>

              <button
                onClick={() => navigate('/products')}
                className="border-2 border-primary text-primary px-8 py-4 sm:py-5 font-headline font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all text-sm bg-white/70 backdrop-blur-sm"
              >
                {t('hero.ctaProducts')}
              </button>
            </div>
          </div>

          {/* Mobile & Tablet Graphic Presentation (<lg): preserves original 2:1 aspect ratio without cropping */}
          <div className="lg:hidden w-full mt-4 animate-fade-in-up animate-delay-200">
            <div className="relative w-full aspect-[2/1] overflow-hidden rounded-none shadow-ambient border border-slate-200/80 bg-white">
              <img
                src={mobileHeroImage}
                alt="Star Dewedar Company - General Contracting & Engineering"
                width={1774}
                height={887}
                loading="eager"
                decoding="async"
                className="w-full h-full object-contain object-center"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator (Desktop only) */}
      <div
        className="hidden lg:flex absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex-col items-center gap-1.5 cursor-pointer animate-bounce"
        onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
      >
        <span className="text-slate-500 text-[10px] font-label font-bold uppercase tracking-widest">Scroll</span>
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </section>
  )
}
