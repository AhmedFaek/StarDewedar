export const Sidebar = () => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', active: true },
    { id: 'categories', label: 'Categories', icon: 'category' },
    { id: 'products', label: 'Products', icon: 'inventory_2' },
    { id: 'projects', label: 'Projects', icon: 'architecture' },
    { id: 'quotes', label: 'Quote Requests', icon: 'request_quote' },
    { id: 'visits', label: 'Visit Requests', icon: 'calendar_today' },
    { id: 'messages', label: 'Contact Messages', icon: 'chat' },
    { id: 'users', label: 'Users', icon: 'group' },
  ]

  const bottomItems = [
    { id: 'settings', label: 'Settings', icon: 'settings' },
    { id: 'logout', label: 'Log Out', icon: 'logout' },
  ]

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
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`px-6 py-4 flex items-center gap-3 font-headline uppercase tracking-widest text-xs font-bold transition-smooth ${
              item.active
                ? 'text-tertiary-fixed bg-primary-container border-r-4 border-tertiary-fixed'
                : 'text-slate-400 hover:text-white hover:bg-primary-container'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="mt-auto pb-8 space-y-1">
        {bottomItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="text-slate-400 hover:text-white hover:bg-primary-container px-6 py-4 flex items-center gap-3 font-headline uppercase tracking-widest text-xs font-bold transition-smooth"
          >
            <span className="material-symbols-outlined text-lg">{item.icon}</span>
            {item.label}
          </a>
        ))}
      </div>
    </aside>
  )
}
