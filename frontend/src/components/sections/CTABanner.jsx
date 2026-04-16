export default function CTABanner() {
  return (
    <section className="bg-tertiary-fixed py-20 overflow-hidden relative">
      <div className="container mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
        <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter text-on-tertiary-fixed uppercase max-w-2xl">
          Partner with the Experts. Request a Quote Today.
        </h2>

        <button className="bg-primary text-white px-12 py-6 font-headline font-bold uppercase tracking-widest hover:bg-primary/90 transition-all text-sm shrink-0">
          Contact Technical Sales
        </button>
      </div>

      {/* Decorative Text Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
        <div className="font-headline font-black text-[25vw] leading-none uppercase -rotate-12">
          STAR
        </div>
      </div>
    </section>
  )
}
