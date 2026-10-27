import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Icon from '../shared/Icon'

export default function QuoteSidebar({ variant = 'quote' }) {
  const { t } = useTranslation()
  const translationKey =
    variant === 'boq'
      ? 'requestBOQ'
      : variant === 'visit'
      ? 'requestVisit'
      : 'requestQuote'

  const iconName =
    variant === 'boq'
      ? 'description'
      : variant === 'visit'
      ? 'engineering'
      : 'request_quote'

  const benefits = [
    {
      icon: variant === 'boq' ? 'receipt_long' : variant === 'visit' ? 'speed' : 'schedule',
      text: t(`${translationKey}.benefit1`),
    },
    {
      icon: 'verified',
      text: t(`${translationKey}.benefit2`),
    },
    {
      icon: 'support_agent',
      text: t(`${translationKey}.benefit3`),
    },
  ]

  return (
    <aside className="hidden lg:col-span-4 lg:flex flex-col justify-between bg-gradient-to-b from-[#102A43] via-[#0D2338] to-[#0A1A2B] text-white p-7 sm:p-8 lg:p-9 relative overflow-hidden">
      {/* Decorative architectural ambient glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-sky-400/10 blur-2xl pointer-events-none" />

      <div className="relative z-10">
        {/* SDC Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] sm:text-[11px] font-headline font-bold uppercase tracking-wider text-sky-300">
          <Icon icon={iconName} className="text-sm" />
          <span>{t(`${translationKey}.sidebarBadge`)}</span>
        </div>

        {/* Heading */}
        <h2 className="text-xl sm:text-2xl font-headline font-bold tracking-tight text-white mt-4 leading-snug">
          {t(`${translationKey}.sidebarTitle1`)}{' '}
          <span className="text-primary-light block sm:inline">
            {t(`${translationKey}.sidebarTitle2`)}
          </span>
        </h2>

        {/* Description */}
        <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed font-body">
          {t(`${translationKey}.sidebarDesc`)}
        </p>

        {/* Benefits list */}
        <div className="mt-7 space-y-3.5 pt-5 border-t border-white/10">
          {benefits.map((b, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary/20 text-sky-300 flex items-center justify-center shrink-0 border border-primary/30">
                <Icon icon={b.icon} className="text-sm" />
              </div>
              <span className="text-xs text-slate-200 font-medium leading-snug">
                {b.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Help Footer */}
      <div className="relative z-10 pt-6 mt-8 border-t border-white/10">
        <p className="text-[11px] font-headline uppercase tracking-wider text-slate-400 font-semibold mb-1">
          {t('requestPage.needAssistance', 'Need immediate assistance?')}
        </p>
        <Link
          to="/contact"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-300 hover:text-white transition-colors group"
        >
          <span>{t('requestPage.contactOurTeam', 'Contact our engineering desk')}</span>
          <Icon
            icon="arrow_forward"
            className="text-sm transition-transform rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
          />
        </Link>
      </div>
    </aside>
  )
}
