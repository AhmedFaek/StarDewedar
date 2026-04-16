import { useState, useEffect } from 'react'
import Home from './pages/Home'
import RequestQuote from './pages/RequestQuote'

export default function App() {
  const [currentPage, setCurrentPage] = useState('home')

  // Simple routing based on URL path
  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname
      if (path.includes('request-quote')) {
        setCurrentPage('request-quote')
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
    } else {
      window.history.pushState({}, '', '/')
      setCurrentPage('home')
    }
  }

  return currentPage === 'request-quote' ? <RequestQuote /> : <Home />
}
