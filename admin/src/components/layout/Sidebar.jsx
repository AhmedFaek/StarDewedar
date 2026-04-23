import { Link, useLocation, useNavigate } from 'react-router-dom'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import { useTranslation } from 'react-i18next'

export const Sidebar = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const isAr = i18n.language === 'ar'

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
    onClose?.()
    // Redirect to login
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <aside
      className={`fixed inset-y-0 z-50 flex h-screen w-64 flex-col bg-primary shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:shadow-none ${
        isAr ? 'right-0' : 'left-0'
      } ${
        isOpen
          ? 'translate-x-0'
          : isAr
            ? 'translate-x-full lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Branding */}
      <div className="flex items-start justify-between gap-4 px-6 py-6 lg:py-8">
        <div>
          <h1 className="font-headline text-xl font-black tracking-tighter text-white">
            STAR DEWEDAR
          </h1>
          <p className="mt-1 font-headline text-xs font-bold uppercase tracking-widest text-slate-500">
            Admin Dashboard
          </p>
        </div>
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="text-slate-400 transition-colors hover:text-white lg:hidden"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            onClick={onClose}
            className={`flex items-center gap-3 rounded-md px-3 py-3 font-headline text-xs font-bold uppercase tracking-widest transition-smooth sm:px-4 ${
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
      <div className="mt-auto space-y-1 px-3 pb-6">

        {/* Language Switcher */}
        <div className="px-3 py-2 sm:px-4">
          <LanguageSwitcher className="text-slate-400 hover:text-white" />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-3 font-headline text-xs font-bold uppercase tracking-widest text-slate-400 transition-smooth hover:bg-primary-container hover:text-white sm:px-4"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          {t('sidebar.logout')}
        </button>

      </div>
    </aside>
  )
}
