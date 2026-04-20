import { useState, useEffect } from 'react'

export default function Header() {
  const [activeLink, setActiveLink] = useState('Products')
  const [currentPage, setCurrentPage] = useState('') // Tracks 'quote' or 'visit'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = ['Products', 'Projects', 'About', 'Contact']

  useEffect(() => {
    const path = window.location.pathname
    if (path.includes('/request-quote')) setCurrentPage('quote')
    else if (path.includes('/request-visit')) setCurrentPage('visit')
    else if (path.includes('/products')) setActiveLink('Products')
    else setCurrentPage('')
  }, [])

  const navigateTo = (path, pageType) => {
    setActiveLink(null)
    setCurrentPage(pageType)
    setMobileMenuOpen(false)
    window.history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const handleLogoClick = () => {
    setActiveLink('Products')
    setCurrentPage('')
    setMobileMenuOpen(false)
    window.history.pushState({}, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const handleNavClick = (link) => {
    if (link === 'Products') {
      window.history.pushState({}, '', '/products')
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
      <nav className="hidden md:flex space-x-8">
        {navLinks.map((link) => (
          <a
            key={link}
            href={`#${link.toLowerCase()}`}
            onClick={() => handleNavClick(link)}
            className={`font-headline tracking-tight font-bold uppercase text-sm transition-colors duration-300 pb-1 ${
              activeLink === link && !currentPage
                ? 'text-slate-950 border-b-2 border-yellow-400'
                : 'text-slate-600 border-b-2 border-transparent hover:text-yellow-500'
            }`}
          >
            {link}
          </a>
        ))}
      </nav>

      {/* CTA Buttons - Desktop */}
      <div className="hidden sm:flex items-center gap-2">
        <button 
          onClick={() => navigateTo('/request-visit', 'visit')}
          className={`font-headline font-bold uppercase text-[10px] lg:text-xs px-4 py-2 tracking-widest transition-all border ${
            currentPage === 'visit'
              ? 'bg-slate-900 text-white'
              : 'border-slate-300 text-slate-900 hover:bg-slate-100'
          }`}
        >
          Request a Visit
        </button>
        
        <button 
          onClick={() => navigateTo('/request-quote', 'quote')}
          className={`font-headline font-bold uppercase text-[10px] lg:text-xs px-4 py-2 tracking-widest transition-all border border-transparent ${
            currentPage === 'quote'
              ? 'bg-tertiary text-white hover:bg-tertiary-fixedDim'
              : 'bg-tertiary-fixed text-on-tertiary-fixed hover:bg-white hover:border-tertiary-fixed'
          }`}
        >
          Request a Quote
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
                key={link}
                href={`#${link.toLowerCase()}`}
                onClick={() => handleNavClick(link)}
                className={`block py-2 font-headline font-bold uppercase text-sm transition-colors ${
                  activeLink === link && !currentPage
                    ? 'text-yellow-500'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {link}
              </a>
            ))}
            
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => navigateTo('/request-visit', 'visit')}
                className={`w-full text-left py-3 px-4 font-headline font-bold uppercase text-xs tracking-widest transition-all border ${
                  currentPage === 'visit' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'
                }`}
              >
                Request a Visit
              </button>
              <button
                onClick={() => navigateTo('/request-quote', 'quote')}
                className={`w-full text-left py-3 px-4 font-headline font-bold uppercase text-xs tracking-widest transition-all ${
                  currentPage === 'quote' ? 'bg-tertiary text-white' : 'bg-tertiary-fixed text-on-tertiary-fixed'
                }`}
              >
                Request a Quote
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}