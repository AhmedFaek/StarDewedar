import { useEffect, useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import QuoteSidebar from '../components/sections/QuoteSidebar'
import QuoteForm from '../components/sections/QuoteForm'

export default function RequestQuote() {
  const [productId, setProductId] = useState(null)

  useEffect(() => {
    // Get product_id from URL query params
    const params = new URLSearchParams(window.location.search)
    const id = params.get('product_id')
    if (id) {
      setProductId(id)
    }
  }, [])

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden shadow-2xl">
            <QuoteSidebar />
            <QuoteForm productId={productId} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
