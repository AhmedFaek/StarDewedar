import { useTranslation } from 'react-i18next'
import AnimatedCounter from '../shared/AnimatedCounter'

export default function AboutPreview() {
  const { t } = useTranslation()

  return (
    <section className="bg-surface py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">

          {/* Left */}
          <div className="md:col-span-7">
            <h2 className="font-headline text-xl sm:text-2xl md:text-3xl lg:text-[2rem] font-bold tracking-tight leading-snug text-deep-blue mb-4 sm:mb-5">
              {t('aboutPreview.title1')}
              <br />{t('aboutPreview.title2')}
            </h2>

            <p className="text-slate-600 font-body text-xs sm:text-sm md:text-[15px] leading-relaxed max-w-xl mb-6 sm:mb-8">
              {t('aboutPreview.description')}
            </p>

            <div className="grid grid-cols-2 gap-6 sm:gap-12 border-t border-slate-200 pt-6">
              <div>
                <div className="font-headline text-2xl sm:text-3xl font-black text-deep-blue">
                  <AnimatedCounter value="10+" />
                </div>
                <div className="font-label uppercase text-[10px] sm:text-xs tracking-wider text-slate-500 font-semibold mt-1">
                  {t('aboutPreview.yearsExp')}
                </div>
              </div>

              <div>
                <div className="font-headline text-2xl sm:text-3xl font-black text-deep-blue">
                  <AnimatedCounter value="300+" />
                </div>
                <div className="font-label uppercase text-[10px] sm:text-xs tracking-wider text-slate-500 font-semibold mt-1">
                  {t('aboutPreview.projectsCompleted')}
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="md:col-span-5 bg-surface-container-low p-6 sm:p-8 rounded-none border border-slate-100">
            <h3 className="font-headline text-sm sm:text-base font-bold uppercase tracking-wider text-deep-blue mb-3 border-b-2 border-primary pb-1.5 w-fit">
              {t('aboutPreview.ourApproach')}
            </h3>

            <p className="text-slate-600 font-body text-xs sm:text-sm leading-relaxed mb-5">
              {t('aboutPreview.approachDesc')}
            </p>

            <img
              className="w-full h-64 object-cover grayscale transition-transform duration-700 hover:scale-[1.02]"
              src="/images/about_preview.webp"
              alt="Star Dewedar engineering and contracting"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
