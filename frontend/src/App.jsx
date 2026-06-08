import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { CompareProvider } from './utils/compareContext'
import CompareDrawer from './components/shared/CompareDrawer'
import WhatsAppFloat from './components/shared/WhatsAppFloat'
import TopProgressBar from './components/shared/TopProgressBar'

// ── Lazy-loaded pages ──────────────────────────────────────────────────────────
// Vite automatically code-splits each lazy import into its own JS chunk.
// The chunk is only downloaded when the user first navigates to that page.
const Home          = lazy(() => import('./pages/Home'))
const Products      = lazy(() => import('./pages/Products'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Projects      = lazy(() => import('./pages/Projects'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const About         = lazy(() => import('./pages/About'))
const Contact       = lazy(() => import('./pages/Contact'))
const RequestQuote  = lazy(() => import('./pages/RequestQuote'))
const RequestVisit  = lazy(() => import('./pages/RequestVisit'))
const SavedProducts  = lazy(() => import('./pages/SavedProducts'))
const ComparePage    = lazy(() => import('./pages/ComparePage'))
const ResetPassword  = lazy(() => import('./pages/ResetPassword'))

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    // CompareProvider, WhatsAppFloat and CompareDrawer live OUTSIDE the Suspense
    // boundary so they are NEVER unmounted during page transitions — the compare
    // list survives navigation without needing any workarounds.
    <CompareProvider>
      {/*
        Suspense wraps only the page area.
        While a lazy chunk is downloading, TopProgressBar renders as the fallback.
        The previous page stays mounted underneath (React keeps it in the tree)
        so the user still sees content rather than a blank screen.
      */}
      <Suspense fallback={<TopProgressBar />}>
        <Routes>
          <Route path="/"                element={<Home />} />
          <Route path="/products"        element={<Products />} />
          <Route path="/product-detail"  element={<ProductDetail />} />
          <Route path="/projects"        element={<Projects />} />
          <Route path="/project-detail"  element={<ProjectDetail />} />
          <Route path="/about"           element={<About />} />
          <Route path="/contact"         element={<Contact />} />
          <Route path="/request-quote"   element={<RequestQuote />} />
          <Route path="/request-visit"   element={<RequestVisit />} />
          <Route path="/saved-products"  element={<SavedProducts />} />
          <Route path="/compare"         element={<ComparePage />} />
          <Route path="/reset-password"  element={<ResetPassword />} />
          {/* Catch-all → home */}
          <Route path="*"               element={<Home />} />
        </Routes>
      </Suspense>

      {/* Always-visible global UI — unaffected by page changes */}
      <WhatsAppFloat />
      <CompareDrawer />
    </CompareProvider>
  )
}
