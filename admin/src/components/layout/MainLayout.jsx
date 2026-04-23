import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sidebar } from './Sidebar'
import { TopAppBar } from './TopAppBar'

export const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()
  const { i18n } = useTranslation()
  const isAr = i18n.language === 'ar'

  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-surface">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className={`min-h-screen w-full ${isAr ? 'lg:pr-64' : 'lg:pl-64'}`}>
        <TopAppBar onMenuClick={() => setIsSidebarOpen((prev) => !prev)} />

        <main className="min-w-0 pt-16">
          <section className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
            {children}
          </section>
        </main>
      </div>
    </div>
  )
}
