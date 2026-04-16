export default function InputField({
  label,
  placeholder,
  type = 'text',
  name,
  value,
  onChange,
  className = '',
}) {
  return (
    <div className="flex flex-col">
      <label className="font-label font-bold uppercase text-[9px] sm:text-[10px] tracking-[0.15em] text-secondary mb-2 sm:mb-3">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`border-0 border-b-2 border-surface-variant bg-surface-container-low px-3 sm:px-4 py-2 sm:py-3 focus:ring-0 focus:border-tertiary transition-colors font-body text-sm placeholder:text-slate-400 ${className}`}
      />
    </div>
  )
}
