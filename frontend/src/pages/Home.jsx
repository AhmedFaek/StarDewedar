import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import HeroSection from '../components/sections/HeroSection'
import AboutPreview from '../components/sections/AboutPreview'
import ProductCardsGrid from '../components/sections/ProductCardsGrid'
import SuccessPartners from '../components/sections/SuccessPartners'
import ProjectShowcase from '../components/sections/ProjectShowcase'
import WhyChooseUs from '../components/sections/WhyChooseUs'
import CTABanner from '../components/sections/CTABanner'

export default function Home() {
  return (
    <>
      <Header />
      <main className="overflow-x-hidden">
        <HeroSection />
        <div className="animate-fade-in-up animate-delay-100">
          <AboutPreview />
        </div>
        <div className="animate-fade-in-up animate-delay-200">
          <ProductCardsGrid />
        </div>
        <div className="animate-fade-in-up animate-delay-300">
          <SuccessPartners />
        </div>
        <div className="animate-fade-in-up animate-delay-200">
          <ProjectShowcase />
        </div>
        <div className="animate-fade-in-up animate-delay-300">
          <WhyChooseUs />
        </div>
        <div className="animate-fade-in-up animate-delay-200">
          <CTABanner />
        </div>
      </main>
      <Footer />
    </>
  )
}
