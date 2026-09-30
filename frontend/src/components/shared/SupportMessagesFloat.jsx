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
      className={`fixed z-[199] w-[56px] h-[56px] pointer-events-none transition-[bottom] duration-300 ease-out
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
          className={`pointer-events-auto absolute bottom-[68px] w-[270px] sm:w-[290px] bg-white rounded-2xl p-3.5 sm:p-4 shadow-[0_12px_36px_rgba(0,14,36,0.18)] border border-slate-100 cursor-pointer select-none transition-all duration-300 animate-bubble-pop-in group hover:shadow-[0_16px_40px_rgba(0,14,36,0.24)] hover:border-slate-200
            ${isRTL ? 'left-0' : 'right-0'}`}
          role="alert"
          aria-live="polite"
        >
          {/* Arrow pointing to floating button */}
          <span
            className={`absolute -bottom-1.5 w-3.5 h-3.5 bg-white border-b border-slate-100 transform rotate-45
              ${isRTL ? 'left-[19px] border-l' : 'right-[19px] border-r'}`}
          />

          {/* Header: Agent Avatar + Support Title + Online Indicator + Close Button */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative w-6 h-6 rounded-full bg-[#000e24] flex items-center justify-center text-white shrink-0">
                <span
                  className="material-symbols-outlined text-[15px] leading-none"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                >
                  support_agent
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-headline font-bold text-slate-900 leading-tight truncate">
                  {t('messages.supportTeam')}
                </p>
                <p className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1 leading-tight">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  {t('messages.onlineNow')}
                </p>
              </div>
            </div>

            {/* Dismiss button */}
            <button
              id="dismiss-support-bubble-btn"
              onClick={handleDismiss}
              className="text-slate-300 hover:text-slate-600 transition-colors p-1 -mr-1 -mt-1 rounded-full hover:bg-slate-50"
              aria-label="Close"
              title="Dismiss"
            >
              <span className="material-symbols-outlined text-[16px] leading-none block">close</span>
            </button>
          </div>

          {/* Greeting message text requested by user */}
          <p className="text-[13px] text-slate-800 font-medium leading-snug font-body">
            {t('messages.greetingBubble')}
          </p>

          {/* Bottom call to action hint */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-primary font-headline font-bold">
            <span className="group-hover:underline flex items-center gap-1">
              {t('messages.startChatPrompt')}
              <span className="material-symbols-outlined text-[13px] leading-none transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
                {isRTL ? 'arrow_back' : 'arrow_forward'}
              </span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal font-mono">
              24h reply
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
        className="pointer-events-auto relative flex items-center justify-center w-[56px] h-[56px] no-underline focus:outline-none"
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
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: hovered ? '#00234b' : '#000e24',
            boxShadow: hovered
              ? '0 8px 28px rgba(0,14,36,0.55)'
              : '0 4px 18px rgba(0,14,36,0.38)',
            border: '1.5px solid rgba(255,255,255,0.18)',
            transition: 'background 0.25s ease, box-shadow 0.25s ease, transform 0.2s ease',
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <span
            className="material-symbols-outlined text-[28px] text-white select-none"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
            aria-hidden="true"
          >
            support_agent
          </span>

          {/* Active online green badge */}
          <span
            className={`absolute top-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#000e24] shadow-sm flex items-center justify-center
              ${isRTL ? 'left-0.5' : 'right-0.5'}`}
          >
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          </span>
        </span>
      </Link>
    </div>
  )
}
