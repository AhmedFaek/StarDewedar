import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getDecodedToken } from '../utils/auth'
import { getHomePath } from '../utils/permissions'

export default function AccessDenied() {
  const { t } = useTranslation()
  const home = getHomePath(getDecodedToken()?.role)

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="material-symbols-outlined text-6xl text-error mb-4">lock</span>
      <h2 className="text-3xl font-black font-headline tracking-tighter text-on-surface">
        {t('access_denied.title')}
      </h2>
      <p className="mt-3 max-w-md text-sm text-secondary">{t('access_denied.message')}</p>
      {home && (
        <Link
          to={home}
          className="mt-8 text-xs font-bold font-headline uppercase tracking-widest text-primary hover:opacity-70 transition-opacity"
        >
          {t('access_denied.back')}
        </Link>
      )}
    </div>
  )
}
