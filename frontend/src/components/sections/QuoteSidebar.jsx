import Icon from '../shared/Icon'
import { useTranslation } from 'react-i18next'

export default function QuoteSidebar() {
  const { t } = useTranslation()

  return (
    <aside className="hidden lg:col-span-4 lg:flex voltage-gradient p-8 sm:p-10 md:p-12 flex-col justify-between text-white lg:flex">
      <div>
        <span className="text-tertiary-fixed font-headline font-bold uppercase tracking-[0.2em] text-xs">
          {t('requestQuote.sidebarBadge')}
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-headline font-bold tracking-tighter mt-5 sm:mt-6 leading-tight">
          {t('requestQuote.sidebarTitle1')} <br />
          {t('requestQuote.sidebarTitle2')}
        </h1>
        <p className="mt-6 sm:mt-8 text-sm md:text-base text-on-primary-container leading-relaxed opacity-90 max-w-sm">
          {t('requestQuote.sidebarDesc')}
        </p>
      </div>
      <div className="mt-10 sm:mt-12 relative w-full h-40 sm:h-44 md:h-48 group overflow-hidden">
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
