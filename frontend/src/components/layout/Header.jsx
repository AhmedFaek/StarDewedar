import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'

const AuthModal = lazy(() => import('./AuthModal.jsx'))
const MyRequestsPanel = lazy(() => import('./MyRequestsPanel.jsx'))
const ChangePasswordModal = lazy(() => import('./ChangePasswordModal.jsx'))
import { getUser, isLoggedIn } from '../../utils/auth.js'
import { api } from '../../utils/api.js'
import { getApiErrorMessage } from '../../utils/apiErrorHandler.js'
import { useNotification } from '../../hooks/useNotification.js'

const getUserInitials = (name) => {
  const nameParts = name?.trim().split(/\s+/).filter(Boolean) ?? []
  if (nameParts.length === 0) return '?'
  return `${nameParts[0][0]}${nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : ''}`.toUpperCase()
}

export default function Header() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { showSuccess, showError } = useNotification()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // ── Auth state ────────────────────────────────────────────────────────────
  const [user, setUser] = useState(() => (isLoggedIn() ? getUser() : null))
  const [authModal, setAuthModal] = useState({ open: false, tab: 'login' })
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [requestsPanelOpen, setRequestsPanelOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
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
  const searchParams = new URLSearchParams(location.search)
  const reqType = searchParams.get('type')
  const currentPage = path.startsWith('/request-quote') || (path.startsWith('/request') && reqType === 'quote') ? 'quote'
    : path.startsWith('/request-visit') || (path.startsWith('/request') && reqType === 'visit') ? 'visit'
    : path.startsWith('/request') && reqType === 'boq' ? 'boq'
    : path.startsWith('/request') ? 'request'
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
      showSuccess(t('notifications.logoutSuccess'))
    } catch (err) {
      showError(getApiErrorMessage(err, { t }))
    } finally {
      setUser(null)
      setLoggingOut(false)
    }
  }

  // ── Shared button classes ─────────────────────────────────────────────────

  const ctaBase = 'font-headline font-bold uppercase text-[10px] lg:text-[11px] px-3.5 py-2 tracking-wider transition-all border focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'

  return (
    <>
      <header className="fixed top-0 left-0 w-full flex justify-between items-center px-4 sm:px-8 h-[60px] sm:h-[66px] bg-white border-b border-slate-100 shadow-[0_2px_10px_rgba(16,42,67,0.03)] z-50 transition-all">
        {/* Logo */}
        <button
          onClick={handleLogoClick}
          className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-none transition-opacity hover:opacity-90"
          aria-label="Star Dewedar Home"
        >
          <picture>
            <source srcSet="/logo/primary_logo.webp" type="image/webp" />
            <img
              src="/logo/primary_logo.png"
              alt="Star Dewedar"
              width={245}
              height={56}
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </picture>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6 lg:space-x-8 rtl:space-x-reverse items-center">
          {navLinks.map((link) => (
            <a
              key={link.key}
              href={`#${link.key.toLowerCase()}`}
              onClick={() => handleNavClick(link.key)}
              className={`font-headline tracking-tight font-bold uppercase text-xs lg:text-[13px] transition-colors duration-200 pb-0.5 ${activeLink === link.key && !currentPage
                ? 'text-primary border-b-2 border-primary'
                : 'text-deep-blue/80 border-b-2 border-transparent hover:text-primary hover:border-primary/30'
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
            className="font-headline font-bold uppercase text-[10px] lg:text-[11px] px-2.5 py-1.5 tracking-wider transition-all border border-slate-200 text-deep-blue hover:bg-slate-50 hover:text-primary hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-none"
            aria-label="Switch language"
          >
            {i18n.language === 'ar' ? 'EN' : 'AR'}
          </button>

          <button
            onClick={() => { setMobileMenuOpen(false); navigate('/request') }}
            className={`${ctaBase} ${path.startsWith('/request')
              ? 'bg-primary-dark border-primary-dark text-white'
              : 'bg-primary border-primary text-white hover:bg-primary-dark hover:border-primary-dark shadow-xs'
              } rounded-none`}
          >
            {t('nav.request')}
          </button>

          {/* ── Profile icon + dropdown ───────────────────────────────────── */}
          <div className="relative" ref={userMenuRef}>
            <button
              id="header-profile-btn"
              onClick={() => setUserMenuOpen(o => !o)}
              aria-label="Account"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              title={user ? user.name : t('auth.login')}
              className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all border focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                user
                  ? 'bg-primary border-primary hover:bg-primary-dark'
                  : 'bg-transparent border-slate-200 text-deep-blue hover:bg-slate-50 hover:border-primary hover:text-primary'
              }`}
            >
              {user ? (
                <span className="text-white text-xs font-black leading-none">
                  {getUserInitials(user.name)}
                </span>
              ) : (
                <span className="material-symbols-outlined text-[18px] leading-none">person</span>
              )}
              <span className="material-symbols-outlined absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-primary shadow-xs text-[12px] leading-none">
                expand_more
              </span>
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 rtl:left-0 rtl:right-auto top-full mt-2 w-52 bg-white shadow-2xl border border-slate-100 z-[100]" style={{ animation: 'slideDown 0.15s ease' }}>
                {user ? (
                  /* ── Logged-in dropdown ── */
                  <>
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-xs font-black shrink-0">
                        {getUserInitials(user.name)}
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
                      <span className="material-symbols-outlined text-base leading-none text-primary">request_quote</span>
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
                      id="header-messages-btn"
                      onClick={() => { setUserMenuOpen(false); navigate('/messages') }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-left text-xs font-headline font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="material-symbols-outlined text-base leading-none text-sky-400">support_agent</span>
                      {t('messages.title')}
                    </button>
                    <button
                      id="header-change-password-btn"
                      onClick={() => { setUserMenuOpen(false); setChangePasswordOpen(true) }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-left text-xs font-headline font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <span className="material-symbols-outlined text-base leading-none text-slate-400">lock</span>
                      {t('auth.changePassword')}
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
          className="md:hidden text-deep-blue hover:text-primary transition-colors p-1.5 focus-visible:ring-2 focus-visible:ring-primary rounded-none"
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined text-2xl">
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white shadow-xl md:hidden border-b border-slate-100 animate-fadeIn">
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.key}
                  href={`#${link.key.toLowerCase()}`}
                  onClick={() => handleNavClick(link.key)}
                  className={`block py-2 font-headline font-bold uppercase text-sm transition-colors ${activeLink === link.key && !currentPage
                    ? 'text-primary'
                    : 'text-deep-blue hover:text-primary'
                    }`}
                >
                  {link.label}
                </a>
              ))}

              <div className="pt-2 flex flex-col gap-2">
                {/* Mobile Language Switcher */}
                <button
                  onClick={toggleLanguage}
                  className="w-full text-left rtl:text-right py-3 px-4 font-headline font-bold uppercase text-xs tracking-widest transition-all bg-slate-100 text-deep-blue hover:bg-slate-200 rounded-none"
                >
                  {i18n.language === 'ar' ? 'English' : 'العربية'}
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); navigate('/request') }}
                  className={`w-full text-left rtl:text-right py-3 px-4 font-headline font-bold uppercase text-xs tracking-widest transition-all ${path.startsWith('/request') ? 'bg-primary-dark text-white' : 'bg-primary text-white hover:bg-primary-dark'
                    } rounded-none shadow-xs`}
                >
                  {t('nav.request')}
                </button>

                {/* Mobile auth */}
                {user ? (
                  <div className="border-t border-slate-200 pt-2 space-y-1">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-xs font-black shrink-0">
                        {getUserInitials(user.name)}
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
                      <span className="material-symbols-outlined text-base leading-none text-primary">request_quote</span>
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
                      id="mobile-change-password-btn"
                      onClick={() => { setMobileMenuOpen(false); setChangePasswordOpen(true) }}
                      className="w-full flex items-center gap-2 text-left py-3 px-4 font-headline font-bold uppercase text-xs tracking-widest text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base leading-none text-slate-400">lock</span>
                      {t('auth.changePassword')}
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

      {/* Lazy-loaded modals — rendered outside the header so they're not clipped */}
      <Suspense fallback={null}>
        <AuthModal
          isOpen={authModal.open}
          defaultTab={authModal.tab}
          onClose={() => setAuthModal(p => ({ ...p, open: false }))}
          onAuthSuccess={handleAuthSuccess}
        />

        <MyRequestsPanel
          isOpen={requestsPanelOpen}
          onClose={() => setRequestsPanelOpen(false)}
          user={user}
        />

        <ChangePasswordModal
          isOpen={changePasswordOpen}
          onClose={() => setChangePasswordOpen(false)}
          onSuccess={() => setUser(null)}
        />
      </Suspense>
    </>
  )
}
