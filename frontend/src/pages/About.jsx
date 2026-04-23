import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export default function About() {
  const { t } = useTranslation()
  const [visibleStats, setVisibleStats] = useState(false)

  useEffect(() => { setVisibleStats(true) }, [])

  const stats = [
    { number: '10+', label: t('about.stat1') },
    { number: '300+', label: t('about.stat2') },
    { number: '50+', label: t('about.stat3') },
    { number: '100%', label: t('about.stat4') },
  ]

  const workflow = [
    t('about.workflow1'), t('about.workflow2'), t('about.workflow3'), t('about.workflow4')
  ]

  const strengths = [
    { title: t('about.strength1Title'), description: t('about.strength1Desc') },
    { title: t('about.strength2Title'), description: t('about.strength2Desc') },
    { title: t('about.strength3Title'), description: t('about.strength3Desc') },
  ]

  const expertise = [
    { category: t('about.expertCat1'), items: t('about.expertCat1Items', { returnObjects: true }) },
    { category: t('about.expertCat2'), items: t('about.expertCat2Items', { returnObjects: true }) },
    { category: t('about.expertCat3'), items: t('about.expertCat3Items', { returnObjects: true }) },
    { category: t('about.expertCat4'), items: t('about.expertCat4Items', { returnObjects: true }) },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="flex-grow pt-20">
        {/* HERO */}
        <section className="relative h-[500px] bg-primary overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary to-primary_container opacity-90"></div>
          <div className="relative h-full flex flex-col justify-end px-6 md:px-16 pb-16">
            <span className="text-tertiary-fixed font-label text-xs uppercase tracking-widest mb-4">{t('about.badge')}</span>
            <h1 className="font-headline text-5xl md:text-7xl font-black text-white leading-none">
              {t('about.heroTitle1')}<br />{t('about.heroTitle2')}
            </h1>
            <p className="text-white/70 max-w-xl mt-6 text-lg">{t('about.heroDesc')}</p>
          </div>
        </section>

        {/* STATS */}
        <section className="py-16 bg-primary-container text-white">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6">
            {stats.map((stat, i) => (
              <div key={i} className={`text-center transition-all duration-700 ${visibleStats ? 'opacity-100' : 'opacity-0'}`}>
                <h2 className="text-4xl font-black text-tertiary-fixed">{stat.number}</h2>
                <p className="text-sm uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* COMPANY DESCRIPTION */}
        <section className="py-24 px-6 md:px-16 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="font-headline text-4xl font-black text-primary mb-6 border-l-4 border-tertiary-fixed pl-4 rtl:border-l-0 rtl:border-r-4 rtl:pl-0 rtl:pr-4">{t('about.whoWeAre')}</h2>
              <p className="text-on-surface-variant mb-6 leading-relaxed">{t('about.whoWeAreP1')}</p>
              <p className="text-on-surface-variant leading-relaxed">{t('about.whoWeAreP2')}</p>
            </div>
            <div className="bg-surface-container-low p-8">
              <h3 className="font-headline text-xl font-bold mb-6 text-primary">{t('about.howWeWork')}</h3>
              <ul className="space-y-4">
                {workflow.map((step, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <span className="text-tertiary-fixed font-bold">{i + 1}</span>
                    <span className="text-on-surface-variant">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* STRENGTHS */}
        <section className="py-24 bg-surface-container-low px-6 md:px-16">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-headline text-4xl font-black text-primary mb-12 border-l-4 border-tertiary-fixed pl-4 rtl:border-l-0 rtl:border-r-4 rtl:pl-0 rtl:pr-4">{t('about.whyChooseUs')}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {strengths.map((item, i) => (
                <div key={i} className="bg-white p-8">
                  <h3 className="font-headline text-xl font-bold mb-4 text-primary">{item.title}</h3>
                  <p className="text-on-surface-variant">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* EXPERTISE */}
        <section className="py-24 px-6 md:px-16 max-w-7xl mx-auto">
          <h2 className="font-headline text-4xl font-black text-primary mb-12 border-l-4 border-tertiary-fixed pl-4 rtl:border-l-0 rtl:border-r-4 rtl:pl-0 rtl:pr-4">{t('about.ourExpertise')}</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {expertise.map((area, i) => (
              <div key={i} className="border border-outline-variant/30 p-8">
                <h3 className="font-headline text-2xl font-bold mb-6 text-primary">{area.category}</h3>
                <ul className="space-y-2">
                  {area.items.map((item, j) => (
                    <li key={j} className="flex gap-2 items-center">
                      <span className="w-2 h-2 bg-tertiary-fixed"></span>
                      <span className="text-on-surface-variant">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-primary text-center px-6">
          <h2 className="text-4xl font-black text-white mb-6">{t('about.ctaTitle')}</h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">{t('about.ctaDesc')}</p>
        </section>
      </main>
      <Footer />
    </div>
  )
}