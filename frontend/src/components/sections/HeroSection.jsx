export default function HeroSection() {
  return (
    <section className="relative min-h-screen h-screen flex items-center overflow-hidden pt-16 sm:pt-20">
      <div className="absolute inset-0 z-0">
        <img
          className="w-full h-full object-cover grayscale brightness-50"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBu_E600Z8bryxCjYDsmqyspYpOO4zZCErIg2hY22a_ug5oR0tHtDEwUUWU6EF_xZWVnJ90JVOVWi6b9XBP6QCP33pcjvhzcU9vq6Vh-6YaKvpcgtxDLrlYGlIPJbuotzy0PmxKOzPfDidAilorQ2Zb34qhGAzMOl41sYp8i2fH3TCoZAAVQ9Vz0r3lefdPpc9Uetny9wuVShgGqadZF07GqPRU4syP30KvP6TQEi6Z-RjufikHOkwJXhW1BePtAR3-A_-Nnx0ADGUy"
          alt="Modern high-tech industrial manufacturing facility"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/60 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-8 relative z-10">
        <div className="max-w-4xl">
          <span className="inline-block bg-tertiary-fixed text-on-tertiary-fixed px-3 sm:px-4 py-1 font-label font-bold uppercase tracking-widest text-xs mb-4 sm:mb-6">
            Industrial Power Systems
          </span>

          <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-tight sm:leading-none tracking-tighter mb-6 sm:mb-8">
            Reliable Electrical Solutions for{' '}
            <span className="text-tertiary-fixed">Industrial Projects</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-8 sm:mb-10 max-w-2xl font-body leading-relaxed">
            Engineering excellence for high-voltage infrastructure. We deliver precision-crafted
            electrical panels and components designed for a century of operational integrity.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button 
              onClick={() => {
                window.history.pushState({}, '', '/request-quote')
                window.dispatchEvent(new PopStateEvent('popstate'))
              }}
              className="bg-tertiary-fixed text-on-tertiary-fixed px-6 sm:px-8 py-4 sm:py-5 font-headline font-bold uppercase tracking-widest hover:bg-white transition-all text-xs sm:text-sm"
            >
              Request a Quote
            </button>
            <button className="border border-white/30 text-white px-6 sm:px-8 py-4 sm:py-5 font-headline font-bold uppercase tracking-widest hover:bg-white hover:text-primary transition-all text-xs sm:text-sm backdrop-blur-sm">
              View Projects
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
