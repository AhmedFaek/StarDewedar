export const Card = ({ 
  children, 
  className = "",
  variant = 'default'
}) => {
  const baseClasses = "bg-surface-container-lowest"
  const variantClasses = {
    default: 'bg-surface-container-lowest',
    elevated: 'bg-surface-container-highest shadow-industrial'
  }

  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  )
}
