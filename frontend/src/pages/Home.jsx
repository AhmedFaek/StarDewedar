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
      <main>
        <HeroSection />
        <AboutPreview />
        <ProductCardsGrid />
        <SuccessPartners />
        <ProjectShowcase />
        <WhyChooseUs />
        <CTABanner />
      </main>
      <Footer />
    </>
  )
}
