import Icon from '../shared/Icon'

export default function Footer() {
  const footerLinks = {
    Explore: ['Products', 'Projects', 'About Us', 'Case Studies'],
    Compliance: ['Privacy Policy', 'Technical Specs', 'Compliance', 'Global Distribution'],
  }

  return (
    <footer className="w-full px-4 sm:px-8 py-12 sm:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 bg-slate-950 text-white">
      {/* Brand Section */}
      <div className="sm:col-span-2 lg:col-span-1">
        <div className="text-lg sm:text-xl font-bold tracking-widest text-white uppercase font-headline mb-4 sm:mb-6">
          Star Dewedar
        </div>
        <p className="text-slate-400 font-body text-sm leading-relaxed">
          Star Dewidar Company is one of the leading companies in the field of supplying and installing low-voltage electrical equipment. The company is managed by highly efficient, trained engineers and technicians.
        </p>
      </div>

      {/* Explore Links */}
      <div>
        <h5 className="font-headline font-bold uppercase text-xs tracking-[0.2em] text-white mb-4 sm:mb-6">
          Explore
        </h5>
        <ul className="space-y-3 sm:space-y-4">
          {footerLinks.Explore.map((link) => (
            <li key={link}>
              <a
                href={`#${link.toLowerCase()}`}
                className="text-slate-400 hover:text-white transition-all text-sm font-body"
              >
                {link}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Compliance Links */}
      <div>
        <h5 className="font-headline font-bold uppercase text-xs tracking-[0.2em] text-white mb-4 sm:mb-6">
          Compliance
        </h5>
        <ul className="space-y-3 sm:space-y-4">
          {footerLinks.Compliance.map((link) => (
            <li key={link}>
              <a
                href={`#${link.toLowerCase()}`}
                className="text-slate-400 hover:text-white transition-all text-sm font-body"
              >
                {link}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Contact */}
      <div>
        <h5 className="font-headline font-bold uppercase text-xs tracking-[0.2em] text-white mb-4 sm:mb-6">
          Contact
        </h5>
        <p className="text-slate-400 text-sm font-body mb-3 sm:mb-4">Headquarters: Zurich, CH</p>
        <p className="text-yellow-400 text-sm font-body font-bold">sales@voltarchitect.com</p>
      </div>

      {/* Bottom Bar */}
      <div className="sm:col-span-2 lg:col-span-4 border-t border-white/5 pt-8 sm:pt-12 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
        <p className="text-slate-400 text-xs sm:text-sm font-body text-center md:text-left">
          © 2026 Industrial Precision Manufacturing. Engineered for Power.
        </p>
        <div className="flex gap-6">
          <a className="text-slate-400 hover:text-yellow-400 transition-all" href="#">
            <Icon icon="share" />
          </a>
          <a className="text-slate-400 hover:text-yellow-400 transition-all" href="#">
            <Icon icon="settings" />
          </a>
          <a className="text-slate-400 hover:text-yellow-400 transition-all" href="#">
            <Icon icon="help" />
          </a>
        </div>
      </div>
    </footer>
  )
}
