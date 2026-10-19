import Icon from '../shared/Icon'
import { useTranslation } from 'react-i18next'

export default function QuoteSidebar({ variant = 'quote' }) {
  const { t } = useTranslation()
  const translationKey = variant === 'boq' ? 'requestBOQ' : 'requestQuote'

  return (
    <aside className="hidden lg:col-span-4 lg:flex bg-primary-fixed p-8 sm:p-10 md:p-12 flex-col justify-start">
      <div>
        <span className="text-primary font-headline font-bold uppercase tracking-[0.2em] text-xs">
          {t(`${translationKey}.sidebarBadge`)}
        </span>
        <h1 className="text-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-headline font-bold tracking-tighter mt-5 sm:mt-6 leading-tight">
          {t(`${translationKey}.sidebarTitle1`)} <br />
          {t(`${translationKey}.sidebarTitle2`)}
        </h1>
        <p className="mt-6 sm:mt-8 text-sm md:text-base text-on-surface-variant leading-relaxed max-w-sm">
          {t(`${translationKey}.sidebarDesc`)}
        </p>
      </div>
    </aside>
  )
}
