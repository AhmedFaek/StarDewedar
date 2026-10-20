import { useTranslation } from 'react-i18next'

const ACCENT_STYLES = {
  amber: {
    topBar: 'bg-amber-500',
    iconWrap: 'bg-amber-50 text-amber-600 border border-amber-200/80',
    hoverBorder: 'group-hover:border-amber-300',
    hoverGlow: 'group-hover:shadow-[0_8px_24px_rgba(245,158,11,0.08)]',
  },
  blue: {
    topBar: 'bg-primary',
    iconWrap: 'bg-blue-50 text-primary border border-blue-200/80',
    hoverBorder: 'group-hover:border-primary/40',
    hoverGlow: 'group-hover:shadow-[0_8px_24px_rgba(27,117,186,0.08)]',
  },
  indigo: {
    topBar: 'bg-indigo-500',
    iconWrap: 'bg-indigo-50 text-indigo-600 border border-indigo-200/80',
    hoverBorder: 'group-hover:border-indigo-300',
    hoverGlow: 'group-hover:shadow-[0_8px_24px_rgba(99,102,241,0.08)]',
  },
  emerald: {
    topBar: 'bg-emerald-500',
    iconWrap: 'bg-emerald-50 text-emerald-600 border border-emerald-200/80',
    hoverBorder: 'group-hover:border-emerald-300',
    hoverGlow: 'group-hover:shadow-[0_8px_24px_rgba(16,185,129,0.08)]',
  },
  slate: {
    topBar: 'bg-slate-400',
    iconWrap: 'bg-slate-100 text-slate-600 border border-slate-200/80',
    hoverBorder: 'group-hover:border-slate-300',
    hoverGlow: 'group-hover:shadow-[0_8px_24px_rgba(100,116,139,0.08)]',
  },
}

export const StatCard = ({
  label,
  value,
  subtitle,
  icon,
  accent = 'blue',
  statusType, // 'pending' | 'live' | 'trend'
  pendingCount,
  trend,
  isLive,
  isClickable = false,
  loading = false,
  // Backward compatibility props
  variant,
  badge,
}) => {
  const { t } = useTranslation()

  // Determine actual accent color
  let resolvedAccent = accent
  if (statusType === 'pending' || badge || pendingCount !== undefined) {
    resolvedAccent = 'amber'
  } else if (isLive) {
    resolvedAccent = 'emerald'
  } else if (variant === 'tertiary' || variant === 'gradient') {
    resolvedAccent = 'blue'
  }

  const styles = ACCENT_STYLES[resolvedAccent] || ACCENT_STYLES.blue

  const isPendingCard = statusType === 'pending' || badge || pendingCount !== undefined
  const effectivePending = pendingCount !== undefined ? pendingCount : (typeof value === 'number' ? value : 0)

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs transition-all duration-200 ${styles.hoverBorder} ${styles.hoverGlow} ${
        isClickable ? 'hover:-translate-y-0.5 cursor-pointer' : ''
      }`}
    >
      {/* Semantic Top Accent Strip */}
      <div className={`h-1 w-full shrink-0 ${styles.topBar}`} />

      {/* Card Content Container */}
      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 gap-4">
        {/* Header: Label + Crisp Duotone Icon */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold font-headline uppercase tracking-wider text-slate-500 truncate">
              {label}
            </p>
          </div>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105 ${styles.iconWrap}`}
          >
            <span className="material-symbols-outlined text-[22px] leading-none select-none">
              {icon}
            </span>
          </div>
        </div>

        {/* Center: Main Numerical Value */}
        <div className="flex items-baseline gap-2">
          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-slate-200" />
          ) : (
            <span className="text-3xl sm:text-4xl font-black font-headline tracking-tight text-slate-900">
              {typeof value === 'number' ? value.toLocaleString() : value ?? '—'}
            </span>
          )}
        </div>

        {/* Footer: Dedicated Status Tag / Trend / Context */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {loading ? (
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
            ) : isPendingCard ? (
              effectivePending > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/90 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold font-headline uppercase tracking-wider text-amber-700">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 animate-pulse" />
                  <span>
                    {effectivePending} {t('dashboard.pending', 'Pending')}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/90 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold font-headline uppercase tracking-wider text-emerald-700">
                  <span className="material-symbols-outlined text-[13px] leading-none shrink-0 text-emerald-600">
                    check_circle
                  </span>
                  <span>{t('dashboard.all_clear', 'All Caught Up')}</span>
                </span>
              )
            ) : isLive ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold font-headline uppercase tracking-wider text-emerald-700">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span>{t('dashboard.analytics.live_badge', 'LIVE')}</span>
              </span>
            ) : trend ? (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold font-headline tracking-tight ${
                  trend.isPositive ? 'text-emerald-600' : trend.isNegative ? 'text-rose-600' : 'text-slate-500'
                }`}
              >
                {trend.isPositive && (
                  <span className="material-symbols-outlined text-[15px] leading-none shrink-0">
                    trending_up
                  </span>
                )}
                {trend.isNegative && (
                  <span className="material-symbols-outlined text-[15px] leading-none shrink-0">
                    trending_down
                  </span>
                )}
                <span>{trend.value}</span>
                {trend.label && (
                  <span className="font-medium text-slate-400">{trend.label}</span>
                )}
              </span>
            ) : subtitle ? (
              <span className="truncate text-xs font-medium text-slate-500">
                {subtitle}
              </span>
            ) : null}
          </div>

          {/* Clickable View Hint Indicator */}
          {isClickable && (
            <div className="flex items-center gap-1 shrink-0 text-[11px] font-bold font-headline uppercase tracking-wider text-slate-400 group-hover:text-primary transition-colors">
              <span className="hidden sm:inline">{t('dashboard.view', 'View')}</span>
              <span className="material-symbols-outlined text-sm transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
                arrow_forward
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StatCard
