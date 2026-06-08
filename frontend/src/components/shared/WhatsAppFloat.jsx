import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCompare } from '../../utils/compareContext'

const WHATSAPP_NUMBER = '201000108529' // international format, no +
const WHATSAPP_MESSAGE = encodeURIComponent('Hello! I found you through your website and would like to learn more.')

// Height of the CompareDrawer bar (px) — keep in sync with the drawer padding
const DRAWER_HEIGHT = 72

export default function WhatsAppFloat() {
  const { t, i18n } = useTranslation()
  const [hovered, setHovered] = useState(false)
  const { compareList } = useCompare()

  const isRTL = i18n.language === 'ar'
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`
  const drawerOpen = compareList.length > 0

  // Lift the button above the drawer when it's visible
  const bottomOffset = drawerOpen ? DRAWER_HEIGHT + 16 : 28

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`fixed z-[199] flex items-center justify-center w-[56px] h-[56px] no-underline transition-[bottom] duration-300 ease-out
        ${isRTL ? 'left-4 sm:left-7' : 'right-4 sm:right-7'}`}
      style={{
        bottom: `${bottomOffset}px`,
      }}
    >
      {/* Label pill — absolute positioned so it doesn't push the icon, hidden on mobile */}
      <span
        className={`absolute hidden md:block whitespace-nowrap bg-white text-[#128C7E] text-[11px] font-bold tracking-wider uppercase px-3.5 py-1.5 rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.15)] pointer-events-none transition-all duration-200 ease-out
          ${hovered ? 'opacity-100 translate-x-0' : 'opacity-0 ' + (isRTL ? '-translate-x-2' : 'translate-x-2')}
          ${isRTL ? 'left-full ml-3' : 'right-full mr-3'}`}
      >
        {t('whatsapp.chatWithUs')}
      </span>

      {/* WhatsApp circle button */}
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: hovered ? '#075E54' : '#25D366',
          boxShadow: hovered
            ? '0 4px 20px rgba(37,211,102,0.55)'
            : '0 4px 14px rgba(37,211,102,0.4)',
          transition: 'background 0.25s ease, box-shadow 0.25s ease, transform 0.2s ease',
          transform: hovered ? 'scale(1.1)' : 'scale(1)',
          flexShrink: 0,
        }}
      >
        {/* WhatsApp SVG icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          width="28"
          height="28"
          fill="#fff"
          aria-hidden="true"
        >
          <path d="M16.003 2.667C8.637 2.667 2.667 8.637 2.667 16c0 2.364.635 4.576 1.74 6.488L2.667 29.333l6.99-1.712A13.27 13.27 0 0 0 16.003 29.333C23.369 29.333 29.333 23.369 29.333 16S23.369 2.667 16.003 2.667zm0 2.4c6.02 0 10.93 4.91 10.93 10.933 0 6.023-4.91 10.933-10.93 10.933a10.89 10.89 0 0 1-5.604-1.543l-.4-.24-4.15 1.016 1.048-3.996-.266-.413A10.888 10.888 0 0 1 5.073 16c0-6.023 4.91-10.933 10.93-10.933zm-3.06 5.2c-.213 0-.56.08-.854.4-.293.32-1.12 1.093-1.12 2.667s1.147 3.093 1.307 3.306c.16.214 2.253 3.44 5.466 4.694 2.68 1.053 3.213.84 3.8.787.586-.053 1.893-.773 2.16-1.52.267-.747.267-1.387.187-1.52-.08-.133-.293-.213-.613-.373-.32-.16-1.893-.933-2.187-1.04-.293-.107-.506-.16-.72.16-.213.32-.826 1.04-.986 1.253-.16.213-.32.24-.64.08-.32-.16-1.353-.5-2.58-1.59-.953-.852-1.596-1.903-1.783-2.223-.186-.32-.02-.493.14-.653.143-.143.32-.373.48-.56.16-.186.213-.32.32-.533.107-.213.053-.4-.027-.56-.08-.16-.706-1.74-.973-2.387-.253-.626-.517-.533-.72-.543-.186-.007-.4-.01-.613-.01z" />
        </svg>
      </span>
    </a>
  )
}
