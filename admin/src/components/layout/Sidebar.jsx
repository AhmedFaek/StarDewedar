import { Link, useLocation } from 'react-router-dom'

export const Sidebar = () => {
  const location = useLocation()

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/' },
    { id: 'categories', label: 'Categories', icon: 'category', path: '/categories' },
    { id: 'products', label: 'Products', icon: 'inventory_2', path: '/products' },
    { id: 'projects', label: 'Projects', icon: 'architecture', path: '/projects' },
    { id: 'quotes', label: 'Quote Requests', icon: 'request_quote', path: '/quote-requests' },
    { id: 'visits', label: 'Visit Requests', icon: 'calendar_today', path: '/visits' },
    { id: 'messages', label: 'Contact Messages', icon: 'chat', path: '/messages' },
  ]

  const bottomItems = [
    { id: 'logout', label: 'Log Out', icon: 'logout', path: '/logout' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-primary flex flex-col border-none z-50">
      {/* Branding */}
      <div className="px-6 py-8">
        <h1 className="font-headline text-xl font-black tracking-tighter text-white">
          STAR DEWEDAR
        </h1>
        <p className="font-headline uppercase tracking-widest text-xs font-bold text-slate-500 mt-1">
          Admin Dashboard
        </p>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`px-6 py-4 flex items-center gap-3 font-headline uppercase tracking-widest text-xs font-bold transition-smooth ${
              isActive(item.path)
                ? 'text-tertiary-fixed bg-primary-container border-r-4 border-tertiary-fixed'
                : 'text-slate-400 hover:text-white hover:bg-primary-container'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="mt-auto pb-8 space-y-1">
        {bottomItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`px-6 py-4 flex items-center gap-3 font-headline uppercase tracking-widest text-xs font-bold transition-smooth ${
              isActive(item.path)
                ? 'text-tertiary-fixed bg-primary-container border-r-4 border-tertiary-fixed'
                : 'text-slate-400 hover:text-white hover:bg-primary-container'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  )
}
