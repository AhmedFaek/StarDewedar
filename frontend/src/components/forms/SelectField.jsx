export default function SelectField({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  className = '',
  required = false,
  error = '',
  disabled = false,
  id,
}) {
  const selectId = id || name

  return (
    <div className="flex flex-col">
      {label && (
        <label
          htmlFor={selectId}
          className="font-headline font-bold uppercase text-[11px] sm:text-xs tracking-wider text-slate-700 mb-1.5 flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-red-500 ms-1">*</span>}
          </span>
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`w-full h-10 sm:h-11 px-3.5 pe-9 rounded-xl border bg-slate-50/50 hover:bg-white focus:bg-white transition-all font-body text-xs sm:text-sm text-slate-900 outline-none appearance-none cursor-pointer ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
              : 'border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/10'
          } ${className}`}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
          expand_more
        </span>
      </div>
      {error && (
        <span className="mt-1 text-[11px] text-red-500 font-medium">
          {error}
        </span>
      )}
    </div>
  )
}
