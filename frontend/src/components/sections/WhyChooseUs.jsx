import Icon from '../shared/Icon'

const features = [
  {
    id: 1,
    icon: 'verified',
    title: 'Uncompromising Quality',
    description:
      'Our zero-tolerance policy for defects ensures every electrical panel exceeds international safety protocols and performance benchmarks.',
  },
  {
    id: 2,
    icon: 'precision_manufacturing',
    title: 'Design Innovation',
    description:
      'Leveraging generative design and advanced CAD modeling to minimize footprint while maximizing thermal efficiency in all power units.',
  },
  {
    id: 3,
    icon: 'support_agent',
    title: 'Global Support',
    description:
      'Our technical field engineers are available 24/7 for remote diagnostics and on-site integration of our primary electrical systems.',
  },
]

export default function WhyChooseUs() {
  return (
    <section className="bg-primary text-white py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 border-t border-white/10 pt-12 md:pt-16">
          {features.map((feature) => (
            <div key={feature.id}>
              <Icon
                icon={feature.icon}
                className="text-tertiary-fixed text-3xl sm:text-4xl mb-4 sm:mb-6"
                style={{ fontVariationSettings: "'FILL' 1" }}
              />

              <h3 className="font-headline text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 uppercase">
                {feature.title}
              </h3>

              <p className="text-on-primary-container text-sm sm:text-base leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
