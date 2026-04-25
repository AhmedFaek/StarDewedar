import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import HeroSection from '../components/sections/HeroSection'
import AboutPreview from '../components/sections/AboutPreview'
import ProductCardsGrid from '../components/sections/ProductCardsGrid'
import SuccessPartners from '../components/sections/SuccessPartners'
import ProjectShowcase from '../components/sections/ProjectShowcase'
import WhyChooseUs from '../components/sections/WhyChooseUs'
import CTABanner from '../components/sections/CTABanner'
import ScrollReveal from '../components/shared/ScrollReveal'

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        
        <ScrollReveal delay={100}>
          <AboutPreview />
        </ScrollReveal>
        
       
        
        <ScrollReveal delay={200}>
          <ProductCardsGrid />
        </ScrollReveal>
        
       
        
        <ScrollReveal delay={300}>
          <SuccessPartners />
        </ScrollReveal>
        
       
        
        <ScrollReveal delay={200}>
          <ProjectShowcase />
        </ScrollReveal>
        
       
        
        <ScrollReveal delay={300}>
          <WhyChooseUs />
        </ScrollReveal>
        
       
        
        <ScrollReveal delay={200}>
          <CTABanner />
        </ScrollReveal>
      </main>
      <Footer />
    </>
  )
}
