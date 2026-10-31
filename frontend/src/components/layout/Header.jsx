import { useState, useEffect, useRef, lazy, Suspense, useMemo } from 'react'
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

  // ── Scroll & Drawer states ────────────────────────────────────────────────
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileExpandedSection, setMobileExpandedSection] = useState(null)

  // ── Dropdown / Mega-menu states ───────────────────────────────────────────
  const [activeDropdown, setActiveDropdown] = useState(null) // 'products' | 'projects' | null
  const dropdownTimeoutRef = useRef(null)

  // ── Quick Search state ────────────────────────────────────────────────────
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef(null)
  const searchModalRef = useRef(null)

  // ── Catalog Data Cache ────────────────────────────────────────────────────
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [projects, setProjects] = useState([])

  // ── Auth state ────────────────────────────────────────────────────────────
  const [user, setUser] = useState(() => (isLoggedIn() ? getUser() : null))
  const [authModal, setAuthModal] = useState({ open: false, tab: 'login' })
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [requestsPanelOpen, setRequestsPanelOpen] = useState(false)
  const [requestsRecoveryType, setRequestsRecoveryType] = useState(null)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const userMenuRef = useRef(null)
  const headerContainerRef = useRef(null)

  const isRTL = i18n.language === 'ar'

  // ── Derive active state from current URL ──────────────────────────────────
  const path = location.pathname
  const activeLink = path.startsWith('/products') || path.startsWith('/product-detail')
    ? 'Products'
    : path.startsWith('/projects') || path.startsWith('/project-detail')
    ? 'Projects'
    : path.startsWith('/about') ? 'About'
    : path.startsWith('/contact') ? 'Contact'
    : null

  // ── Load Catalog Data for Dropdowns and Search ────────────────────────────
  useEffect(() => {
    let isMounted = true
    Promise.all([api.getProducts(), api.getCategories(), api.getProjects()])
      .then(([prods, cats, projs]) => {
        if (!isMounted) return
        setProducts(prods || [])
        setCategories(cats || [])
        setProjects(projs || [])
      })
      .catch((err) => {
        console.warn('Header catalog data fetch:', err)
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Filter categories by type
  const productCategories = useMemo(
    () => categories.filter((c) => String(c.type || '').toLowerCase() === 'product'),
    [categories]
  )
  const projectCategories = useMemo(
    () => categories.filter((c) => String(c.type || '').toLowerCase() === 'project'),
    [categories]
  )

  const featuredProduct = products[0] || null
  const featuredProject = projects[0] || null

  // ── Search filtering ──────────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return products
      .filter((p) => {
        const nameEn = (p.name_en || '').toLowerCase()
        const nameAr = (p.name_ar || '').toLowerCase()
        const descEn = (p.description_en || '').toLowerCase()
        const descAr = (p.description_ar || '').toLowerCase()
        const catEn = (p.category?.name_en || '').toLowerCase()
        const catAr = (p.category?.name_ar || '').toLowerCase()
        return (
          nameEn.includes(q) ||
          nameAr.includes(q) ||
          descEn.includes(q) ||
          descAr.includes(q) ||
          catEn.includes(q) ||
          catAr.includes(q)
        )
      })
      .slice(0, 8)
  }, [searchQuery, products])

  // ── Scroll Listener ───────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // ── Document Direction ────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = i18n.language
  }, [i18n.language, isRTL])

  // ── Keyboard Shortcuts (Escape to close, Ctrl/Cmd+K to search) ───────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null)
        setSearchOpen(false)
        setUserMenuOpen(false)
        setMobileMenuOpen(false)
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Auto-focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    } else {
      setSearchQuery('')
    }
  }, [searchOpen])

  // Close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('[data-user-menu]')) {
        setUserMenuOpen(false)
      }
      if (
        headerContainerRef.current &&
        !headerContainerRef.current.contains(e.target) &&
        !e.target.closest('[data-dropdown-container]')
      ) {
        setActiveDropdown(null)
      }
      if (searchModalRef.current && !searchModalRef.current.contains(e.target)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  // ── Dropdown Handlers with Smooth Debounce ────────────────────────────────
  const handleDropdownOpen = (menu) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current)
    setActiveDropdown(menu)
  }

  const handleDropdownClose = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current)
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null)
    }, 150)
  }

  // ── Navigation Handlers ───────────────────────────────────────────────────
  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar'
    i18n.changeLanguage(newLang)
  }

  const handleLogoClick = () => {
    setActiveDropdown(null)
    setMobileMenuOpen(false)
    navigate('/')
  }

  const handleNavClick = (route) => {
    setActiveDropdown(null)
    setMobileMenuOpen(false)
    navigate(route)
  }

  // ── Auth handlers ─────────────────────────────────────────────────────────
  const openLogin = () => {
    setActiveDropdown(null)
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
    setAuthModal({ open: true, tab: 'login' })
  }

  const openRegister = () => {
    setActiveDropdown(null)
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
    setAuthModal({ open: true, tab: 'register' })
  }

  const handleAuthSuccess = (userData) => {
    setUser(userData)
    setAuthModal({ open: false, tab: 'login' })
    if (requestsRecoveryType) setRequestsPanelOpen(true)
  }

  useEffect(() => {
    const handleOpenMyRequests = (event) => {
      setRequestsRecoveryType(event.detail?.requestType || null)
      if (user) {
        setRequestsPanelOpen(true)
      } else {
        setAuthModal({ open: true, tab: 'login' })
      }
    }

    window.addEventListener('star-dewedar:open-my-requests', handleOpenMyRequests)
    return () => window.removeEventListener('star-dewedar:open-my-requests', handleOpenMyRequests)
  }, [user])

  const closeRequestsPanel = () => {
    setRequestsPanelOpen(false)
    setRequestsRecoveryType(null)
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

  // ── Profile Avatar & Dropdown Renderer (Shared for desktop and mobile) ──────
  const renderUserMenu = (isMobile = false) => (
    <div className="relative" ref={isMobile ? undefined : userMenuRef} data-user-menu>
      <button
        id={isMobile ? 'header-profile-btn-mobile' : 'header-profile-btn'}
        onClick={() => setUserMenuOpen((o) => !o)}
        aria-label="Account"
        aria-haspopup="menu"
        aria-expanded={userMenuOpen}
        title={user ? user.name : t('auth.login')}
        className={`relative flex items-center justify-center transition-all border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          isMobile ? 'w-8 h-8' : 'w-8 h-8 xl:w-9 xl:h-9'
        } rounded-full ${
          user
            ? 'bg-primary border-primary text-white hover:bg-primary-dark shadow-xs'
            : 'bg-slate-50 border-slate-200/80 text-deep-blue hover:bg-slate-100 hover:border-primary hover:text-primary'
        }`}
      >
        {user ? (
          <span className="text-white text-xs font-black leading-none">
            {getUserInitials(user.name)}
          </span>
        ) : (
          <span className="material-symbols-outlined text-[19px] leading-none">person</span>
        )}
        <span className="material-symbols-outlined absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-primary shadow-xs text-[11px] leading-none">
          expand_more
        </span>
      </button>

      {/* User Menu Dropdown (Polished to match Mega-Menus) */}
      {userMenuOpen && (
        <div
          className="absolute end-0 top-full mt-2.5 w-60 bg-white shadow-[0_20px_50px_-12px_rgba(16,42,67,0.18),0_8px_20px_-4px_rgba(16,42,67,0.08)] rounded-2xl border border-slate-200/90 py-2 z-[100] animate-slideDown"
        >
          {user ? (
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
                id={isMobile ? 'header-my-requests-btn-mobile' : 'header-my-requests-btn'}
                onClick={() => {
                  setUserMenuOpen(false)
                  setRequestsPanelOpen(true)
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-start text-xs font-headline font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-base leading-none text-primary">
                  request_quote
                </span>
                {t('myRequests.title')}
              </button>
              <button
                id={isMobile ? 'header-saved-btn-mobile' : 'header-saved-btn'}
                onClick={() => {
                  setUserMenuOpen(false)
                  navigate('/saved-products')
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-start text-xs font-headline font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
              >
                <span
                  className="material-symbols-outlined text-base leading-none text-red-500"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  favorite
                </span>
                {t('favourites.mySaved')}
              </button>
              <button
                id={isMobile ? 'header-messages-btn-mobile' : 'header-messages-btn'}
                onClick={() => {
                  setUserMenuOpen(false)
                  navigate('/messages')
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-start text-xs font-headline font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-base leading-none text-sky-500">
                  support_agent
                </span>
                {t('messages.title')}
              </button>
              {user.role === 'admin' && (
                <button
                  id={isMobile ? 'header-admin-btn-mobile' : 'header-admin-btn'}
                  onClick={() => {
                    setUserMenuOpen(false)
                    navigate('/admin')
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-start text-xs font-headline font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-base leading-none text-primary">
                    admin_panel_settings
                  </span>
                  {t('auth.adminPanel')}
                </button>
              )}
              <button
                id={isMobile ? 'header-change-password-btn-mobile' : 'header-change-password-btn'}
                onClick={() => {
                  setUserMenuOpen(false)
                  setChangePasswordOpen(true)
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-start text-xs font-headline font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-base leading-none text-slate-400">
                  lock
                </span>
                {t('auth.changePassword')}
              </button>
              <div className="pt-1 mt-1 border-t border-slate-100">
                <button
                  id={isMobile ? 'header-logout-btn-mobile' : 'header-logout-btn'}
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-start text-xs font-headline font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base leading-none">logout</span>
                  {loggingOut ? t('auth.loggingOut') : t('auth.logout')}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-400">
                  {t('auth.account')}
                </p>
              </div>
              <button
                id={isMobile ? 'header-login-btn-mobile' : 'header-login-btn'}
                onClick={() => {
                  setUserMenuOpen(false)
                  openLogin()
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-start text-xs font-headline font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-base leading-none">login</span>
                {t('auth.login')}
              </button>
              <button
                id={isMobile ? 'header-register-btn-mobile' : 'header-register-btn'}
                onClick={() => {
                  setUserMenuOpen(false)
                  openRegister()
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-start text-xs font-headline font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-base leading-none">person_add</span>
                {t('auth.register')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* ── Floating Header Container ────────────────────────────────────────── */}
      <header
        ref={headerContainerRef}
        className="fixed top-3 sm:top-4 inset-x-0 z-50 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto pointer-events-none transition-all duration-300"
      >
        <div
          className={`pointer-events-auto relative w-full h-[60px] sm:h-[64px] px-3.5 sm:px-5 lg:px-6 rounded-2xl border transition-all duration-300 ease-in-out flex items-center justify-between ${
            scrolled
              ? 'bg-white/95 backdrop-blur-xl border-slate-200/80 shadow-[0_12px_36px_-4px_rgba(16,42,67,0.14),0_4px_12px_-2px_rgba(16,42,67,0.06)]'
              : 'bg-white/80 backdrop-blur-xl border-white/70 shadow-[0_8px_32px_0_rgba(16,42,67,0.08),0_2px_8px_0_rgba(16,42,67,0.04)]'
          }`}
        >
          {/* ── Left Column: Mobile Hamburger Toggle (hidden on desktop) ──── */}
          <div className="flex items-center lg:hidden z-10">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ms-1 text-deep-blue hover:text-primary hover:bg-slate-100/80 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
          </div>

          {/* ── Desktop Left Navigation Wing: Products & Projects (Left of Monogram) ── */}
          <div className="hidden lg:flex items-center justify-end w-[calc(50%-60px)] pe-3 xl:pe-6 z-10">
            <nav
              className="flex items-center gap-5 xl:gap-8"
              aria-label="Products and Projects Navigation"
            >
              {/* Products with Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleDropdownOpen('products')}
                onMouseOver={() => handleDropdownOpen('products')}
                onMouseLeave={handleDropdownClose}
              >
                <button
                  id="nav-link-products"
                  onClick={() => handleNavClick('/products')}
                  onMouseEnter={() => handleDropdownOpen('products')}
                  onMouseOver={() => handleDropdownOpen('products')}
                  aria-expanded={activeDropdown === 'products'}
                  aria-haspopup="true"
                  className={`relative py-2 flex items-center gap-1 font-headline font-bold uppercase text-xs lg:text-[13px] tracking-tight transition-colors duration-200 ${
                    activeLink === 'Products'
                      ? 'text-primary'
                      : 'text-deep-blue hover:text-primary'
                  }`}
                >
                  <span>{t('nav.products')}</span>
                  <span
                    className={`material-symbols-outlined text-sm transition-transform duration-200 ${
                      activeDropdown === 'products' ? 'rotate-180 text-primary' : 'text-slate-400'
                    }`}
                  >
                    expand_more
                  </span>
                  {activeLink === 'Products' && (
                    <span className="absolute bottom-0 inset-x-0 h-[2px] bg-primary rounded-full" />
                  )}
                </button>

                {/* Products Dropdown Menu (Polished Mega-Menu) */}
                {activeDropdown === 'products' && (
                  <div
                    data-dropdown-container
                    className="absolute top-full start-0 mt-3.5 w-[540px] bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(16,42,67,0.18),0_8px_20px_-4px_rgba(16,42,67,0.08)] border border-slate-200/90 p-5 z-[100] animate-slideDown before:content-[''] before:absolute before:-top-4 before:inset-x-0 before:h-4"
                    onMouseEnter={() => handleDropdownOpen('products')}
                    onMouseOver={() => handleDropdownOpen('products')}
                    onMouseLeave={handleDropdownClose}
                  >
                    <div className="grid grid-cols-12 gap-5">
                      {/* Categories (7 cols) */}
                      <div className="col-span-7 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-400">
                            {t('nav.categories')}
                          </span>
                          <button
                            onClick={() => {
                              setActiveDropdown(null)
                              setSearchOpen(true)
                            }}
                            className="text-[10px] font-headline font-bold uppercase tracking-wider text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
                          >
                            <span className="material-symbols-outlined text-xs">search</span>
                            {t('nav.search')}
                          </button>
                        </div>

                        <div className="space-y-1">
                          {productCategories.length > 0 ? (
                            productCategories.map((cat) => (
                              <button
                                key={cat.id}
                                onClick={() => {
                                  setActiveDropdown(null)
                                  navigate(`/products?category=${cat.id}`)
                                }}
                                className="w-full text-start flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-slate-800 hover:text-primary transition-all group"
                              >
                                <span className="text-xs font-headline font-bold tracking-tight">
                                  {isRTL ? cat.name_ar : cat.name_en}
                                </span>
                                <span className="material-symbols-outlined text-sm text-slate-300 group-hover:text-primary group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 transition-all">
                                  arrow_forward
                                </span>
                              </button>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 py-2">
                              {t('nav.viewAllProducts')}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleNavClick('/products')}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-50 hover:bg-primary/10 text-primary font-headline text-xs font-bold uppercase tracking-wider transition-all"
                          >
                            <span>{t('nav.viewAllProducts')}</span>
                            <span className="material-symbols-outlined text-sm rtl:rotate-180">
                              arrow_forward
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Featured Product Preview (5 cols) */}
                      <div className="col-span-5 border-s border-slate-100 ps-4 flex flex-col justify-between">
                        <div>
                          <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-headline font-bold uppercase tracking-widest rounded mb-2">
                            {t('nav.featured')}
                          </span>
                          {featuredProduct ? (
                            <div
                              onClick={() => {
                                setActiveDropdown(null)
                                navigate(`/product-detail?id=${featuredProduct.id}`)
                              }}
                              className="group cursor-pointer"
                            >
                              <div className="w-full h-28 bg-slate-50 rounded-xl p-2 overflow-hidden flex items-center justify-center mb-2 border border-slate-100 group-hover:border-primary/40 transition-colors">
                                <img
                                  src={featuredProduct.images?.[0]?.image_url || '/placeholder.png'}
                                  alt={isRTL ? featuredProduct.name_ar : featuredProduct.name_en}
                                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <h4 className="text-xs font-headline font-bold text-deep-blue group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                {isRTL ? featuredProduct.name_ar : featuredProduct.name_en}
                              </h4>
                              {featuredProduct.price && (
                                <p className="text-[11px] font-bold text-primary mt-1">
                                  {Number(featuredProduct.price).toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}
                                </p>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Projects with Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleDropdownOpen('projects')}
                onMouseOver={() => handleDropdownOpen('projects')}
                onMouseLeave={handleDropdownClose}
              >
                <button
                  id="nav-link-projects"
                  onClick={() => handleNavClick('/projects')}
                  onMouseEnter={() => handleDropdownOpen('projects')}
                  onMouseOver={() => handleDropdownOpen('projects')}
                  aria-expanded={activeDropdown === 'projects'}
                  aria-haspopup="true"
                  className={`relative py-2 flex items-center gap-1 font-headline font-bold uppercase text-xs lg:text-[13px] tracking-tight transition-colors duration-200 ${
                    activeLink === 'Projects'
                      ? 'text-primary'
                      : 'text-deep-blue hover:text-primary'
                  }`}
                >
                  <span>{t('nav.projects')}</span>
                  <span
                    className={`material-symbols-outlined text-sm transition-transform duration-200 ${
                      activeDropdown === 'projects' ? 'rotate-180 text-primary' : 'text-slate-400'
                    }`}
                  >
                    expand_more
                  </span>
                  {activeLink === 'Projects' && (
                    <span className="absolute bottom-0 inset-x-0 h-[2px] bg-primary rounded-full" />
                  )}
                </button>

                {/* Projects Dropdown Menu (Polished Mega-Menu) */}
                {activeDropdown === 'projects' && (
                  <div
                    data-dropdown-container
                    className="absolute top-full start-[-100px] xl:start-[-60px] mt-3.5 w-[530px] bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(16,42,67,0.18),0_8px_20px_-4px_rgba(16,42,67,0.08)] border border-slate-200/90 p-5 z-[100] animate-slideDown before:content-[''] before:absolute before:-top-4 before:inset-x-0 before:h-4"
                    onMouseEnter={() => handleDropdownOpen('projects')}
                    onMouseOver={() => handleDropdownOpen('projects')}
                    onMouseLeave={handleDropdownClose}
                  >
                    <div className="grid grid-cols-12 gap-5">
                      {/* Categories (7 cols) */}
                      <div className="col-span-7 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-400">
                            {t('nav.categories')}
                          </span>
                        </div>

                        <div className="space-y-1">
                          {projectCategories.length > 0 ? (
                            projectCategories.map((cat) => (
                              <button
                                key={cat.id}
                                onClick={() => {
                                  setActiveDropdown(null)
                                  navigate(`/projects?category=${encodeURIComponent(cat.name_en)}`)
                                }}
                                className="w-full text-start flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-slate-800 hover:text-primary transition-all group"
                              >
                                <span className="text-xs font-headline font-bold tracking-tight">
                                  {isRTL ? cat.name_ar : cat.name_en}
                                </span>
                                <span className="material-symbols-outlined text-sm text-slate-300 group-hover:text-primary group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 transition-all">
                                  arrow_forward
                                </span>
                              </button>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 py-2">
                              {t('nav.viewAllProjects')}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleNavClick('/projects')}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-50 hover:bg-primary/10 text-primary font-headline text-xs font-bold uppercase tracking-wider transition-all"
                          >
                            <span>{t('nav.viewAllProjects')}</span>
                            <span className="material-symbols-outlined text-sm rtl:rotate-180">
                              arrow_forward
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Featured Project Preview (5 cols) */}
                      <div className="col-span-5 border-s border-slate-100 ps-4 flex flex-col justify-between">
                        <div>
                          <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-headline font-bold uppercase tracking-widest rounded mb-2">
                            {t('nav.featured')}
                          </span>
                          {featuredProject ? (
                            <div
                              onClick={() => {
                                setActiveDropdown(null)
                                navigate(`/project-detail?id=${featuredProject.id}`)
                              }}
                              className="group cursor-pointer"
                            >
                              <div className="w-full h-28 bg-slate-100 rounded-xl overflow-hidden mb-2 border border-slate-100 group-hover:border-primary/40 transition-colors">
                                <img
                                  src={featuredProject.images?.[0]?.image_url || '/placeholder.png'}
                                  alt={isRTL ? featuredProject.title_ar : featuredProject.title_en}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <h4 className="text-xs font-headline font-bold text-deep-blue group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                {isRTL ? featuredProject.title_ar : featuredProject.title_en}
                              </h4>
                              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider truncate">
                                {featuredProject.client_name ||
                                  (isRTL ? featuredProject.category?.name_ar : featuredProject.category?.name_en)}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* ── Centered SDC Monogram Logo (100% Mathematically Centered) ── */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center pointer-events-auto">
            <button
              onClick={handleLogoClick}
              className="group flex items-center justify-center p-1 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-transform duration-200 hover:scale-105 active:scale-95 shrink-0"
              aria-label={t('nav.homeLabel')}
            >
              <img
                src="/monogram/monogram.webp"
                alt="Star Dewedar Company"
                width={112}
                height={36}
                className="h-7 sm:h-8 xl:h-8.5 w-auto max-w-[105px] sm:max-w-[115px] object-contain select-none"
              />
            </button>
          </div>

          {/* ── Desktop Right Navigation Wing & Utility Group (Right of Monogram) ── */}
          <div className="hidden lg:flex items-center justify-between w-[calc(50%-60px)] ps-3 xl:ps-6 z-10">
            <nav
              className="flex items-center gap-4 xl:gap-7"
              aria-label="About and Contact Navigation"
            >
              <button
                id="nav-link-about"
                onClick={() => handleNavClick('/about')}
                className={`relative py-2 font-headline font-bold uppercase text-xs lg:text-[13px] tracking-tight transition-colors duration-200 ${
                  activeLink === 'About'
                    ? 'text-primary'
                    : 'text-deep-blue hover:text-primary'
                }`}
              >
                <span>{t('nav.about')}</span>
                {activeLink === 'About' && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-primary rounded-full" />
                )}
              </button>

              <button
                id="nav-link-contact"
                onClick={() => handleNavClick('/contact')}
                className={`relative py-2 font-headline font-bold uppercase text-xs lg:text-[13px] tracking-tight transition-colors duration-200 ${
                  activeLink === 'Contact'
                    ? 'text-primary'
                    : 'text-deep-blue hover:text-primary'
                }`}
              >
                <span>{t('nav.contact')}</span>
                {activeLink === 'Contact' && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-primary rounded-full" />
                )}
              </button>
            </nav>

            {/* Compact Utility Group (Far Right) */}
            <div className="flex items-center gap-1.5 sm:gap-2 xl:gap-2.5 ms-auto shrink-0">
              <div className="h-5 w-px bg-slate-200/80 me-1" aria-hidden="true" />

              {/* Quick Search Button */}
              <button
                id="nav-btn-search"
                onClick={() => setSearchOpen(true)}
                className="flex items-center justify-center w-8 h-8 xl:w-9 xl:h-9 rounded-full text-slate-500 bg-white/70 hover:bg-white hover:text-primary border border-white/80 hover:border-slate-200/80 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-2xs group shrink-0"
                aria-label={t('nav.search')}
                title={`${t('nav.search')} (Ctrl+K)`}
              >
                <span className="material-symbols-outlined text-[18px] text-primary group-hover:scale-110 transition-transform">
                  search
                </span>
              </button>

              {/* Language Switcher Pill */}
              <button
                id="nav-btn-lang"
                onClick={toggleLanguage}
                className="flex items-center justify-center h-8 xl:h-9 px-2 xl:px-2.5 rounded-xl font-headline font-bold text-xs text-deep-blue bg-white/70 hover:bg-white hover:text-primary border border-white/80 hover:border-slate-200/80 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-2xs shrink-0"
                aria-label={isRTL ? 'Switch to English' : 'التبديل إلى العربية'}
                title={isRTL ? 'Switch to English' : 'التبديل إلى العربية'}
              >
                <span>{isRTL ? 'EN' : 'AR'}</span>
              </button>

              {/* Get Started Button (Primary Blue CTA) */}
              <button
                id="nav-btn-cta"
                onClick={() => {
                  setActiveDropdown(null)
                  navigate('/request')
                }}
                className="inline-flex items-center gap-1.5 bg-primary text-white hover:bg-primary-dark h-8 xl:h-9 px-2.5 xl:px-4 rounded-xl font-headline font-bold uppercase text-[11px] xl:text-xs tracking-wider shadow-xs hover:shadow-md transition-all duration-200 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 shrink-0"
              >
                <span>{t('nav.getStarted')}</span>
                <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
              </button>

              {/* Profile Avatar + Dropdown (Desktop) */}
              {renderUserMenu(false)}
            </div>
          </div>

          {/* ── Mobile Compact Utility Group (Right side on mobile) ──── */}
          <div className="flex lg:hidden items-center gap-1.5 sm:gap-2 z-10 ms-auto">
            {/* Language Switcher Pill (Mobile) */}
            <button
              id="nav-btn-lang-mobile"
              onClick={toggleLanguage}
              className="flex items-center justify-center h-8 px-2.5 rounded-xl font-headline font-bold text-xs text-deep-blue bg-white/70 hover:bg-white hover:text-primary border border-white/80 transition-all shadow-2xs shrink-0"
              aria-label={isRTL ? 'Switch to English' : 'التبديل إلى العربية'}
              title={isRTL ? 'Switch to English' : 'التبديل إلى العربية'}
            >
              <span>{isRTL ? 'EN' : 'AR'}</span>
            </button>

            {/* Profile Avatar + Dropdown (Mobile) */}
            {renderUserMenu(true)}
          </div>
        </div>
      </header>

      {/* ── Quick Product Search Modal Palette ─────────────────────────────── */}
      {searchOpen && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center pt-20 sm:pt-24 px-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div
            ref={searchModalRef}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slideDown"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
              <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('nav.searchPlaceholder')}
                className="flex-1 bg-transparent text-sm sm:text-base font-body text-slate-800 placeholder-slate-400 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                  aria-label="Clear search"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 rounded-md border border-slate-200">
                ESC
              </kbd>
            </div>

            {/* Search Results Area */}
            <div className="max-h-[60vh] overflow-y-auto p-3">
              {searchQuery ? (
                searchResults.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => {
                          setSearchOpen(false)
                          navigate(`/product-detail?id=${product.id}`)
                        }}
                        className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <div className="w-12 h-12 bg-slate-100 rounded-lg p-1 shrink-0 flex items-center justify-center overflow-hidden border border-slate-100">
                          <img
                            src={product.images?.[0]?.image_url || '/placeholder.png'}
                            alt={isRTL ? product.name_ar : product.name_en}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-headline font-bold text-deep-blue group-hover:text-primary transition-colors truncate">
                            {isRTL ? product.name_ar : product.name_en}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate">
                            {isRTL ? product.category?.name_ar : product.category?.name_en}
                          </p>
                        </div>
                        {product.price && (
                          <div className="text-end shrink-0">
                            <span className="text-xs font-headline font-black text-primary">
                              {Number(product.price).toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}
                            </span>
                          </div>
                        )}
                        <span className="material-symbols-outlined text-sm text-slate-300 group-hover:text-primary group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 transition-all">
                          arrow_forward
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">search_off</span>
                    <p className="text-xs font-headline uppercase tracking-wider">
                      {t('nav.noProductsFound')}
                    </p>
                  </div>
                )
              ) : (
                <div className="py-4 px-2">
                  <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-400 mb-3">
                    {t('nav.categories')}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {productCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSearchOpen(false)
                          navigate(`/products?category=${cat.id}`)
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-primary/10 text-deep-blue hover:text-primary text-xs font-headline font-bold text-start transition-all"
                      >
                        <span className="truncate">{isRTL ? cat.name_ar : cat.name_en}</span>
                        <span className="material-symbols-outlined text-sm text-slate-300 rtl:rotate-180">
                          arrow_forward
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Side Drawer ──────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden animate-fadeIn">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-over Drawer Panel */}
          <div
            className="fixed inset-y-0 start-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col z-[101] overflow-hidden animate-slideRight"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <button
                onClick={handleLogoClick}
                className="flex items-center focus:outline-none"
                aria-label={t('nav.homeLabel')}
              >
                <img
                  src="/monogram/monogram.webp"
                  alt="Star Dewedar"
                  className="h-8 w-auto object-contain"
                />
              </button>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-deep-blue hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Close menu"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Quick Search inside Drawer */}
            <div className="p-4 border-b border-slate-100">
              <div
                onClick={() => {
                  setMobileMenuOpen(false)
                  setSearchOpen(true)
                }}
                className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-100 text-slate-400 rounded-xl text-xs font-body cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">search</span>
                <span>{t('nav.searchPlaceholder')}</span>
              </div>
            </div>

            {/* Scrollable Navigation Body */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
              {/* Products Accordion */}
              <div>
                <button
                  onClick={() =>
                    setMobileExpandedSection((prev) => (prev === 'products' ? null : 'products'))
                  }
                  className="w-full flex items-center justify-between py-2.5 px-2 text-start font-headline font-bold uppercase text-xs tracking-wider transition-colors text-deep-blue hover:text-primary group"
                  aria-expanded={mobileExpandedSection === 'products'}
                  aria-label="Toggle products categories"
                >
                  <span className={activeLink === 'Products' ? 'text-primary' : ''}>
                    {t('nav.products')}
                  </span>
                  <span
                    className={`material-symbols-outlined text-base transition-transform duration-200 ${
                      mobileExpandedSection === 'products' ? 'rotate-180 text-primary' : 'text-slate-400 group-hover:text-primary'
                    }`}
                  >
                    expand_more
                  </span>
                </button>
                {mobileExpandedSection === 'products' && (
                  <div className="ps-4 space-y-1 pb-2 border-s-2 border-slate-100 ms-3 animate-fadeIn">
                    {productCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setMobileMenuOpen(false)
                          navigate(`/products?category=${cat.id}`)
                        }}
                        className="w-full text-start py-1.5 px-2 text-xs font-headline font-bold text-slate-600 hover:text-primary transition-colors"
                      >
                        {isRTL ? cat.name_ar : cat.name_en}
                      </button>
                    ))}
                    <button
                      onClick={() => handleNavClick('/products')}
                      className="w-full text-start py-1.5 px-2 text-xs font-headline font-bold text-primary flex items-center gap-1"
                    >
                      <span>{t('nav.viewAllProducts')}</span>
                      <span className="material-symbols-outlined text-xs rtl:rotate-180">arrow_forward</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Projects Accordion */}
              <div>
                <button
                  onClick={() =>
                    setMobileExpandedSection((prev) => (prev === 'projects' ? null : 'projects'))
                  }
                  className="w-full flex items-center justify-between py-2.5 px-2 text-start font-headline font-bold uppercase text-xs tracking-wider transition-colors text-deep-blue hover:text-primary group"
                  aria-expanded={mobileExpandedSection === 'projects'}
                  aria-label="Toggle projects categories"
                >
                  <span className={activeLink === 'Projects' ? 'text-primary' : ''}>
                    {t('nav.projects')}
                  </span>
                  <span
                    className={`material-symbols-outlined text-base transition-transform duration-200 ${
                      mobileExpandedSection === 'projects' ? 'rotate-180 text-primary' : 'text-slate-400 group-hover:text-primary'
                    }`}
                  >
                    expand_more
                  </span>
                </button>
                {mobileExpandedSection === 'projects' && (
                  <div className="ps-4 space-y-1 pb-2 border-s-2 border-slate-100 ms-3 animate-fadeIn">
                    {projectCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setMobileMenuOpen(false)
                          navigate(`/projects?category=${encodeURIComponent(cat.name_en)}`)
                        }}
                        className="w-full text-start py-1.5 px-2 text-xs font-headline font-bold text-slate-600 hover:text-primary transition-colors"
                      >
                        {isRTL ? cat.name_ar : cat.name_en}
                      </button>
                    ))}
                    <button
                      onClick={() => handleNavClick('/projects')}
                      className="w-full text-start py-1.5 px-2 text-xs font-headline font-bold text-primary flex items-center gap-1"
                    >
                      <span>{t('nav.viewAllProjects')}</span>
                      <span className="material-symbols-outlined text-xs rtl:rotate-180">arrow_forward</span>
                    </button>
                  </div>
                )}
              </div>

              {/* About Link */}
              <button
                onClick={() => handleNavClick('/about')}
                className={`w-full text-start py-2.5 px-2 font-headline font-bold uppercase text-xs tracking-wider transition-colors ${
                  activeLink === 'About' ? 'text-primary' : 'text-deep-blue'
                }`}
              >
                {t('nav.about')}
              </button>

              {/* Contact Link */}
              <button
                onClick={() => handleNavClick('/contact')}
                className={`w-full text-start py-2.5 px-2 font-headline font-bold uppercase text-xs tracking-wider transition-colors ${
                  activeLink === 'Contact' ? 'text-primary' : 'text-deep-blue'
                }`}
              >
                {t('nav.contact')}
              </button>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-100 space-y-2.5 bg-slate-50/50">
              {/* Primary Get Started Button */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigate('/request')
                }}
                className="w-full bg-primary text-white hover:bg-primary-dark py-3 px-4 rounded-xl font-headline font-bold uppercase text-xs tracking-wider shadow-xs flex items-center justify-center gap-2 transition-all"
              >
                <span>{t('nav.getStarted')}</span>
                <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
              </button>

              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-slate-200 text-deep-blue hover:text-primary text-xs font-headline font-bold uppercase tracking-wider transition-colors shadow-2xs"
              >
                <span className="material-symbols-outlined text-base">language</span>
                <span>{isRTL ? 'English' : 'العربية'}</span>
              </button>

              {/* Auth Panel inside Drawer */}
              {user ? (
                <div className="pt-2 border-t border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-3 px-2 py-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-xs font-black shrink-0">
                      {getUserInitials(user.name)}
                    </span>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setRequestsPanelOpen(true)
                    }}
                    className="w-full flex items-center gap-2 py-2 px-2 text-start text-xs font-headline font-bold uppercase tracking-wider text-slate-700 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-base text-primary">request_quote</span>
                    {t('myRequests.title')}
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      navigate('/saved-products')
                    }}
                    className="w-full flex items-center gap-2 py-2 px-2 text-start text-xs font-headline font-bold uppercase tracking-wider text-slate-700 hover:text-primary transition-colors"
                  >
                    <span
                      className="material-symbols-outlined text-base text-red-500"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      favorite
                    </span>
                    {t('favourites.mySaved')}
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      navigate('/messages')
                    }}
                    className="w-full flex items-center gap-2 py-2 px-2 text-start text-xs font-headline font-bold uppercase tracking-wider text-slate-700 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-base text-sky-500">support_agent</span>
                    {t('messages.title')}
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-2 py-2 px-2 text-start text-xs font-headline font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    {loggingOut ? t('auth.loggingOut') : t('auth.logout')}
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2">
                  <button
                    onClick={openLogin}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-headline font-bold uppercase tracking-wider text-center transition-colors"
                  >
                    {t('auth.login')}
                  </button>
                  <button
                    onClick={openRegister}
                    className="py-2.5 px-3 rounded-xl bg-deep-blue text-white hover:bg-deep-blue-light text-xs font-headline font-bold uppercase tracking-wider text-center transition-colors"
                  >
                    {t('auth.register')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CSS Keyframe Animations & Accessibility Styles ──────────────────── */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        [dir="rtl"] .animate-slideRight {
          animation: slideLeft 0.25s ease-out;
        }
        @keyframes slideLeft {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-slideDown,
          .animate-fadeIn,
          .animate-slideRight {
            animation: none !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* ── Modals rendered outside header ─────────────────────────────────── */}
      <Suspense fallback={null}>
        <AuthModal
          isOpen={authModal.open}
          defaultTab={authModal.tab}
          onClose={() => {
            setAuthModal((p) => ({ ...p, open: false }))
            setRequestsRecoveryType(null)
          }}
          onAuthSuccess={handleAuthSuccess}
        />

        <MyRequestsPanel
          isOpen={requestsPanelOpen}
          onClose={closeRequestsPanel}
          user={user}
          recoveryRequestType={requestsRecoveryType}
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
