import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { CompareProvider } from './utils/compareContext'
import CompareDrawer from './components/shared/CompareDrawer'
import SupportMessagesFloat from './components/shared/SupportMessagesFloat'
import TopProgressBar from './components/shared/TopProgressBar'
import { NotificationProvider } from './context/NotificationContext'
import ToastContainer from './components/notifications/ToastContainer'
import { initAnalytics } from './utils/analytics'

function RedirectQuote() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  params.set('type', 'quote')
  return <Navigate to={`/request?${params.toString()}`} replace />
}

function RedirectVisit() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  params.set('type', 'visit')
  return <Navigate to={`/request?${params.toString()}`} replace />
}

const Home = lazy(() => import('./pages/Home'))
const Products = lazy(() => import('./pages/Products'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Projects = lazy(() => import('./pages/Projects'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Request = lazy(() => import('./pages/Request'))
const SavedProducts = lazy(() => import('./pages/SavedProducts'))
const ComparePage = lazy(() => import('./pages/ComparePage'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Messages = lazy(() => import('./pages/Messages'))
const ConversationPage = lazy(() => import('./pages/ConversationPage'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
  // Silently initialize analytics tracking — this never affects the UI
  useEffect(() => {
    const cleanup = initAnalytics()
    return cleanup
  }, [])

  return (
    <NotificationProvider>
      <CompareProvider>
        <Suspense fallback={<TopProgressBar />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product-detail" element={<ProductDetail />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/project-detail" element={<ProjectDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/request" element={<Request />} />
            <Route path="/request-quote" element={<RedirectQuote />} />
            <Route path="/request-visit" element={<RedirectVisit />} />
            <Route path="/saved-products" element={<SavedProducts />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:id" element={<ConversationPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>

        <SupportMessagesFloat />
        <CompareDrawer />
        <ToastContainer />
      </CompareProvider>
    </NotificationProvider>
  )
}
