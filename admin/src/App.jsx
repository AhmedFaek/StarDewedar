import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainLayout } from './components'
import Dashboard from './pages/Dashboard'
import Categories from './pages/Categories'
import Products from './pages/Products'
import Projects from './pages/Projects'
import QuoteRequests from './pages/quoteRequests'
import VisitRequests from './pages/visitRequests'
import ContactMessagesPage from './pages/contactMessages'

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/products" element={<Products />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/quote-requests" element={<QuoteRequests />} />
          <Route path="/visits" element={<VisitRequests />} />
          <Route path="/messages" element={<ContactMessagesPage />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  )
}
