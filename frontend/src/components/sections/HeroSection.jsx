import { useTranslation } from 'react-i18next'

export default function HeroSection() {
  const { t } = useTranslation()

  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden pt-16 sm:pt-20">
      <div className="absolute inset-0 z-0">
        <video
          className="w-full h-full object-cover object-center lg:object-right rtl:lg:object-left brightness-[0.4] sm:brightness-50"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/logo/Use_the_uploaded_Star_Dewedar.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r rtl:bg-gradient-to-l from-primary via-primary/80 to-primary/40 sm:to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-8 relative z-10">
        <div className="max-w-4xl">
          <span className="inline-block bg-tertiary-fixed text-on-tertiary-fixed px-4 py-1 font-label font-bold uppercase tracking-widest text-xs mb-6 animate-fade-in-up">
            {t('hero.badge')}
          </span>

          <h1 className="font-headline text-5xl md:text-7xl xl:text-7xl font-black text-white leading-tight tracking-tighter mb-8 animate-fade-in-up animate-delay-100">
            {t('hero.title1')}
            <br />
            <span className="text-tertiary-fixed">
              {t('hero.title2')}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl font-body leading-relaxed animate-fade-in-up animate-delay-200">
            {t('hero.description')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animate-delay-300">
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
          </div>
        </div>
      </div>
    </section>
  )
}
