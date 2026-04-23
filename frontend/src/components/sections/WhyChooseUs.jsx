import Icon from '../shared/Icon'
import { useTranslation } from 'react-i18next'

export default function WhyChooseUs() {
  const { t } = useTranslation()

  const features = [
    { id: 1, icon: 'verified', title: t('whyChooseUs.feature1Title'), description: t('whyChooseUs.feature1Desc') },
    { id: 2, icon: 'precision_manufacturing', title: t('whyChooseUs.feature2Title'), description: t('whyChooseUs.feature2Desc') },
    { id: 3, icon: 'engineering', title: t('whyChooseUs.feature3Title'), description: t('whyChooseUs.feature3Desc') },
  ]

  return (
    <section className="bg-primary text-white py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-white/10 pt-16">
          {features.map((feature) => (
            <div key={feature.id}>
              <Icon icon={feature.icon} className="text-tertiary-fixed text-4xl mb-6" style={{ fontVariationSettings: "'FILL' 1" }} />
              <h3 className="font-headline text-xl md:text-2xl font-bold mb-4 uppercase">{feature.title}</h3>
              <p className="text-on-primary-container text-base leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}