import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from './components'
import { ProtectedRoute } from './components/ProtectedRoute' // Your new wrapper

// Pages
import Dashboard from './pages/Dashboard'
import Categories from './pages/Categories'
import Products from './pages/Products'
import Projects from './pages/Projects'
import QuoteRequests from './pages/quoteRequests'
import VisitRequests from './pages/visitRequests'
import ContactMessagesPage from './pages/contactMessages'
import LoginPage from './pages/Login' // The new page we discussed

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route - No Sidebar */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Admin Routes - With Sidebar */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/quote-requests" element={<QuoteRequests />} />
                  <Route path="/visits" element={<VisitRequests />} />
                  <Route path="/messages" element={<ContactMessagesPage />} />
                  
                  {/* Catch-all for logged in users */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}