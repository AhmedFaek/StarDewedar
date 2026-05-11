export default function SelectField({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  className = '',
}) {
  return (
    <div className="flex flex-col">
      <label className="font-label font-bold uppercase text-[10px] sm:text-[12px] tracking-[0.15em] rtl:tracking-normal rtl:normal-case text-secondary mb-2 sm:mb-3">
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`border-0 border-b-2 border-surface-variant bg-surface-container-low px-3 sm:px-4 py-2 sm:py-3 focus:ring-0 focus:border-tertiary transition-colors font-body text-sm rtl:text-base ${className}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
