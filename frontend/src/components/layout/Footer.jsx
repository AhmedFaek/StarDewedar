import Icon from '../shared/Icon'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export default function Footer() {
  const { t } = useTranslation()

  const exploreLinks = [
    { label: t('footer.exploreProducts'), path: '/products' },
    { label: t('footer.exploreProjects'), path: '/projects' },
    { label: t('footer.exploreAbout'), path: '/about' },
    { label: t('nav.contact'), path: '/contact' },
  ]


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
      <div className="sm:col-span-2 lg:col-span-4 border-t border-outline-variant/40 pt-8 sm:pt-12 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
        <p className="text-on-surface-variant text-xs sm:text-sm font-body text-center md:text-left">
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </p>
        <div className="flex gap-6">
          <a className="text-on-surface-variant hover:text-primary transition-all" href="#">
            <Icon icon="share" />
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-all" href="#">
            <Icon icon="settings" />
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-all" href="#">
            <Icon icon="help" />
          </a>
        </div>
      </div>
    </footer>
  )
}
