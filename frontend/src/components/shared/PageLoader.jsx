import { useTranslation } from 'react-i18next'

export default function PageLoader({ fullscreen = true, label }) {
  const { t } = useTranslation()
  const loadingLabel = label || t('common.loading') || 'Loading'

  const containerClasses = fullscreen
    ? 'min-h-screen flex items-center justify-center bg-surface px-6'
    : 'flex items-center justify-center py-20 px-6'

  return (
    <div className={containerClasses}>
      <div className="relative overflow-hidden border border-outline-variant/20 bg-surface-container-lowest px-8 py-10 sm:px-10 sm:py-12 shadow-[0_20px_60px_rgba(0,14,36,0.08)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-tertiary-fixed to-transparent animate-loader-scan"></div>
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="grid grid-cols-3 gap-2">
            <span className="h-3 w-3 bg-primary animate-loader-pulse [animation-delay:0ms]"></span>
            <span className="h-3 w-3 bg-primary-container animate-loader-pulse [animation-delay:140ms]"></span>
            <span className="h-3 w-3 bg-tertiary-fixed animate-loader-pulse [animation-delay:280ms]"></span>
          </div>
          <div>
            <p className="font-headline text-lg font-black uppercase tracking-[0.18em] text-primary">
              Star Dewedar
            </p>
            <p className="mt-2 text-[11px] font-label font-bold uppercase tracking-[0.24em] text-secondary">
              {loadingLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
