import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from './components'
import { ProtectedRoute, RequirePermission } from './components/ProtectedRoute'
import { PERMISSIONS, getHomePath } from './utils/permissions'
import { getDecodedToken } from './utils/auth'

// Pages
import Dashboard from './pages/Dashboard'
import Categories from './pages/Categories'
import Products from './pages/Products'
import Projects from './pages/Projects'
import AllRequests from './pages/AllRequests'
import ContactMessagesPage from './pages/contactMessages'
import Conversations from './pages/Conversations'
import Users from './pages/Users'
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

const guard = (permission, element, options) => (
  <RequirePermission permission={permission} {...options}>{element}</RequirePermission>
)

function HomeFallback() {
  return <Navigate to={getHomePath(getDecodedToken()?.role) || '/login'} replace />
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
                    <Route path="/" element={guard(PERMISSIONS.DASHBOARD_VIEW, <Dashboard />, { redirectIfDenied: true })} />
                    <Route path="/categories" element={guard(PERMISSIONS.CATALOG_MANAGE, <Categories />)} />
                    <Route path="/products" element={guard(PERMISSIONS.CATALOG_MANAGE, <Products />)} />
                    <Route path="/projects" element={guard(PERMISSIONS.PROJECTS_MANAGE, <Projects />)} />
                    <Route path="/requests" element={guard(PERMISSIONS.REQUESTS_MANAGE, <AllRequests />)} />
                    <Route path="/quote-requests" element={<Navigate to="/requests?tab=quote" replace />} />
                    <Route path="/visits" element={<Navigate to="/requests?tab=visit" replace />} />
                    <Route path="/messages" element={<Navigate to="/conversations" replace />} />
                    <Route path="/contact-messages" element={guard(PERMISSIONS.SUPPORT_MANAGE, <ContactMessagesPage />)} />
                    <Route path="/conversations" element={guard(PERMISSIONS.SUPPORT_MANAGE, <Conversations />)} />
                    <Route path="/users" element={guard(PERMISSIONS.USERS_MANAGE, <Users />)} />

                    <Route path="*" element={<HomeFallback />} />
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