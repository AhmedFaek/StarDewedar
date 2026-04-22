export const StatCard = ({ 
  label, 
  value, 
  trend, 
  icon, 
  variant = 'default',
  badge 
}) => {
  const baseClasses = "p-8 relative overflow-hidden group"
  
  const variantClasses = {
    default: 'bg-surface-container-lowest',
    tertiary: 'bg-tertiary-fixed',
    gradient: 'voltage-gradient'
  }

  const labelClasses = {
    default: 'text-secondary',
    tertiary: 'text-on-tertiary-fixed',
    gradient: 'text-on-primary-container'
  }

  const valueClasses = {
    default: 'text-primary',
    tertiary: 'text-on-tertiary-fixed',
    gradient: 'text-white'
  }

  const trendClasses = {
    default: 'text-tertiary',
    tertiary: 'bg-on-tertiary-fixed text-tertiary-fixed text-xs px-2 py-0.5 font-bold',
    gradient: 'text-on-primary-container'
  }

  const iconColor = {
    default: 'text-surface-container opacity-50',
    tertiary: 'text-on-tertiary-fixed opacity-5',
    gradient: 'text-white opacity-5'
  }

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} border-l border-outline-variant border-opacity-10`}>
      <div className="relative z-10">
        <p className={`text-xs font-bold font-headline uppercase tracking-widest mb-4 ${labelClasses[variant]}`}>
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <span className={`text-5xl font-black font-headline tracking-tighter ${valueClasses[variant]}`}>
            {value}
          </span>
          {badge ? (
            <span className={trendClasses[variant]}>
              {trend}
            </span>
          ) : (
            <span className={`text-xs font-bold tracking-tighter ${valueClasses[variant]}`}>
              {trend}
            </span>
          )}
        </div>
      </div>
      <span className={`material-symbols-outlined absolute -right-4 -bottom-4 text-9xl ${iconColor[variant]} group-hover:text-primary-container transition-colors pointer-events-none`}>
        {icon}
      </span>
    </div>
  )
}
