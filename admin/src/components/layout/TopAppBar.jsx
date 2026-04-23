import { getCurrentUser } from '../../utils/auth'
import { useTranslation } from 'react-i18next'

export const TopAppBar = ({ onMenuClick }) => {
  const user = getCurrentUser()
  const { i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  
  // Format role for display (e.g., "CO_FOUNDER" -> "Co-Founder")
  const formatRole = (role) => {
    if (!role) return 'User'
    return role
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join('-')
  }

  return (
    <header className={`fixed top-0 z-30 flex h-16 items-center justify-between border-b border-outline-variant/20 px-4 glass-header sm:px-6 lg:px-8 ${
      isAr ? 'left-0 right-0 lg:right-64' : 'left-0 right-0 lg:left-64'
    }`}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open sidebar"
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center border border-outline-variant/30 text-primary transition-colors hover:bg-surface-container-low lg:hidden"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      {/* Right Section - Actions & Profile */}
      <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">

        {/* Divider */}
        <div className="hidden h-8 w-px bg-outline-variant opacity-20 sm:block"></div>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className={`${isAr ? 'text-left' : 'text-right'} hidden sm:block`}>
            <p className="text-xs font-bold font-headline uppercase tracking-tight text-primary">
              {formatRole(user?.role || 'User')}
            </p>
            <p className="text-xs text-secondary">{user?.name || 'Admin User'}</p>
          </div>
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGgleX9zhqLHe1SAlaaP8fglgejG4GyTrBw5itgV1dJLNHCgGZMKi7sa4JBYaGjOD-KjrB053Qpd70gi_cDIFhxeUr_mO0BXO8jkvvVu9f8iW5PgJ7Hnb6OueGZnm8RA2BoTMjCQpiF8HtTb3oteKbxg_I-LCu98-zAnTHYmxMDN1iLIcvI_kJ9Sr2hlys7JWf37vNlKBbvONsQLkNUngVOVH8uXQMSx4kiT6Z6jehOUe_DkyJlA2QtF88ZpJlA7H9yHafyTKqjKx-"
            alt="Admin Profile"
            className="h-10 w-10 object-cover border border-primary"
          />
        </div>
      </div>
    </header>
  )
}
