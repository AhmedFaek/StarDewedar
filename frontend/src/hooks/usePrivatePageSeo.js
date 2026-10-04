/**
 * usePrivatePageSeo
 *
 * Applies noindex/nofollow to private pages (messages, saved products,
 * password reset, etc.) that should never appear in search engine results.
 *
 * Also sets a sensible document title for the page while it's active.
 *
 * Usage:
 *   import { usePrivatePageSeo } from '../hooks/usePrivatePageSeo'
 *   // inside your component:
 *   usePrivatePageSeo({ en: 'My Messages', ar: 'رسائلي' })
 */
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export function usePrivatePageSeo({ en: titleEn, ar: titleAr }) {
  const { i18n } = useTranslation()

  useEffect(() => {
    const lang = i18n.language === 'ar' ? 'ar' : 'en'
    const isAr = lang === 'ar'

    // Set page title
    document.title = isAr
      ? `${titleAr} | ستار ديودار`
      : `${titleEn} | Star Dewedar`

    // Update lang/dir
    document.documentElement.lang = lang
    document.documentElement.dir = isAr ? 'rtl' : 'ltr'

    // Ensure noindex
    let robotsMeta = document.querySelector('meta[name="robots"]')
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta')
      robotsMeta.setAttribute('name', 'robots')
      document.head.appendChild(robotsMeta)
    }
    robotsMeta.setAttribute('content', 'noindex, nofollow')

    return () => {
      // Restore to indexable when navigating away
      robotsMeta.setAttribute('content', 'index, follow')
    }
  }, [i18n.language, titleEn, titleAr])
}
