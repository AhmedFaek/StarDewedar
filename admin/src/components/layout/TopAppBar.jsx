import { getCurrentUser } from '../../utils/auth'

export const TopAppBar = () => {
  const user = getCurrentUser()
  
  // Format role for display (e.g., "CO_FOUNDER" -> "Co-Founder")
  const formatRole = (role) => {
    if (!role) return 'User'
    return role
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join('-')
  }

  return (
    <header className="fixed top-0 right-0 left-64 z-40 flex justify-between items-center px-8 h-16 glass-header shadow-industrial border-none">
      {/* Left Section - Search */}
      <div className="flex items-center gap-6">
      </div>

      {/* Right Section - Actions & Profile */}
      <div className="flex items-center gap-6">

        {/* Divider */}
        <div className="h-8 w-px bg-outline-variant opacity-20"></div>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-bold font-headline uppercase tracking-tight text-primary">
              {formatRole(user?.role || 'User')}
            </p>
            <p className="text-xs text-secondary">{user?.name || 'Admin User'}</p>
          </div>
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGgleX9zhqLHe1SAlaaP8fglgejG4GyTrBw5itgV1dJLNHCgGZMKi7sa4JBYaGjOD-KjrB053Qpd70gi_cDIFhxeUr_mO0BXO8jkvvVu9f8iW5PgJ7Hnb6OueGZnm8RA2BoTMjCQpiF8HtTb3oteKbxg_I-LCu98-zAnTHYmxMDN1iLIcvI_kJ9Sr2hlys7JWf37vNlKBbvONsQLkNUngVOVH8uXQMSx4kiT6Z6jehOUe_DkyJlA2QtF88ZpJlA7H9yHafyTKqjKx-"
            alt="Admin Profile"
            className="w-10 h-10 object-cover border border-primary"
          />
        </div>
      </div>
    </header>
  )
}
