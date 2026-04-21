export default function CTABanner() {
  return (
    <section className="bg-tertiary-fixed py-16 sm:py-20 overflow-hidden relative">
      <div className="container mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8 md:gap-12 relative z-10">
        <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-on-tertiary-fixed uppercase max-w-2xl">
          Partner with the Experts. Request a Quote Today.
        </h2>

        <button 
          onClick={() => {
            window.history.pushState({}, '', '/contact')
            window.dispatchEvent(new PopStateEvent('popstate'))
          }}
          className="bg-primary text-white px-6 sm:px-12 py-4 sm:py-6 font-headline font-bold uppercase tracking-widest hover:bg-primary/90 transition-all text-xs sm:text-sm shrink-0 w-full sm:w-auto"
        >
          Contact Us
        </button>
      </div>

      {/* Decorative Text Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none overflow-hidden">
        <div className="font-headline font-black text-[15vw] sm:text-[20vw] md:text-[25vw] leading-none uppercase -rotate-12 whitespace-nowrap">
          STAR
        </div>
      </div>
    </section>
  )
}
