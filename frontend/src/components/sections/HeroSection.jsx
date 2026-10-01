import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export default function HeroSection() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isRtl = i18n.dir?.() === 'rtl' || i18n.language === 'ar'

  const desktopImage = isRtl ? '/logo/hero_ar.webp' : '/logo/hero_desktop.webp'
  const mobileImage = isRtl ? '/logo/hero_ar_mobile.webp' : '/logo/hero_mobile.webp'
  const fallbackImage = isRtl ? '/logo/hero_ar.webp' : '/logo/hero.webp'

  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden pt-16 sm:pt-20 bg-primary">
      <div className="absolute inset-0 z-0">
        <picture key={isRtl ? 'ar' : 'en'}>
          {/* Mobile portrait: focused crop on helmet and 3D architectural SD mark */}
          <source
            media="(max-width: 768px)"
            srcSet={mobileImage}
            type="image/webp"
          />
          {/* Desktop & widescreen: full 2:1 panoramic render */}
          <source
            srcSet={desktopImage}
            type="image/webp"
          />
          <img
            src={fallbackImage}
            alt="Star Dewedar General Contracting & Engineering"
            width={2880}
            height={1440}
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover object-center sm:object-[68%_center] lg:object-[72%_center] rtl:sm:object-[38%_center] rtl:lg:object-[32%_center] brightness-[0.92] sm:brightness-100 transition-all duration-700"
          />
        </picture>
        {/* Horizontal directional gradient overlay focused strictly under the text side */}
        <div className="absolute inset-0 bg-gradient-to-r rtl:bg-gradient-to-l from-primary/95 via-primary/70 via-30% to-transparent sm:from-primary/90 sm:via-primary/50 sm:via-35% sm:to-transparent pointer-events-none"></div>
        {/* Mobile vertical gradient shield */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/30 to-transparent sm:hidden pointer-events-none"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-8 relative z-10">
        <div className="max-w-3xl">
          <span className="inline-block bg-tertiary-fixed text-on-tertiary-fixed px-4 py-1 font-label font-bold uppercase tracking-widest text-xs mb-6 animate-fade-in-up">
            {t('hero.badge')}
          </span>

          <h1 className="font-headline text-4xl md:text-6xl xl:text-6xl font-black text-white leading-tight tracking-tighter mb-8 animate-fade-in-up animate-delay-100">
            {t('hero.title1')}
            <br />
            <span className="text-tertiary-fixed">
              {t('hero.title2')}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl font-body leading-relaxed animate-fade-in-up animate-delay-200">
            {t('hero.description')}
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-4 animate-fade-in-up animate-delay-300">
            <button
              onClick={() => navigate('/request')}
              className="bg-tertiary-fixed text-on-tertiary-fixed px-8 py-5 font-headline font-bold uppercase tracking-widest hover:bg-white transition-all text-sm"
            >
              {t('hero.ctaQuote')}
            </button>

            <button
              onClick={() => navigate('/projects')}
              className="border border-white/30 text-white px-8 py-5 font-headline font-bold uppercase tracking-widest hover:bg-white hover:text-primary transition-all text-sm backdrop-blur-sm"
            >
              {t('hero.ctaProjects')}
            </button>
            
            <button
              onClick={() => navigate('/products')}
              className="border border-tertiary-fixed text-tertiary-fixed px-8 py-5 font-headline font-bold uppercase tracking-widest hover:bg-tertiary-fixed hover:text-primary transition-all text-sm backdrop-blur-sm"
            >
              {t('hero.ctaProducts')}
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div 
        className="hidden sm:flex absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex-col items-center gap-2 cursor-pointer animate-bounce"
        onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
      >
        <span className="text-white/60 text-[10px] font-label uppercase tracking-widest">Scroll</span>
        <svg className="w-5 h-5 text-tertiary-fixed" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </section>
  )
}
