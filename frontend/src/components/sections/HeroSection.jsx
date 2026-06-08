import { useTranslation } from 'react-i18next'

export default function HeroSection() {
  const { t } = useTranslation()

  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden pt-16 sm:pt-20">
      <div className="absolute inset-0 z-0">
        <video
          className="w-full h-full object-cover object-center lg:object-right rtl:lg:object-left brightness-[0.6] sm:brightness-75"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/logo/Use_the_uploaded_Star_Dewedar.webm" type="video/webm" />
          <source src="/logo/Use_the_uploaded_Star_Dewedar.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r rtl:bg-gradient-to-l from-primary via-primary/70 to-transparent sm:to-transparent"></div>
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
              onClick={() => {
                window.history.pushState({}, '', '/request-quote')
                window.dispatchEvent(new PopStateEvent('popstate'))
              }}
              className="bg-tertiary-fixed text-on-tertiary-fixed px-8 py-5 font-headline font-bold uppercase tracking-widest hover:bg-white transition-all text-sm"
            >
              {t('hero.ctaQuote')}
            </button>

            <button
              onClick={() => {
                window.history.pushState({}, '', '/projects')
                window.dispatchEvent(new PopStateEvent('popstate'))
              }}
              className="border border-white/30 text-white px-8 py-5 font-headline font-bold uppercase tracking-widest hover:bg-white hover:text-primary transition-all text-sm backdrop-blur-sm"
            >
              {t('hero.ctaProjects')}
            </button>
            
            <button
              onClick={() => {
                window.history.pushState({}, '', '/request-visit')
                window.dispatchEvent(new PopStateEvent('popstate'))
              }}
              className="border border-tertiary-fixed text-tertiary-fixed px-8 py-5 font-headline font-bold uppercase tracking-widest hover:bg-tertiary-fixed hover:text-primary transition-all text-sm backdrop-blur-sm"
            >
              {t('hero.ctaSiteVisit', 'Request Site Visit')}
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
