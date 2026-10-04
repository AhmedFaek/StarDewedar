import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { setPageMeta, setJsonLd, removeJsonLd, buildUrl } from '../utils/seo'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import HeroSection from '../components/sections/HeroSection'
import AboutPreview from '../components/sections/AboutPreview'
import ProductCardsGrid from '../components/sections/ProductCardsGrid'
import SuccessPartners from '../components/sections/SuccessPartners'
import ProjectShowcase from '../components/sections/ProjectShowcase'
import WhyChooseUs from '../components/sections/WhyChooseUs'
import CTABanner from '../components/sections/CTABanner'
import ScrollReveal from '../components/shared/ScrollReveal'

export default function Home() {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'ar' ? 'ar' : 'en'

  useEffect(() => {
    const isAr = lang === 'ar'
    setPageMeta({
      title: isAr
        ? 'ستار ديودار | حلول كهربائية وهندسة'
        : 'Star Dewedar | Electrical Solutions & Engineering',
      description: isAr
        ? 'شركة ستار ديودار متخصصة في توريد وتركيب معدات الجهد المنخفض الكهربائية للمشاريع الصناعية والتجارية في مصر. لوحات توزيع، أنظمة تحكم، وتركيبات كهربائية.'
        : 'Star Dewedar Co. specializes in supplying and installing low-voltage electrical equipment for industrial and commercial projects in Egypt. Panels, switchgear, control systems, and full installation.',
      canonical: buildUrl('/'),
      ogType: 'website',
      lang,
    })

    setJsonLd('website', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': buildUrl('/#website'),
      name: 'Star Dewedar',
      url: buildUrl('/'),
      inLanguage: ['en', 'ar'],
      publisher: {
        '@id': buildUrl('/#organization'),
      },
    })

    return () => removeJsonLd('website')
  }, [lang])

  return (
    <>
      <Header />
      <main>
        <HeroSection />
        
        <ScrollReveal delay={100}>
          <AboutPreview />
        </ScrollReveal>
        
       
        
        <ScrollReveal delay={200}>
          <ProductCardsGrid />
        </ScrollReveal>
        
       
        
        <ScrollReveal delay={300}>
          <SuccessPartners />
        </ScrollReveal>
        
       
        
        <ScrollReveal delay={200}>
          <ProjectShowcase />
        </ScrollReveal>
        
       
        
        <ScrollReveal delay={300}>
          <WhyChooseUs />
        </ScrollReveal>
        
       
        
        <ScrollReveal delay={200}>
          <CTABanner />
        </ScrollReveal>
      </main>
      <Footer />
    </>
  )
}
