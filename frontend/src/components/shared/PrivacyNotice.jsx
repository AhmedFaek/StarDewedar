import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { resolveUiLanguage } from '../../utils/language'

export default function PrivacyNotice({ registration = false }) {
  const { t, i18n } = useTranslation()
  const language = resolveUiLanguage(i18n.language)
  const before = registration
    ? t('privacy.registrationNoticeBefore')
    : t('privacy.noticeBefore')

  return (
    <p
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="pt-2 text-center text-xs leading-relaxed text-slate-500"
    >
      {before}
      <Link
        to="/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2"
      >
        {t('footer.privacyPolicy')}
      </Link>
      {t('privacy.noticeAfter')}
    </p>
  )
}
