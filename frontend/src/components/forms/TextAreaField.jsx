export default function TextAreaField({
  label,
  placeholder,
  name,
  value,
  onChange,
  rows = 5,
  required = false,
  className = '',
  error = '',
}) {
  return (
    <div className="flex flex-col">
      <label className="font-label font-bold uppercase text-[10px] sm:text-[12px] tracking-[0.15em] rtl:tracking-normal rtl:normal-case text-secondary mb-2 sm:mb-3">
        {label}
        {required && <span className="text-red-500 ms-0.5">*</span>}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className={`border-0 border-b-2 bg-surface-container-low px-3 sm:px-4 py-2 sm:py-3 focus:ring-0 transition-colors font-body text-sm rtl:text-base placeholder:text-slate-400 resize-none ${
          error
            ? 'border-red-500 focus:border-red-500'
            : 'border-surface-variant focus:border-tertiary'
        } ${className}`}
      />
      {error && (
        <span className="mt-1.5 text-[11px] text-red-500 font-label">
          {error}
        </span>
      )}
    </div>
  )
}
