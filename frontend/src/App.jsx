import { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-surface">
      {/* Navigation */}
      <nav className="bg-surfaceContainerLowest border-b border-outlineVariant border-opacity-15">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-display-md font-bold text-primary font-space-grotesk tracking-tighter">
            Star Dewedar
          </h1>
          <p className="text-body-md text-onSurfaceVariant mt-1 font-inter">
            Industrial Electrical Solutions
          </p>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-8 py-20">
        <div className="space-y-6">
          <h2 className="text-display-lg font-bold text-primary font-space-grotesk tracking-tighter leading-tight">
            The Architectural Monolith
          </h2>
          <p className="text-body-lg text-onSurfaceVariant max-w-2xl font-inter">
            This design system is engineered to reflect the raw power and meticulous precision of heavy electrical manufacturing. Built for reliability, crafted with intention.
          </p>

          {/* CTA Button */}
          <div className="flex gap-4 pt-6">
            <button className="px-8 py-4 bg-gradient-to-r from-primary to-primary-container text-onSurface font-semibold font-inter rounded-none hover:from-primary-light hover:to-primary transition-all">
              Request Quote
            </button>
            <button className="px-8 py-4 bg-tertiary-fixed text-on-tertiary-fixed font-semibold font-inter rounded-none hover:bg-tertiary-fixedDim transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-surfaceContainerLow py-20">
        <div className="max-w-7xl mx-auto px-8">
          <h3 className="text-headline-lg font-bold text-primary font-space-grotesk tracking-tighter mb-12">
            Design System Features
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Sharp Precision",
                description: "0px border-radius throughout. Structural integrity through sharp edges."
              },
              {
                title: "Industrial Color",
                description: "Deep navy foundation with electric yellow accents. High contrast, high impact."
              },
              {
                title: "Typographic Authority",
                description: "Space Grotesk headlines with massive scale shifts command attention."
              },
              {
                title: "Tonal Layering",
                description: "Depth through background color shifts, not soft shadows."
              },
              {
                title: "Premium Materials",
                description: "Glassmorphism effects and frosted surfaces evoke high-end enclosures."
              },
              {
                title: "Technical Excellence",
                description: "Every element intentional. Built to last a hundred years."
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-surfaceContainerLowest p-8 space-y-4">
                <h4 className="text-title-lg font-bold text-primary font-space-grotesk">
                  {feature.title}
                </h4>
                <p className="text-body-md text-onSurfaceVariant font-inter">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Counter Demo */}
      <section className="max-w-7xl mx-auto px-8 py-20">
        <div className="bg-surfaceContainerLowest p-12 space-y-6">
          <h3 className="text-headline-lg font-bold text-primary font-space-grotesk">
            Interactive Demo
          </h3>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setCount(count + 1)}
              className="px-6 py-3 bg-primary text-surfaceContainerLowest rounded-none hover:bg-primary-light transition-colors font-inter font-semibold"
            >
              Count: {count}
            </button>
            <p className="text-body-lg text-onSurfaceVariant font-inter">
              Click to increment the counter and verify React is working properly.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-surfaceContainerLowest py-12 mt-20">
        <div className="max-w-7xl mx-auto px-8">
          <p className="text-body-md font-inter">
            © 2026 Star Dewedar. Industrial Electrical Solutions.
          </p>
        </div>
      </footer>
    </div>
  )
}
