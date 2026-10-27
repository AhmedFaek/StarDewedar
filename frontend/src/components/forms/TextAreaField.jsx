export default function TextAreaField({
  label,
  placeholder,
  name,
  value,
  onChange,
  rows = 3,
  required = false,
  className = '',
  error = '',
  disabled = false,
  id,
}) {
  const areaId = id || name

  return (
    <div className="flex flex-col">
      {label && (
        <label
          htmlFor={areaId}
          className="font-headline font-bold uppercase text-[11px] sm:text-xs tracking-wider text-slate-700 mb-1.5 flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-red-500 ms-1">*</span>}
          </span>
        </label>
      )}
      <textarea
        id={areaId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        className={`w-full p-3 sm:p-3.5 rounded-xl border bg-slate-50/50 hover:bg-white focus:bg-white transition-all font-body text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none resize-none leading-relaxed ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
            : 'border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/10'
        } ${className}`}
      />
      {error && (
        <span className="mt-1 text-[11px] text-red-500 font-medium">
          {error}
        </span>
      )}
    </div>
  )
}
