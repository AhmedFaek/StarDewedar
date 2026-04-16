export default function Icon({ icon, className = '', ...props }) {
  return (
    <span 
      className={`material-symbols-outlined ${className}`}
      {...props}
    >
      {icon}
    </span>
  )
}
