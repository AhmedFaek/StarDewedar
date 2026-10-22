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

  // Shared CTA styling ensuring exact identical height, padding, border, alignment, and accessible contrast
  const ctaBase =
    'inline-flex items-center justify-center h-10 sm:h-11 px-4 sm:px-4.5 font-headline font-bold uppercase tracking-wider text-[11px] sm:text-xs text-center transition-all duration-200 border-2 rounded-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none cursor-pointer whitespace-nowrap'

  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden pt-20 sm:pt-24 pb-14 sm:pb-16 bg-[#F3F6F9]">
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

        {/* Gradual directional white gradient behind text: provides crisp typography backing that softly and smoothly fades out before the SDC branding */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isRtl
              ? 'linear-gradient(to left, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.92) 26%, rgba(255,255,255,0.60) 36%, rgba(255,255,255,0.18) 44%, rgba(255,255,255,0) 52%)'
              : 'linear-gradient(to right, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.92) 26%, rgba(255,255,255,0.60) 36%, rgba(255,255,255,0.18) 44%, rgba(255,255,255,0) 52%)',
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          {/* Main Hero Text Content */}
          <div className="lg:col-span-6 xl:col-span-5 max-w-[440px]">
            {/* Badge */}
            <div className="mb-3.5 animate-fade-in-up">
              <span className="inline-block bg-primary text-white px-3 py-1 font-label font-bold uppercase tracking-widest text-[10px] sm:text-[11px] shadow-xs">
                {t('hero.badge')}
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-headline text-2xl sm:text-3xl lg:text-[2rem] xl:text-[2.15rem] font-black text-deep-blue leading-[1.14] tracking-tight mb-3.5 sm:mb-4 animate-fade-in-up animate-delay-100">
              {t('hero.title1')}
              <br />
              <span className="text-primary">
                {t('hero.title2')}
              </span>
            </h1>

            {/* Paragraph description */}
            <p className="text-xs sm:text-sm lg:text-[14.5px] text-slate-700 font-body leading-relaxed max-w-[390px] mb-6 sm:mb-7 animate-fade-in-up animate-delay-200">
              {t('hero.description')}
            </p>

            {/* CTAs with identical height, padding, alignment, and accessible contrast */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center animate-fade-in-up animate-delay-300">
              <button
                onClick={() => navigate('/request')}
                className={`${ctaBase} bg-primary border-primary text-white hover:bg-primary-dark hover:border-primary-dark shadow-sm`}
              >
                {t('hero.ctaQuote')}
              </button>

              <button
                onClick={() => navigate('/projects')}
                className={`${ctaBase} bg-white/90 border-deep-blue text-deep-blue hover:bg-deep-blue hover:text-white hover:border-deep-blue shadow-sm backdrop-blur-sm`}
              >
                {t('hero.ctaProjects')}
              </button>

              <button
                onClick={() => navigate('/products')}
                className={`${ctaBase} bg-white/90 border-primary text-primary hover:bg-primary hover:text-white hover:border-primary shadow-sm backdrop-blur-sm`}
              >
                {t('hero.ctaProducts')}
              </button>
            </div>
          </div>

          {/* Mobile & Tablet Graphic Presentation (<lg): preserves original 2:1 aspect ratio without cropping */}
          <div className="lg:hidden w-full mt-6 sm:mt-8 animate-fade-in-up animate-delay-200">
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

