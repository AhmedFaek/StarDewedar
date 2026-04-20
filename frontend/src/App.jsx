import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Products from './pages/Products'
import Projects from './pages/Projects'
import ProductDetail from './pages/ProductDetail'
import RequestQuote from './pages/RequestQuote'
import RequestVisit from './pages/RequestVisit'
import Contact from './pages/Contact'

export default function App() {
  const [currentPage, setCurrentPage] = useState('home')

  // Simple routing based on URL path
  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname
      if (path.includes('request-quote')) {
        setCurrentPage('request-quote')
      } else if (path.includes('request-visit')) {
        setCurrentPage('request-visit')
      } else if (path.includes('contact')) {
        setCurrentPage('contact')
      } else if (path.includes('projects')) {
        setCurrentPage('projects')
      } else if (path.includes('product-detail')) {
        setCurrentPage('product-detail')
      } else if (path.includes('products')) {
        setCurrentPage('products')
      } else {
        setCurrentPage('home')
      }
    }

    handleRouteChange()
    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  // Simple navigation helper
  window.navigateTo = (page, productId) => {
    if (page === 'request-quote') {
      window.history.pushState({}, '', '/request-quote')
      setCurrentPage('request-quote')
    } else if (page === 'request-visit') {
      window.history.pushState({}, '', '/request-visit')
      setCurrentPage('request-visit')
    } else if (page === 'projects') {
      window.history.pushState({}, '', '/projects')
      setCurrentPage('projects')
    } else if (page === 'product-detail') {
      const query = productId ? `?id=${productId}` : ''
      window.history.pushState({}, '', `/product-detail${query}`)
      setCurrentPage('product-detail')
    } else if (page === 'products') {
      window.history.pushState({}, '', '/products')
      setCurrentPage('products')
    } else {
      window.history.pushState({}, '', '/')
      setCurrentPage('home')
    }
  }

  return currentPage === 'product-detail' ? (
    <ProductDetail />
  ) : currentPage === 'projects' ? (
    <Projects />
  ) : currentPage === 'products' ? (
    <Products />
  ) : currentPage === 'request-quote' ? (
    <RequestQuote />
  ) : currentPage === 'request-visit' ? (
    <RequestVisit />
  ) : currentPage === 'contact' ? (
    <Contact />
  ) : (
    <Home />
  )
}
