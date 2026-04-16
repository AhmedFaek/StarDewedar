import { useState, useEffect } from 'react'
import Home from './pages/Home'
import RequestQuote from './pages/RequestQuote'
import RequestVisit from './pages/RequestVisit'

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
      } else {
        setCurrentPage('home')
      }
    }

    handleRouteChange()
    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  // Simple navigation helper
  window.navigateTo = (page) => {
    if (page === 'request-quote') {
      window.history.pushState({}, '', '/request-quote')
      setCurrentPage('request-quote')
    } else if (page === 'request-visit') {
      window.history.pushState({}, '', '/request-visit')
      setCurrentPage('request-visit')
    } else {
      window.history.pushState({}, '', '/')
      setCurrentPage('home')
    }
  }

  return currentPage === 'request-quote' ? <RequestQuote /> : currentPage === 'request-visit' ? <RequestVisit /> : <Home />
}
