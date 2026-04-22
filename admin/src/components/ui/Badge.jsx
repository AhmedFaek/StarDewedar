export const Badge = ({ 
  children, 
  variant = 'default',
  icon,
  className = ''
}) => {
  const baseClasses = "inline-flex items-center gap-2 px-2.5 py-1 text-[10px] font-black font-headline uppercase tracking-widest transition-colors shadow-sm"
  
  const variantClasses = {
    // Standard M3 dynamic tokens
    default: 'bg-surface-container text-primary', 
    error: 'bg-error text-white',
    success: 'bg-green-600 text-white',
    warning: 'bg-amber-400 text-amber-950',
    urgent: 'bg-tertiary text-white',
  }

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {icon && <span className="material-symbols-outlined text-[14px]">{icon}</span>}
      {children}
    </span>
  )
}