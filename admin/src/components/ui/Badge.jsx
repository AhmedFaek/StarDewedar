export const Badge = ({ 
  children, 
  variant = 'default',
  icon,
  className = ''
}) => {
  const baseClasses = "inline-flex items-center gap-2 px-2.5 py-0.5 text-xs font-black font-headline uppercase tracking-tighter"
  
  const variantClasses = {
    default: 'bg-surface-container text-on-surface',
    error: 'bg-error-container text-on-error-container',
    success: 'bg-primary-fixed text-on-primary-fixed',
    warning: 'bg-secondary-container text-on-secondary-container',
    urgent: 'bg-tertiary-fixed text-on-tertiary-fixed',
  }

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {icon && <span className="material-symbols-outlined text-sm">{icon}</span>}
      {children}
    </span>
  )
}
