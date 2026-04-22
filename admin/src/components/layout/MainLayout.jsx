import { Sidebar } from './Sidebar'
import { TopAppBar } from './TopAppBar'

export const MainLayout = ({ children }) => {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="pl-64 min-h-screen flex flex-col w-full">
        {/* Top App Bar */}
        <TopAppBar />

        {/* Page Content */}
        <section className="mt-16 p-10 flex-1 overflow-y-auto">
          {children}
        </section>
      </main>
    </div>
  )
}
