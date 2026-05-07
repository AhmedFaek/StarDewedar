import Icon from '../shared/Icon'

export default function FileUploadField({
  label,
  name,
  onChange,
  className = '',
}) {
  return (
    <div className="flex flex-col">
      <label className="font-label font-bold uppercase text-[10px] sm:text-[12px] tracking-[0.15em] rtl:tracking-normal rtl:normal-case text-secondary mb-2 sm:mb-3">
        {label}
      </label>
      <div className="relative group">
        <input
          type="file"
          name={name}
          onChange={onChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="border-2 border-dashed border-outline-variant bg-surface-container-low p-6 sm:p-8 flex flex-col items-center justify-center transition-all group-hover:bg-surface-variant group-hover:border-primary">
          <Icon
            icon="upload_file"
            className="text-3xl sm:text-4xl text-secondary group-hover:text-primary mb-2"
          />
          <p className="text-xs font-bold uppercase tracking-widest text-secondary text-center">
            Drop files here or click to browse
          </p>
          <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1">Maximum size: 50MB</p>
        </div>
      </div>
    </div>
  )
}
