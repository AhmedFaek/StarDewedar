import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainLayout } from './components'
import Dashboard from './pages/Dashboard'
import Categories from './pages/Categories'

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/categories" element={<Categories />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  )
}
