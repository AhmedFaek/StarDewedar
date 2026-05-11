import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthModal from './AuthModal.jsx'
import MyRequestsPanel from './MyRequestsPanel.jsx'
import { getUser, isLoggedIn } from '../../utils/auth.js'
import { api } from '../../utils/api.js'

export default function Header() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // ── Auth state ────────────────────────────────────────────────────────────
  const [user, setUser] = useState(() => (isLoggedIn() ? getUser() : null))
  const [authModal, setAuthModal] = useState({ open: false, tab: 'login' })
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [requestsPanelOpen, setRequestsPanelOpen] = useState(false)
  const userMenuRef = useRef(null)

  const isRTL = i18n.language === 'ar'

  // ── Derive active state from current URL (always in sync) ─────────────────
  const path = location.pathname
  const activeLink = path.startsWith('/products') || path.startsWith('/product-detail')
    ? 'Products'
    : path.startsWith('/projects') || path.startsWith('/project-detail')
    ? 'Projects'
    : path.startsWith('/about') ? 'About'
    : path.startsWith('/contact') ? 'Contact'
    : null
  const currentPage = path.startsWith('/request-quote') ? 'quote'
    : path.startsWith('/request-visit') ? 'visit'
    : ''

  const navLinks = [
    { key: 'Products', label: t('nav.products') },
    { key: 'Projects', label: t('nav.projects') },
    { key: 'About', label: t('nav.about') },
    { key: 'Contact', label: t('nav.contact') },
  ]

  // Update document direction when language changes
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = i18n.language
  }, [i18n.language, isRTL])

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar'
    i18n.changeLanguage(newLang)
  }

  const handleLogoClick = () => {
    setMobileMenuOpen(false)
    navigate('/')
  }

  const handleNavClick = (link) => {
    const routes = { Products: '/products', Projects: '/projects', About: '/about', Contact: '/contact' }
    if (routes[link]) navigate(routes[link])
    setMobileMenuOpen(false)
  }

  // ── Auth handlers ─────────────────────────────────────────────────────────

  const openLogin = () => {
    setMobileMenuOpen(false)
    setAuthModal({ open: true, tab: 'login' })
  }

  const openRegister = () => {
    setMobileMenuOpen(false)
    setAuthModal({ open: true, tab: 'register' })
  }

  const handleAuthSuccess = (userData) => {
    setUser(userData)
    setAuthModal({ open: false, tab: 'login' })
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    setUserMenuOpen(false)
    try {
      await api.logout()
    } catch {
      // clearAuth is called in api.logout().finally() regardless
    } finally {
      setUser(null)
      setLoggingOut(false)
    }
  }

  // ── Shared button classes ─────────────────────────────────────────────────

  const ctaBase = 'font-headline font-bold uppercase text-[10px] lg:text-xs px-4 py-2 tracking-widest transition-all border'

  return (
    <>
      <header className="fixed top-0 left-0 w-full flex justify-between items-center px-4 sm:px-8 py-4 bg-slate-50/80 backdrop-blur-md z-50">
        {/* Logo */}
        <button onClick={handleLogoClick}>
          <img
            src="/logo/logo.png"
            alt="Star Dewedar"
            className="h-16 sm:h-20 lg:h-24 w-auto object-contain"
          />
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6 rtl:space-x-reverse">
          {navLinks.map((link) => (
            <a
              key={link.key}
              href={`#${link.key.toLowerCase()}`}
              onClick={() => handleNavClick(link.key)}
              className={`font-headline tracking-tight font-bold uppercase text-sm transition-colors duration-300 pb-1 ${activeLink === link.key && !currentPage
                ? 'text-slate-950 border-b-2 border-yellow-400'
                : 'text-slate-600 border-b-2 border-transparent hover:text-yellow-500'
                }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA Buttons + Auth + Lang Switch — Desktop */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="font-headline font-bold uppercase text-[10px] lg:text-xs px-3 py-2 tracking-widest transition-all border border-slate-300 text-slate-900 hover:bg-slate-100"
            aria-label="Switch language"
          >
            {i18n.language === 'ar' ? 'EN' : 'AR'}
          </button>

          <button
            onClick={() => { setMobileMenuOpen(false); navigate('/request-visit') }}
            className={`${ctaBase} ${currentPage === 'visit'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'border-slate-300 text-slate-900 hover:bg-slate-100'
              }`}
          >
            {t('nav.requestVisit')}
          </button>

          <button
            onClick={() => { setMobileMenuOpen(false); navigate('/request-quote') }}
            className={`${ctaBase} border-transparent ${currentPage === 'quote'
              ? 'bg-tertiary text-white hover:bg-tertiary-fixedDim'
              : 'bg-tertiary-fixed text-on-tertiary-fixed hover:bg-white hover:border-tertiary-fixed'
              }`}
          >
            {t('nav.requestQuote')}
          </button>

          {/* ── Profile icon + dropdown ───────────────────────────────────── */}
          <div className="relative" ref={userMenuRef}>
            <button
              id="header-profile-btn"
              onClick={() => setUserMenuOpen(o => !o)}
              aria-label="Account"
              title={user ? user.name : t('auth.login')}
              className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all border ${
                user
                  ? 'bg-yellow-400 border-yellow-400 hover:bg-yellow-300'
                  : 'bg-transparent border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {user ? (
                <span className="text-slate-900 text-sm font-black leading-none">
                  {user.name?.charAt(0).toUpperCase() ?? '?'}
                </span>
              ) : (
                <span className="material-symbols-outlined text-[20px] leading-none">person</span>
              )}
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 rtl:left-0 rtl:right-auto top-full mt-2 w-52 bg-white shadow-2xl border border-slate-100 z-[100]" style={{ animation: 'slideDown 0.15s ease' }}>
                {user ? (
                  /* ── Logged-in dropdown ── */
                  <>
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-400 text-slate-900 text-xs font-black shrink-0">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      id="header-my-requests-btn"
                      onClick={() => { setUserMenuOpen(false); setRequestsPanelOpen(true) }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-left text-xs font-headline font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="material-symbols-outlined text-base leading-none text-yellow-500">request_quote</span>
                      {t('myRequests.title')}
                    </button>
                    <button
                      id="header-saved-btn"
                      onClick={() => { setUserMenuOpen(false); navigate('/saved-products') }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-left text-xs font-headline font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="material-symbols-outlined text-base leading-none text-red-400"
                        style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                      {t('favourites.mySaved')}
                    </button>
                    <button
                      id="header-logout-btn"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-2 px-4 py-3 text-left text-xs font-headline font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-base leading-none">logout</span>
                      {loggingOut ? t('auth.loggingOut') : t('auth.logout')}
                    </button>
                  </>
                ) : (
                  /* ── Logged-out dropdown ── */
                  <>
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-400">{t('auth.account')}</p>
                    </div>
                    <button
                      id="header-login-btn"
                      onClick={() => { setUserMenuOpen(false); openLogin() }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-headline font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base leading-none">login</span>
                      {t('auth.login')}
                    </button>
                    <button
                      id="header-register-btn"
                      onClick={() => { setUserMenuOpen(false); openRegister() }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-headline font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
                    >
                      <span className="material-symbols-outlined text-base leading-none">person_add</span>
                      {t('auth.register')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <style>{`
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-slate-950 hover:opacity-70 transition-opacity"
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined text-2xl">
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-slate-50 shadow-lg md:hidden border-b border-slate-200">
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.key}
                  href={`#${link.key.toLowerCase()}`}
                  onClick={() => handleNavClick(link.key)}
                  className={`block py-2 font-headline font-bold uppercase text-sm transition-colors ${activeLink === link.key && !currentPage
                    ? 'text-yellow-500'
                    : 'text-slate-600 hover:text-slate-950'
                    }`}
                >
                  {link.label}
                </a>
              ))}

              <div className="pt-2 flex flex-col gap-2">
                {/* Mobile Language Switcher */}
                <button
                  onClick={toggleLanguage}
                  className="w-full text-left py-3 px-4 font-headline font-bold uppercase text-xs tracking-widest transition-all bg-slate-200 text-slate-900"
                >
                  {i18n.language === 'ar' ? 'English' : 'العربية'}
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); navigate('/request-visit') }}
                  className={`w-full text-left py-3 px-4 font-headline font-bold uppercase text-xs tracking-widest transition-all border ${currentPage === 'visit' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'
                    }`}
                >
                  {t('nav.requestVisit')}
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); navigate('/request-quote') }}
                  className={`w-full text-left py-3 px-4 font-headline font-bold uppercase text-xs tracking-widest transition-all ${currentPage === 'quote' ? 'bg-tertiary text-white' : 'bg-tertiary-fixed text-on-tertiary-fixed'
                    }`}
                >
                  {t('nav.requestQuote')}
                </button>

                {/* Mobile auth */}
                {user ? (
                  <div className="border-t border-slate-200 pt-2 space-y-1">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-400 text-slate-900 text-xs font-black shrink-0">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{user.name}</p>
                        <p className="text-[10px] text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <button
                      id="mobile-my-requests-btn"
                      onClick={() => { setMobileMenuOpen(false); setRequestsPanelOpen(true) }}
                      className="w-full flex items-center gap-2 text-left py-3 px-4 font-headline font-bold uppercase text-xs tracking-widest text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base leading-none text-yellow-500">request_quote</span>
                      {t('myRequests.title')}
                    </button>
                    <button
                      id="mobile-saved-btn"
                      onClick={() => { setMobileMenuOpen(false); navigate('/saved-products') }}
                      className="w-full flex items-center gap-2 text-left py-3 px-4 font-headline font-bold uppercase text-xs tracking-widest text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base leading-none text-red-400"
                        style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                      {t('favourites.mySaved')}
                    </button>
                    <button
                      id="mobile-logout-btn"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-2 text-left py-3 px-4 font-headline font-bold uppercase text-xs tracking-widest text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-base leading-none">logout</span>
                      {loggingOut ? t('auth.loggingOut') : t('auth.logout')}
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-slate-200 pt-2 flex flex-col gap-2">
                    <button
                      id="mobile-login-btn"
                      onClick={openLogin}
                      className="w-full flex items-center gap-3 text-left py-3 px-4 font-headline font-bold uppercase text-xs tracking-widest bg-slate-100 text-slate-900 hover:bg-slate-200 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base leading-none">login</span>
                      {t('auth.login')}
                    </button>
                    <button
                      id="mobile-register-btn"
                      onClick={openRegister}
                      className="w-full flex items-center gap-3 text-left py-3 px-4 font-headline font-bold uppercase text-xs tracking-widest bg-slate-900 text-white hover:bg-slate-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base leading-none">person_add</span>
                      {t('auth.register')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal — rendered outside the header so it's not clipped */}
      <AuthModal
        isOpen={authModal.open}
        defaultTab={authModal.tab}
        onClose={() => setAuthModal(p => ({ ...p, open: false }))}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* My Requests Panel */}
      <MyRequestsPanel
        isOpen={requestsPanelOpen}
        onClose={() => setRequestsPanelOpen(false)}
        user={user}
      />
    </>
  )
}