import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export default function Header() {
  const { t, i18n } = useTranslation()
  const [activeLink, setActiveLink] = useState(null)
  const [currentPage, setCurrentPage] = useState('') // Tracks 'quote' or 'visit'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isRTL = i18n.language === 'ar'

  const navLinks = [
    { key: 'Products', label: t('nav.products') },
    { key: 'Projects', label: t('nav.projects') },
    { key: 'About', label: t('nav.about') },
    { key: 'Contact', label: t('nav.contact') },
  ]

  useEffect(() => {
    const path = window.location.pathname
    if (path.includes('/request-quote')) {
      setCurrentPage('quote')
      setActiveLink(null)
    } else if (path.includes('/request-visit')) {
      setCurrentPage('visit')
      setActiveLink(null)
    } else if (path.includes('/project-detail') || path.includes('/projects')) {
      setActiveLink('Projects')
      setCurrentPage('')
    } else if (path.includes('/about')) {
      setActiveLink('About')
      setCurrentPage('')
    } else if (path.includes('/contact')) {
      setActiveLink('Contact')
      setCurrentPage('')
    } else if (path.includes('/product-detail') || path.includes('/products')) {
      setActiveLink('Products')
      setCurrentPage('')
    } else {
      setActiveLink(null)
      setCurrentPage('')
    }
  }, [])

  // Update document direction when language changes
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = i18n.language
  }, [i18n.language, isRTL])

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar'
    i18n.changeLanguage(newLang)
  }

  const navigateTo = (path, pageType) => {
    setActiveLink(null)
    setCurrentPage(pageType)
    setMobileMenuOpen(false)
    window.history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const handleLogoClick = () => {
    setActiveLink(null)
    setCurrentPage('')
    setMobileMenuOpen(false)
    window.history.pushState({}, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const handleNavClick = (link) => {
    if (link === 'Products') {
      window.history.pushState({}, '', '/products')
      window.dispatchEvent(new PopStateEvent('popstate'))
    } else if (link === 'Projects') {
      window.history.pushState({}, '', '/projects')
      window.dispatchEvent(new PopStateEvent('popstate'))
    } else if (link === 'About') {
      window.history.pushState({}, '', '/about')
      window.dispatchEvent(new PopStateEvent('popstate'))
    } else if (link === 'Contact') {
      window.history.pushState({}, '', '/contact')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
    setActiveLink(link)
    setCurrentPage('')
    setMobileMenuOpen(false)
  }

  return (
    <header className="fixed top-0 left-0 w-full flex justify-between items-center px-4 sm:px-8 py-4 bg-slate-50/80 backdrop-blur-md z-50">
      <button 
        onClick={handleLogoClick}
        className="text-xl sm:text-2xl font-black tracking-tighter text-slate-950 uppercase font-headline hover:opacity-70 transition-opacity"
      >
        Star Dewedar
      </button>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex space-x-8 rtl:space-x-reverse">
        {navLinks.map((link) => (
          <a
            key={link.key}
            href={`#${link.key.toLowerCase()}`}
            onClick={() => handleNavClick(link.key)}
            className={`font-headline tracking-tight font-bold uppercase text-sm transition-colors duration-300 pb-1 ${
              activeLink === link.key && !currentPage
                ? 'text-slate-950 border-b-2 border-yellow-400'
                : 'text-slate-600 border-b-2 border-transparent hover:text-yellow-500'
            }`}
          >
            {link.label}
          </a>
        ))}
      </nav>

      {/* CTA Buttons + Lang Switch - Desktop */}
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
          onClick={() => navigateTo('/request-visit', 'visit')}
          className={`font-headline font-bold uppercase text-[10px] lg:text-xs px-4 py-2 tracking-widest transition-all border ${
            currentPage === 'visit'
              ? 'bg-slate-900 text-white'
              : 'border-slate-300 text-slate-900 hover:bg-slate-100'
          }`}
        >
          {t('nav.requestVisit')}
        </button>
        
        <button 
          onClick={() => navigateTo('/request-quote', 'quote')}
          className={`font-headline font-bold uppercase text-[10px] lg:text-xs px-4 py-2 tracking-widest transition-all border border-transparent ${
            currentPage === 'quote'
              ? 'bg-tertiary text-white hover:bg-tertiary-fixedDim'
              : 'bg-tertiary-fixed text-on-tertiary-fixed hover:bg-white hover:border-tertiary-fixed'
          }`}
        >
          {t('nav.requestQuote')}
        </button>
      </div>

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
                className={`block py-2 font-headline font-bold uppercase text-sm transition-colors ${
                  activeLink === link.key && !currentPage
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
                onClick={() => navigateTo('/request-visit', 'visit')}
                className={`w-full text-left py-3 px-4 font-headline font-bold uppercase text-xs tracking-widest transition-all border ${
                  currentPage === 'visit' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'
                }`}
              >
                {t('nav.requestVisit')}
              </button>
              <button
                onClick={() => navigateTo('/request-quote', 'quote')}
                className={`w-full text-left py-3 px-4 font-headline font-bold uppercase text-xs tracking-widest transition-all ${
                  currentPage === 'quote' ? 'bg-tertiary text-white' : 'bg-tertiary-fixed text-on-tertiary-fixed'
                }`}
              >
                {t('nav.requestQuote')}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}