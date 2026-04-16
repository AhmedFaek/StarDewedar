import Icon from '../shared/Icon'

export default function QuoteSidebar() {
  return (
    <aside className="lg:col-span-4 voltage-gradient p-12 flex flex-col justify-between text-white">
      {/* Header Section */}
      <div>
        <span className="text-tertiary-fixed font-headline font-bold uppercase tracking-[0.2em] text-xs">
          Requesting Precision
        </span>
        <h1 className="text-5xl md:text-6xl font-headline font-bold tracking-tighter mt-6 leading-tight">
          ENGINEERING <br />
          THE FUTURE.
        </h1>
        <p className="mt-8 text-on-primary-container leading-relaxed opacity-90 max-w-sm">
          Submit your technical specifications for a comprehensive architectural and electrical
          evaluation. Our lead engineers review every proposal within 24 hours.
        </p>
      </div>

      {/* Image Section */}
      <div className="mt-12 relative w-full h-48 group overflow-hidden">
        <img
          className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 transition-all duration-700"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyKMgLFgC5XNNx-HDkCUwrncEq6ikYUxYn-n52LlEZGM8VVPzc3OQ1pGf6zzPAPUHZEF4Qpz2KhtgFcgSOEtidRQODxA5l124sOrnDES9mFNIT17dJuMupPlr9SFbvBVIiV2Qhqfubel0tmCXJyShgVC2NFVONDywwoEsUxtZ9CDSWanT4MVyWeBD8Vzt09MB04ihHJ2eL_SW1OoZ4PupB8M0YdiPFWRX1ORU4oVRS3EmYtrplqbByBDswNozMh8H8BDoImZCakNAY"
          alt="Industrial electrical control panel"
        />
        <div className="absolute inset-0 bg-primary/40"></div>
      </div>
    </aside>
  )
}
