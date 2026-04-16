export default function TextAreaField({
  label,
  placeholder,
  name,
  value,
  onChange,
  rows = 5,
  className = '',
}) {
  return (
    <div className="flex flex-col">
      <label className="font-label font-bold uppercase text-[10px] tracking-[0.15em] text-secondary mb-2">
        {label}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`border-0 border-b-2 border-surface-variant bg-surface-container-low px-4 py-3 focus:ring-0 focus:border-tertiary transition-colors font-body text-sm placeholder:text-slate-400 resize-none ${className}`}
      />
    </div>
  )
}
