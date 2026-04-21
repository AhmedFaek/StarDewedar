import Icon from '../shared/Icon'

const features = [
  {
    id: 1,
    icon: 'verified',
    title: 'High Quality Execution',
    description:
      'We ensure every project meets strict performance and safety standards through careful planning and professional installation.',
  },
  {
    id: 2,
    icon: 'precision_manufacturing',
    title: 'Efficient Project Delivery',
    description:
      'By selecting the right equipment and executing efficiently, we complete projects on time without compromising quality.',
  },
  {
    id: 3,
    icon: 'engineering',
    title: 'Experienced Team',
    description:
      'Our engineers and technicians bring strong field experience to handle complex electrical systems with confidence.',
  },
]

export default function WhyChooseUs() {
  return (
    <section className="bg-primary text-white py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-white/10 pt-16">

          {features.map((feature) => (
            <div key={feature.id}>
              <Icon
                icon={feature.icon}
                className="text-tertiary-fixed text-4xl mb-6"
                style={{ fontVariationSettings: "'FILL' 1" }}
              />

              <h3 className="font-headline text-xl md:text-2xl font-bold mb-4 uppercase">
                {feature.title}
              </h3>

              <p className="text-on-primary-container text-base leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}

        </div>
      </div>
    </section>
  )
}