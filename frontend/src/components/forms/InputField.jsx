export default function InputField({
  label,
  placeholder,
  type = 'text',
  name,
  value,
  onChange,
  required = false,
  className = '',
  error = '',
  variant = 'underline',
  disabled = false,
  id,
  inputMode,
  dir,
}) {
  const inputId = id || name

  return (
    <div className="flex flex-col">
      {label && (
        <label
          htmlFor={inputId}
          className="font-headline font-bold uppercase text-[11px] sm:text-xs tracking-wider text-slate-700 mb-1.5 flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-red-500 ms-1">*</span>}
          </span>
        </label>
      )}
      <input
        id={inputId}
        type={type}
        inputMode={inputMode}
        dir={dir}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={
          variant === 'bordered'
            ? `w-full h-10 sm:h-11 px-3.5 rounded-xl border bg-slate-50/50 hover:bg-white focus:bg-white transition-all font-body text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none ${
                error
                  ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/10'
              } ${className}`
            : `border-0 border-b-2 bg-surface-container-low px-3 sm:px-4 py-2 sm:py-3 focus:ring-0 transition-colors font-body text-sm rtl:text-base placeholder:text-slate-400 ${
                error
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-surface-variant focus:border-tertiary'
              } ${className}`
        }
      />
      {error && (
        <span className="mt-1 text-[11px] text-red-500 font-medium">
          {error}
        </span>
      )}
    </div>
  )
}
