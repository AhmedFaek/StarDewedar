import { useEffect, useState } from 'react'

const VARIANTS = {
  success: {
    wrapper: 'border-emerald-200 bg-emerald-50/95 text-emerald-950 shadow-emerald-100/60',
    icon: 'check_circle',
    iconBg: 'bg-emerald-500 text-white',
  },
  error: {
    wrapper: 'border-red-200 bg-red-50/95 text-red-950 shadow-red-100/60',
    icon: 'error',
    iconBg: 'bg-red-500 text-white',
  },
  warning: {
    wrapper: 'border-amber-200 bg-amber-50/95 text-amber-950 shadow-amber-100/60',
    icon: 'warning',
    iconBg: 'bg-amber-400 text-amber-950',
  },
  info: {
    wrapper: 'border-sky-200 bg-sky-50/95 text-sky-950 shadow-sky-100/60',
    icon: 'info',
    iconBg: 'bg-sky-500 text-white',
  },
}

export default function Toast({ toast, onClose, dir = 'ltr' }) {
  const variant = VARIANTS[toast.type] || VARIANTS.info
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEntered(true))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const isRtl = dir === 'rtl'

  return (
    <div
      dir={dir}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      className={[
        'pointer-events-auto w-full overflow-hidden rounded-2xl border backdrop-blur-xl',
        'transition-all duration-300 ease-out will-change-transform',
        variant.wrapper,
        entered && !toast.closing
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-2 opacity-0 scale-[0.98]',
      ].join(' ')}
    >
      <div className={`flex items-start gap-3 p-4 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${variant.iconBg}`}>
          <span className="material-symbols-outlined text-[20px] leading-none" style={{ fontVariationSettings: "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24" }}>
            {variant.icon}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          {toast.title && (
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.22em] opacity-70">
              {toast.title}
            </p>
          )}
          <p className="text-sm font-semibold leading-relaxed">{toast.message}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
          aria-label="Dismiss notification"
        >
          <span className="material-symbols-outlined text-[18px] leading-none">close</span>
        </button>
      </div>
    </div>
  )
}
