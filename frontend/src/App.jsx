import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Products from './pages/Products'
import Projects from './pages/Projects'
import About from './pages/About'
import ProductDetail from './pages/ProductDetail'
import ProjectDetail from './pages/ProjectDetail'
import RequestQuote from './pages/RequestQuote'
import RequestVisit from './pages/RequestVisit'
import Contact from './pages/Contact'
import PageLoader from './components/shared/PageLoader'
import WhatsAppFloat from './components/shared/WhatsAppFloat'
import SavedProducts from './pages/SavedProducts'

export default function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [isRouteLoading, setIsRouteLoading] = useState(true)

  // Simple routing based on URL path
  useEffect(() => {
    let loadingTimeout

    const handleRouteChange = () => {
      setIsRouteLoading(true)
      const path = window.location.pathname
      if (path.includes('request-quote')) {
        setCurrentPage('request-quote')
      } else if (path.includes('request-visit')) {
        setCurrentPage('request-visit')
      } else if (path.includes('saved-products')) {
        setCurrentPage('saved-products')
      } else if (path.includes('contact')) {
        setCurrentPage('contact')
      } else if (path.includes('about')) {
        setCurrentPage('about')
      } else if (path.includes('project-detail')) {
        setCurrentPage('project-detail')
      } else if (path.includes('projects')) {
        setCurrentPage('projects')
      } else if (path.includes('product-detail')) {
        setCurrentPage('product-detail')
      } else if (path.includes('products')) {
        setCurrentPage('products')
      } else {
        setCurrentPage('home')
      }

      window.scrollTo({ top: 0, behavior: 'smooth' })
      window.clearTimeout(loadingTimeout)
      loadingTimeout = window.setTimeout(() => setIsRouteLoading(false), 500)
    }

    handleRouteChange()
    window.addEventListener('popstate', handleRouteChange)

    return () => {
      window.clearTimeout(loadingTimeout)
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [])

  // Simple navigation helper
  window.navigateTo = (page, productId) => {
    setIsRouteLoading(true)
    if (page === 'request-quote' || page === 'quote') {
      const query = productId ? `?productId=${productId}` : ''
      window.history.pushState({}, '', `/request-quote${query}`)
      setCurrentPage('request-quote')
    } else if (page === 'saved-products') {
      window.history.pushState({}, '', '/saved-products')
      setCurrentPage('saved-products')
    } else if (page === 'request-visit') {
      window.history.pushState({}, '', '/request-visit')
      setCurrentPage('request-visit')
    } else if (page === 'about') {
      window.history.pushState({}, '', '/about')
      setCurrentPage('about')
    } else if (page === 'projects') {
      window.history.pushState({}, '', '/projects')
      setCurrentPage('projects')
    } else if (page === 'project-detail') {
      const query = productId ? `?id=${productId}` : ''
      window.history.pushState({}, '', `/project-detail${query}`)
      setCurrentPage('project-detail')
    } else if (page === 'product-detail') {
      const query = productId ? `?id=${productId}` : ''
      window.history.pushState({}, '', `/product-detail${query}`)
      setCurrentPage('product-detail')
    } else if (page === 'products') {
      window.history.pushState({}, '', '/products')
      setCurrentPage('products')
    } else if (page === 'contact') {
      window.history.pushState({}, '', '/contact')
      setCurrentPage('contact')
    } else {
      window.history.pushState({}, '', '/')
      setCurrentPage('home')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
    window.setTimeout(() => setIsRouteLoading(false), 500)
  }

  if (isRouteLoading) {
    return <PageLoader label="Loading page" />
  }

  return (
    <>
      {currentPage === 'saved-products' ? (
        <SavedProducts />
      ) : currentPage === 'product-detail' ? (
        <ProductDetail />
      ) : currentPage === 'project-detail' ? (
        <ProjectDetail />
      ) : currentPage === 'projects' ? (
        <Projects />
      ) : currentPage === 'products' ? (
        <Products />
      ) : currentPage === 'about' ? (
        <About />
      ) : currentPage === 'request-quote' ? (
        <RequestQuote />
      ) : currentPage === 'request-visit' ? (
        <RequestVisit />
      ) : currentPage === 'contact' ? (
        <Contact />
      ) : (
        <Home />
      )}
      <WhatsAppFloat />
    </>
  )
}
