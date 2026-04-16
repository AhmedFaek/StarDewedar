import { useState } from 'react'

export default function Header() {
  const [activeLink, setActiveLink] = useState('Products')

  const navLinks = ['Products', 'Projects', 'About', 'Contact']

  const handleQuoteClick = () => {
    window.history.pushState({}, '', '/request-quote')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <header className="fixed top-0 left-0 w-full flex justify-between items-center px-8 py-4 bg-slate-50/80 backdrop-blur-md z-50">
      <button 
        onClick={() => {
          window.history.pushState({}, '', '/')
          window.dispatchEvent(new PopStateEvent('popstate'))
        }}
        className="text-2xl font-black tracking-tighter text-slate-950 uppercase font-headline hover:opacity-70 transition-opacity"
      >
        Star Dewedar
      </button>

      <nav className="hidden md:flex space-x-8">
        {navLinks.map((link) => (
          <a
            key={link}
            href={`#${link.toLowerCase()}`}
            onClick={() => setActiveLink(link)}
            className={`font-headline tracking-tight font-bold uppercase text-sm transition-colors duration-300 pb-1 ${
              activeLink === link
                ? 'text-slate-950 border-b-2 border-yellow-400'
                : 'text-slate-600 border-b-2 border-transparent hover:text-yellow-500'
            }`}
          >
            {link}
          </a>
        ))}
      </nav>

      <button 
        onClick={handleQuoteClick}
        className="bg-tertiary-fixed text-on-tertiary-fixed font-headline font-bold uppercase text-xs px-6 py-3 tracking-widest hover:bg-white transition-all border border-transparent"
      >
        Request a Quote
      </button>
    </header>
  )
}
