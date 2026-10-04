import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { setPageMeta } from '../utils/seo'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export default function NotFound() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'ar' ? 'ar' : 'en'

  useEffect(() => {
    const title =
      lang === 'ar'
        ? 'الصفحة غير موجودة | ستار ديودار'
        : '404 – Page Not Found | Star Dewedar'

    const description =
      lang === 'ar'
        ? 'الصفحة التي تبحث عنها غير موجودة. تصفح منتجاتنا أو مشاريعنا أو تواصل معنا.'
        : 'The page you are looking for does not exist. Browse our products, projects, or contact us.'

    setPageMeta({
      title,
      description,
      noindex: true,
      lang,
    })

    // Signal 404 to pre-renderers / proxies that read this meta tag
    const statusMeta = document.querySelector('meta[name="prerender-status-code"]')
      || (() => {
        const m = document.createElement('meta')
        m.setAttribute('name', 'prerender-status-code')
        document.head.appendChild(m)
        return m
      })()
    statusMeta.setAttribute('content', '404')

    return () => {
      statusMeta.remove()
      const robotsMeta = document.querySelector('meta[name="robots"]')
      if (robotsMeta) {
        robotsMeta.setAttribute('content', 'index, follow')
      }
    }
  }, [lang])

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-primary font-headline font-black text-[120px] sm:text-[160px] leading-none tracking-tighter opacity-10 select-none">
          404
        </p>
        <div className="-mt-10 relative z-10 space-y-6 max-w-lg">
          <h1 className="font-headline text-3xl sm:text-5xl font-black text-primary tracking-tight uppercase">
            {lang === 'ar' ? 'الصفحة غير موجودة' : 'Page Not Found'}
          </h1>
          <p className="text-on-surface-variant font-body text-base sm:text-lg leading-relaxed">
            {lang === 'ar'
              ? 'الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها.'
              : "The page you're looking for doesn't exist or may have been moved."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <button
              onClick={() => navigate('/')}
              className="bg-primary text-white px-8 py-4 font-headline font-bold uppercase tracking-widest text-xs hover:bg-primary/90 transition-colors"
            >
              {lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
            </button>
            <button
              onClick={() => navigate('/products')}
              className="border border-primary text-primary px-8 py-4 font-headline font-bold uppercase tracking-widest text-xs hover:bg-surface-container-high transition-colors"
            >
              {lang === 'ar' ? 'تصفح المنتجات' : 'Browse Products'}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
