import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Icon from '../shared/Icon'

export default function Footer() {
  const { t } = useTranslation()

  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareRef = useRef(null)
  const helpRef = useRef(null)

  const exploreLinks = [
    { label: t('footer.exploreProducts'), path: '/products' },
    { label: t('footer.exploreProjects'), path: '/projects' },
    { label: t('footer.exploreAbout'), path: '/about' },
    { label: t('nav.contact'), path: '/contact' },
  ]

  const quickLinks = [
    {
      to: '/contact',
      icon: 'contact_support',
      title: t('footer.quickLinks.contact'),
      desc: t('footer.quickLinks.contactDesc'),
    },
    {
      to: '/request?type=quote',
      icon: 'request_quote',
      title: t('footer.quickLinks.quote'),
      desc: t('footer.quickLinks.quoteDesc'),
    },
    {
      to: '/request?type=boq',
      icon: 'description',
      title: t('footer.quickLinks.boq'),
      desc: t('footer.quickLinks.boqDesc'),
    },
    {
      to: '/request?type=visit',
      icon: 'engineering',
      title: t('footer.quickLinks.visit'),
      desc: t('footer.quickLinks.visitDesc'),
    },
  ]

  // Close on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (shareRef.current && !shareRef.current.contains(event.target)) {
        setIsShareOpen(false)
      }
      if (helpRef.current && !helpRef.current.contains(event.target)) {
        setIsHelpOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsShareOpen(false)
        setIsHelpOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const toggleShare = () => {
    setIsShareOpen((prev) => !prev)
    setIsHelpOpen(false)
  }

  const toggleHelp = () => {
    setIsHelpOpen((prev) => !prev)
    setIsShareOpen(false)
  }

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://stardewedar.com'
  const shareText = t('footer.share.emailBody')
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${currentUrl}`)}`
  const emailUrl = `mailto:?subject=${encodeURIComponent(t('footer.share.emailSubject'))}&body=${encodeURIComponent(`${shareText}\n\n${currentUrl}`)}`

  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentUrl)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = currentUrl
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  return (
    <footer className="w-full px-4 sm:px-8 py-12 sm:py-16 bg-surface-container-low text-on-surface border-t border-outline-variant/40">
      <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
        {/* Brand Section */}
        <div className="sm:col-span-2 lg:col-span-1">
          <Link
            to="/"
            className="inline-block text-lg sm:text-xl font-bold tracking-widest text-on-surface uppercase font-headline mb-4 sm:mb-6 hover:text-primary transition-colors"
          >
            {t('footer.brand')}
          </Link>
          <p className="text-on-surface-variant font-body text-sm leading-relaxed">
            {t('footer.brandDescription')}
          </p>
        </div>

        {/* Explore Links */}
        <div>
          <h5 className="font-headline font-bold uppercase text-xs tracking-[0.2em] text-on-surface mb-4 sm:mb-6">
            {t('footer.explore')}
          </h5>
          <ul className="space-y-3 sm:space-y-4">
            {exploreLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className="text-on-surface-variant hover:text-primary transition-all text-sm font-body"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h5 className="font-headline font-bold uppercase text-xs tracking-[0.2em] text-on-surface mb-4 sm:mb-6">
            {t('footer.contact')}
          </h5>
          <p className="text-on-surface-variant text-sm font-body mb-3 sm:mb-4">{t('footer.headquarters')}</p>
          <p className="text-primary text-sm font-body font-bold">{t('footer.email')}</p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="container mx-auto border-t border-outline-variant/40 pt-8 sm:pt-12 mt-8 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
        <p className="text-on-surface-variant text-xs sm:text-sm font-body text-center md:text-start">
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </p>

        <div className="flex items-center gap-3">
          {/* 1. Share Popover */}
          <div className="relative" ref={shareRef}>
            <button
              type="button"
              id="footer-share-button"
              onClick={toggleShare}
              aria-expanded={isShareOpen}
              aria-haspopup="dialog"
              aria-label={t('footer.share.title')}
              className={`p-2 rounded-xl transition-all flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isShareOpen
                  ? 'text-primary bg-primary/10 ring-1 ring-primary/20 shadow-2xs'
                  : 'text-on-surface-variant hover:text-primary hover:bg-slate-100'
              }`}
            >
              <Icon icon="share" className="text-xl" />
            </button>

            {isShareOpen && (
              <div
                role="dialog"
                aria-label={t('footer.share.title')}
                className="absolute bottom-full mb-3 end-0 w-72 sm:w-80 bg-white rounded-2xl border border-slate-200/90 shadow-[0_16px_40px_-10px_rgba(16,42,67,0.18)] p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 max-w-[calc(100vw-2rem)]"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Icon icon="share" className="text-sm" />
                    </div>
                    <span className="font-headline font-bold text-xs uppercase tracking-wider text-deep-blue">
                      {t('footer.share.title')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsShareOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-deep-blue hover:bg-slate-100 transition-colors"
                    aria-label="Close"
                  >
                    <Icon icon="close" className="text-base" />
                  </button>
                </div>

                {/* Actions */}
                <div className="space-y-1.5">
                  {/* Copy Link */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-start transition-all group ${
                      copied
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-slate-50/60 hover:bg-primary/5 border-slate-100 hover:border-primary/20 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          copied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white text-slate-700 group-hover:text-primary shadow-2xs border border-slate-100'
                        }`}
                      >
                        <Icon icon={copied ? 'check' : 'link'} className="text-base" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-headline font-bold text-xs text-deep-blue leading-snug">
                          {copied ? t('footer.share.copied') : t('footer.share.copyLink')}
                        </span>
                        <span className="font-body text-[10px] text-slate-400 truncate max-w-[160px] sm:max-w-[190px]">
                          {currentUrl}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-headline font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 transition-all ${
                        copied
                          ? 'bg-emerald-100 text-emerald-800 font-extrabold'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary'
                      }`}
                    >
                      {copied ? '✓' : 'Copy'}
                    </span>
                  </button>

                  {/* WhatsApp */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsShareOpen(false)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50/60 hover:bg-emerald-50/60 border border-slate-100 hover:border-emerald-200 text-slate-800 transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#25D366]/10 text-[#25D366] flex items-center justify-center group-hover:bg-[#25D366] group-hover:text-white transition-colors shrink-0">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </div>
                      <span className="font-headline font-bold text-xs text-deep-blue">
                        {t('footer.share.whatsapp')}
                      </span>
                    </div>
                    <Icon icon="arrow_forward" className="text-sm text-slate-400 group-hover:text-emerald-600 transition-colors rtl:rotate-180" />
                  </a>

                  {/* Email */}
                  <a
                    href={emailUrl}
                    onClick={() => setIsShareOpen(false)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50/60 hover:bg-sky-50/60 border border-slate-100 hover:border-sky-200 text-slate-800 transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                        <Icon icon="mail" className="text-base" />
                      </div>
                      <span className="font-headline font-bold text-xs text-deep-blue">
                        {t('footer.share.email')}
                      </span>
                    </div>
                    <Icon icon="arrow_forward" className="text-sm text-slate-400 group-hover:text-primary transition-colors rtl:rotate-180" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* 2. Help / Quick Links Popover */}
          <div className="relative" ref={helpRef}>
            <button
              type="button"
              id="footer-help-button"
              onClick={toggleHelp}
              aria-expanded={isHelpOpen}
              aria-haspopup="dialog"
              aria-label={t('footer.quickLinks.title')}
              className={`p-2 rounded-xl transition-all flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isHelpOpen
                  ? 'text-primary bg-primary/10 ring-1 ring-primary/20 shadow-2xs'
                  : 'text-on-surface-variant hover:text-primary hover:bg-slate-100'
              }`}
            >
              <Icon icon="help" className="text-xl" />
            </button>

            {isHelpOpen && (
              <div
                role="dialog"
                aria-label={t('footer.quickLinks.title')}
                className="absolute bottom-full mb-3 end-0 w-72 sm:w-80 bg-white rounded-2xl border border-slate-200/90 shadow-[0_16px_40px_-10px_rgba(16,42,67,0.18)] p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 max-w-[calc(100vw-2rem)]"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Icon icon="support_agent" className="text-sm" />
                    </div>
                    <div>
                      <span className="font-headline font-bold text-xs uppercase tracking-wider text-deep-blue block">
                        {t('footer.quickLinks.title')}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsHelpOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-deep-blue hover:bg-slate-100 transition-colors"
                    aria-label="Close"
                  >
                    <Icon icon="close" className="text-base" />
                  </button>
                </div>

                {/* Quick links list */}
                <div className="space-y-1.5">
                  {quickLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsHelpOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/60 hover:bg-primary/5 border border-slate-100 hover:border-primary/20 text-slate-800 transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 text-slate-700 group-hover:bg-primary group-hover:text-white transition-colors flex items-center justify-center shrink-0 shadow-2xs">
                          <Icon icon={item.icon} className="text-base" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-headline font-bold text-xs text-deep-blue group-hover:text-primary transition-colors leading-snug">
                            {item.title}
                          </span>
                          <span className="font-body text-[10px] text-slate-400 truncate leading-snug">
                            {item.desc}
                          </span>
                        </div>
                      </div>
                      <Icon
                        icon="arrow_forward"
                        className="text-sm text-slate-400 group-hover:text-primary transition-colors rtl:rotate-180 shrink-0"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
