import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCompare } from '../../utils/compareContext'

// Height of the CompareDrawer bar (px) — keep in sync with the drawer padding
const DRAWER_HEIGHT = 72

export default function SupportMessagesFloat() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { compareList } = useCompare()

  const [hovered, setHovered] = useState(false)
  const [isBubbleOpen, setIsBubbleOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [hasDismissed, setHasDismissed] = useState(false)

  const isRTL = i18n.language === 'ar'
  const drawerOpen = compareList.length > 0
  const bottomOffset = drawerOpen ? DRAWER_HEIGHT + 16 : 28

  const hoveredRef = useRef(false)
  const dismissedRef = useRef(false)
  const autoHideTimerRef = useRef(null)
  const animTimeoutRef = useRef(null)

  const triggerAnimationAndBubble = () => {
    setIsAnimating(true)
    setIsBubbleOpen(true)

    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current)
    animTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false)
    }, 1200)

    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current)
    autoHideTimerRef.current = setTimeout(() => {
      if (!hoveredRef.current) {
        setIsBubbleOpen(false)
      }
    }, 8000)
  }

  // Periodic attention animation & greeting popup
  useEffect(() => {
    if (location.pathname.startsWith('/messages')) return

    // Initial popup after 2.5s
    const initialTimer = setTimeout(() => {
      if (!dismissedRef.current && !hoveredRef.current) {
        triggerAnimationAndBubble()
      }
    }, 2500)

    // Periodic reminder every 20 seconds
    const intervalTimer = setInterval(() => {
      if (!dismissedRef.current && !hoveredRef.current) {
        triggerAnimationAndBubble()
      }
    }, 20000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(intervalTimer)
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current)
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current)
    }
  }, [location.pathname])

  const handleMouseEnter = () => {
    hoveredRef.current = true
    setHovered(true)
    setIsBubbleOpen(true)
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current)
  }

  const handleMouseLeave = () => {
    hoveredRef.current = false
    setHovered(false)
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current)
    autoHideTimerRef.current = setTimeout(() => {
      if (!hoveredRef.current) {
        setIsBubbleOpen(false)
      }
    }, 2500)
  }

  const handleDismiss = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsBubbleOpen(false)
    dismissedRef.current = true
    setHasDismissed(true)
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current)
  }

  const handleBubbleClick = () => {
    navigate('/messages')
  }

  // Hide on messages pages so it doesn't overlap the chat UI
  if (location.pathname.startsWith('/messages')) {
    return null
  }

  return (
    <div
      className={`fixed z-[199] w-[44px] h-[44px] pointer-events-none transition-[bottom] duration-300 ease-out
        ${isRTL ? 'left-4 sm:left-7' : 'right-4 sm:right-7'}`}
      style={{
        bottom: `${bottomOffset}px`,
      }}
    >
      {/* ── Greeting Speech Bubble ────────────────────────────────────────── */}
      {isBubbleOpen && (
        <div
          onClick={handleBubbleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`pointer-events-auto absolute bottom-[54px] w-[230px] sm:w-[245px] bg-white rounded-xl p-3 shadow-[0_10px_30px_rgba(0,14,36,0.16)] border border-slate-100 cursor-pointer select-none transition-all duration-300 animate-bubble-pop-in group hover:shadow-[0_14px_34px_rgba(0,14,36,0.22)] hover:border-slate-200
            ${isRTL ? 'left-0' : 'right-0'}`}
          role="alert"
          aria-live="polite"
        >
          {/* Arrow pointing to floating button */}
          <span
            className={`absolute -bottom-1.5 w-3 h-3 bg-white border-b border-slate-100 transform rotate-45
              ${isRTL ? 'left-[16px] border-l' : 'right-[16px] border-r'}`}
          />

          {/* Header: Agent Avatar + Support Title + Online Indicator + Close Button */}
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="relative w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                <span
                  className="material-symbols-outlined text-[13px] leading-none"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                >
                  support_agent
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] rtl:text-[10.5px] font-headline font-bold text-slate-900 leading-tight truncate">
                  {t('messages.supportTeam')}
                </p>
              </div>
            </div>

            {/* Dismiss button */}
            <button
              id="dismiss-support-bubble-btn"
              onClick={handleDismiss}
              className="text-slate-300 hover:text-slate-600 transition-colors p-0.5 -mr-0.5 -mt-0.5 rounded-full hover:bg-slate-50"
              aria-label="Close"
              title="Dismiss"
            >
              <span className="material-symbols-outlined text-[14px] leading-none block">close</span>
            </button>
          </div>

          {/* Greeting message text requested by user */}
          <p className="text-[11px] rtl:text-[10.5px] rtl:leading-relaxed text-slate-700 font-medium leading-snug font-body">
            {t('messages.greetingBubble')}
          </p>

          {/* Bottom call to action hint */}
          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] rtl:text-[9.5px] text-primary font-headline font-bold">
            <span className="group-hover:underline flex items-center gap-1">
              {t('messages.startChatPrompt')}
              <span className="material-symbols-outlined text-[11px] rtl:text-[11px] leading-none transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
                {isRTL ? 'arrow_back' : 'arrow_forward'}
              </span>
            </span>
            <span className="text-[9px] rtl:text-[9px] text-slate-400 font-normal font-mono">
              {isRTL ? 'خلال 24 ساعة' : '24h reply'}
            </span>
          </div>
        </div>
      )}

      {/* ── Floating Action Button ────────────────────────────────────────── */}
      <Link
        to="/messages"
        id="floating-support-messages-btn"
        aria-label={t('messages.title')}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="pointer-events-auto relative flex items-center justify-center w-[44px] h-[44px] no-underline focus:outline-none"
      >
        {/* Animated radar pulse ring when attention triggers */}
        {isAnimating && (
          <span className="absolute inset-0 rounded-full bg-primary/30 animate-float-pulse-ring pointer-events-none" />
        )}

        {/* Support Messages circle button */}
        <span
          className={isAnimating ? 'animate-float-wiggle' : ''}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: hovered ? '#145D94' : '#1B75BA',
            boxShadow: hovered
              ? '0 6px 20px rgba(27,117,186,0.50)'
              : '0 3px 14px rgba(27,117,186,0.35)',
            border: '1px solid rgba(255,255,255,0.22)',
            transition: 'background 0.25s ease, box-shadow 0.25s ease, transform 0.2s ease',
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <span
            className="material-symbols-outlined text-[22px] text-white select-none"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
            aria-hidden="true"
          >
            support_agent
          </span>

          {/* Active online green badge */}
          <span
            className={`absolute top-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-primary shadow-xs flex items-center justify-center
              ${isRTL ? 'left-0.5' : 'right-0.5'}`}
          >
            <span className="w-1 h-1 bg-white rounded-full animate-ping" />
          </span>
        </span>
      </Link>
    </div>
  )
}
