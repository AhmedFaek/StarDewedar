import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher({ className = '' }) {
  const { i18n } = useTranslation()
  const isAr = i18n.language === 'ar'

  const toggle = () => i18n.changeLanguage(isAr ? 'en' : 'ar')

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest text-secondary hover:text-primary transition-colors ${className}`}
      title={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      <span className="material-symbols-outlined text-sm">language</span>
      {isAr ? 'ENGLISH' : 'عربي'}
    </button>
  )
}