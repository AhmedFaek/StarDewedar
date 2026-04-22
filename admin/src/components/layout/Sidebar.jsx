import { Link, useLocation, useNavigate } from 'react-router-dom'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import { useTranslation } from 'react-i18next'

export const Sidebar = () => {
    const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { id: 'dashboard', label: t('sidebar.dashboard'), icon: 'dashboard', path: '/' },
    { id: 'categories', label: t('sidebar.categories'), icon: 'category', path: '/categories' },
    { id: 'products', label: t('sidebar.products'), icon: 'inventory_2', path: '/products' },
    { id: 'projects', label: t('sidebar.projects'), icon: 'architecture', path: '/projects' },
    { id: 'quotes', label: t('sidebar.quotes'), icon: 'request_quote', path: '/quote-requests' },
    { id: 'visits', label: t('sidebar.visits'), icon: 'calendar_today', path: '/visits' },
    { id: 'messages', label: t('sidebar.messages'), icon: 'chat', path: '/messages' },
  ]

  const handleLogout = () => {
    // Clear tokens from localStorage
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    // Redirect to login
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <aside className="w-64 h-screen fixed top-0 bg-primary flex flex-col z-50
       left-0 arabic:left-auto arabic:right-0">
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

        {/* Language Switcher */}
        <div className="px-6 py-3">
          <LanguageSwitcher className="text-slate-400 hover:text-white" />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full px-6 py-4 flex items-center gap-3 font-headline uppercase tracking-widest text-xs font-bold transition-smooth text-slate-400 hover:text-white hover:bg-primary-container"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          {t('sidebar.logout')}
        </button>

      </div>
    </aside>
  )
}
