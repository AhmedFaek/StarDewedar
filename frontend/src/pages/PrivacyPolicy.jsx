import { Fragment, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { setPageMeta, buildUrl } from '../utils/seo'
import { resolveUiLanguage } from '../utils/language'

const EMAIL_ADDRESS = 'info@stardewedar.com'

const renderParagraph = (paragraph, key) => (
  <p key={key} className="text-on-surface-variant leading-relaxed">
    {paragraph.split(/(info@stardewedar\.com)/gi).map((part, index) => (
      part.toLowerCase() === EMAIL_ADDRESS
        ? (
          <a
            key={`${key}-email-${index}`}
            href={`mailto:${EMAIL_ADDRESS}`}
            className="text-primary underline underline-offset-2"
          >
            {part}
          </a>
        )
        : <Fragment key={`${key}-text-${index}`}>{part}</Fragment>
    ))}
  </p>
)

export default function PrivacyPolicy() {
  const { t, i18n } = useTranslation()
  const language = resolveUiLanguage(i18n.language)
  const sections = t('privacy.sections', { returnObjects: true })

  useEffect(() => {
    const isArabic = language === 'ar'
    setPageMeta({
      title: isArabic
        ? `${t('privacy.title')} | ستار ديودار`
        : `${t('privacy.title')} | Star Dewedar`,
      description: t('privacy.intro'),
      canonical: buildUrl('/privacy'),
      ogImage: '/images/og-share.jpg',
    })
  }, [language, t])

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        className="flex-grow pt-24 pb-16 px-4 sm:px-6"
      >
        <article className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm sm:p-10">
          <header className="mb-8 border-b border-outline-variant/40 pb-6">
            <h1 className="font-headline text-3xl font-black text-on-surface sm:text-4xl">
              {t('privacy.title')}
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              <time>{t('privacy.updated')}</time>
            </p>
            <p className="mt-5 text-on-surface-variant leading-relaxed">
              {t('privacy.intro')}
            </p>
          </header>

          <div className="space-y-8">
            {sections.map((section, index) => {
              const leadingParagraphs = section.items.length
                ? section.paragraphs.slice(0, 1)
                : section.paragraphs
              const trailingParagraphs = section.items.length
                ? section.paragraphs.slice(1)
                : []

              return (
                <section key={section.heading} aria-labelledby={`privacy-section-${index}`}>
                  <h2
                    id={`privacy-section-${index}`}
                    className="mb-3 font-headline text-xl font-bold text-on-surface"
                  >
                    {section.heading}
                  </h2>
                  <div className="space-y-3">
                    {leadingParagraphs.map((paragraph, paragraphIndex) =>
                      renderParagraph(paragraph, `${index}-before-${paragraphIndex}`)
                    )}
                    {section.items.length > 0 && (
                      <ul className="list-disc space-y-2 ps-6 text-on-surface-variant leading-relaxed">
                        {section.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                    {trailingParagraphs.map((paragraph, paragraphIndex) =>
                      renderParagraph(paragraph, `${index}-after-${paragraphIndex}`)
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}
