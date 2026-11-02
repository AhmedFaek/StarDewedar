export const resolveUiLanguage = (language) => {
  const languageCode = typeof language === 'string'
    ? language.trim().toLowerCase().split(/[-_]/, 1)[0]
    : ''

  return languageCode === 'ar' ? 'ar' : 'en'
}
