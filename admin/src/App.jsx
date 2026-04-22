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


import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

function AppWrapper({ children }) {
  const { i18n } = useTranslation()

  useEffect(() => {
    const isAr = i18n.language === 'ar'

    // Direction
    document.documentElement.dir = isAr ? 'rtl' : 'ltr'
    document.documentElement.lang = i18n.language

    // Font
    document.body.style.fontFamily = isAr
      ? "'Cairo', sans-serif"
      : "'Inter', sans-serif"

    // Optional: toggle class for styling
    document.documentElement.classList.toggle('arabic', isAr)

  }, [i18n.language])

  return children
}

export default function App() {
  return (
    <AppWrapper>
      <BrowserRouter>
        <Routes>

          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
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

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            }
          />

        </Routes>
      </BrowserRouter>
    </AppWrapper>
  )
}