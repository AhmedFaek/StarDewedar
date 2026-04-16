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
      <label className="font-label font-bold uppercase text-[10px] tracking-[0.15em] text-secondary mb-2">
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`border-0 border-b-2 border-surface-variant bg-surface-container-low px-4 py-3 focus:ring-0 focus:border-tertiary transition-colors font-body text-sm ${className}`}
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
