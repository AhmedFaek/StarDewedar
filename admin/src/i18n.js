import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enTranslation from './locales/en/translation.json'
import arTranslation from './locales/ar/translation.json'

i18n
    .use(LanguageDetector)       // detects language from localStorage / browser
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: enTranslation },
            ar: { translation: arTranslation },
        },
        fallbackLng: 'en',
        supportedLngs: ['en', 'ar'],
        interpolation: {
            escapeValue: false,       // React already handles XSS
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'lang',
        },
    })

// Sync <html> attributes whenever language changes
i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
})

// Set initial direction on first load
const initialLang = i18n.language?.startsWith('ar') ? 'ar' : 'en'
document.documentElement.lang = initialLang
document.documentElement.dir = initialLang === 'ar' ? 'rtl' : 'ltr'

export default i18n