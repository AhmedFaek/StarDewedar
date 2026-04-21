import { useEffect, useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export default function About() {
  const [visibleStats, setVisibleStats] = useState(false)

  useEffect(() => {
    setVisibleStats(true)
  }, [])

  const stats = [
    { number: '10+', label: 'Years Experience' },
    { number: '300+', label: 'Projects Delivered' },
    { number: '50+', label: 'Industrial Clients' },
    { number: '100%', label: 'Execution Precision' },
  ]

  const workflow = [
    "Reviewing technical documents and project requirements",
    "Official testing & validation with national electricity authorities",
    "Supplying and installing electrical equipment",
    "Final delivery with full system inspection and verification"
  ]

  const strengths = [
    {
      title: "Best Quality & Efficiency",
      description:
        "We ensure every electrical project operates at maximum performance by selecting optimal solutions tailored to real industrial needs.",
    },
    {
      title: "Competitive Pricing",
      description:
        "We balance cost and performance by choosing the most suitable equipment and delivering projects within tight deadlines.",
    },
    {
      title: "Accumulated Expertise",
      description:
        "Our engineers and technicians bring years of hands-on experience in electrical systems, ensuring reliable execution.",
    },
  ]

  const expertise = [
    {
      category: "Low Voltage Systems",
      items: ["Distribution Panels", "Control Panels", "Electrical Cabinets"],
    },
    {
      category: "Industrial Projects",
      items: ["Factories", "Warehouses", "Production Lines"],
    },
    {
      category: "Power Infrastructure",
      items: ["Installation", "Testing", "Maintenance"],
    },
    {
      category: "Custom Solutions",
      items: ["Client-Specific Designs", "Non-Standard Equipment"],
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />

      <main className="flex-grow pt-20">

        {/* HERO */}
        <section className="relative h-[500px] bg-primary overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary to-primary_container opacity-90"></div>

          <div className="relative h-full flex flex-col justify-end px-6 md:px-16 pb-16">
            <span className="text-tertiary-fixed font-label text-xs uppercase tracking-widest mb-4">
              About Star Dewedar
            </span>

            <h1 className="font-headline text-5xl md:text-7xl font-black text-white leading-none">
              BUILT ON<br />POWER & PRECISION
            </h1>

            <p className="text-white/70 max-w-xl mt-6 text-lg">
              Star Dewedar Co. specializes in supplying and installing electrical equipment
              for industrial and commercial projects with precision, reliability, and efficiency.
            </p>
          </div>
        </section>

        {/* STATS */}
        <section className="py-16 bg-primary-container text-white">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6">
            {stats.map((stat, i) => (
              <div key={i} className={`text-center transition-all duration-700 ${visibleStats ? 'opacity-100' : 'opacity-0'}`}>
                <h2 className="text-4xl font-black text-tertiary-fixed">{stat.number}</h2>
                <p className="text-xs uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* COMPANY DESCRIPTION */}
        <section className="py-24 px-6 md:px-16 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">

            <div>
              <h2 className="font-headline text-4xl font-black text-primary mb-6 border-l-4 border-tertiary-fixed pl-4">
                WHO WE ARE
              </h2>

              <p className="text-on-surface-variant mb-6 leading-relaxed">
                Star Dewedar Co. is a leading company in the field of civil and electrical works,
                specializing in supplying and installing low-voltage electrical equipment.
              </p>

              <p className="text-on-surface-variant leading-relaxed">
                Our operations are handled by highly trained engineers and skilled technicians,
                ensuring every project is delivered with accuracy, safety, and long-term reliability.
              </p>
            </div>

            <div className="bg-surface-container-low p-8">
              <h3 className="font-headline text-xl font-bold mb-6 text-primary">
                HOW WE WORK
              </h3>

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

            <h2 className="font-headline text-4xl font-black text-primary mb-12 border-l-4 border-tertiary-fixed pl-4">
              WHY CHOOSE US
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {strengths.map((item, i) => (
                <div key={i} className="bg-white p-8">
                  <h3 className="font-headline text-xl font-bold mb-4 text-primary">
                    {item.title}
                  </h3>
                  <p className="text-on-surface-variant">{item.description}</p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* EXPERTISE */}
        <section className="py-24 px-6 md:px-16 max-w-7xl mx-auto">

          <h2 className="font-headline text-4xl font-black text-primary mb-12 border-l-4 border-tertiary-fixed pl-4">
            OUR EXPERTISE
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {expertise.map((area, i) => (
              <div key={i} className="border border-outline-variant/30 p-8">
                <h3 className="font-headline text-2xl font-bold mb-6 text-primary">
                  {area.category}
                </h3>

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
          <h2 className="text-4xl font-black text-white mb-6">
            LET’S BUILD YOUR NEXT PROJECT
          </h2>

          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            Partner with Star Dewedar for reliable electrical solutions built on engineering precision and execution excellence.
          </p>

        </section>

      </main>

      <Footer />
    </div>
  )
}