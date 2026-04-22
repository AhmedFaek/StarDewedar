export const Button = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
  ...props 
}) => {
  const baseClasses = "font-headline font-bold uppercase tracking-widest transition-smooth flex items-center gap-2 justify-center"
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const variantClasses = {
    primary: 'bg-primary text-on-primary hover:bg-primary-container',
    secondary: 'bg-secondary text-on-secondary hover:bg-on-surface-variant',
    tertiary: 'bg-tertiary-fixed text-on-tertiary-fixed hover:bg-tertiary-fixed-dim',
    outline: 'border border-outline text-primary hover:bg-surface-container-low',
    ghost: 'text-primary hover:bg-surface-container-low',
  }

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="material-symbols-outlined text-sm">{icon}</span>}
      {children}
    </button>
  )
}
