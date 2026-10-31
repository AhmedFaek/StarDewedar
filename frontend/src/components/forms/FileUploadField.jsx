import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../shared/Icon'
import { validateUploadFile } from '../../utils/fileValidation'

export default function FileUploadField({
  label,
  name,
  onChange,
  className = '',
  accept = '.pdf,.jpg,.jpeg,.png',
  required = false,
  id,
}) {
  const { t } = useTranslation()
  const [fileError, setFileError] = useState('')
  const [selectedName, setSelectedName] = useState('')
  const inputId = id || name

  const handleChange = (e) => {
    const file = e.target.files?.[0]

    if (!file) {
      setFileError('')
      setSelectedName('')
      onChange(e)
      return
    }

    const { valid, error } = validateUploadFile(file, t)
    if (!valid) {
      setFileError(error)
      e.target.value = ''
      return
    }

    setFileError('')
    setSelectedName(file.name)
    onChange(e)
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="font-headline font-bold uppercase text-[11px] sm:text-xs rtl:text-[11px] rtl:font-semibold tracking-wider text-slate-700 mb-1.5 flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-red-500 ms-1">*</span>}
          </span>
        </label>
      )}
      <div className="relative group">
        <input
          id={inputId}
          type="file"
          name={name}
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div
          className={`rounded-xl border-2 border-dashed p-4 sm:p-5 flex flex-col items-center justify-center text-center transition-all ${
            fileError
              ? 'border-red-300 bg-red-50/30 group-hover:border-red-400'
              : 'border-slate-200 bg-slate-50/60 group-hover:border-primary group-hover:bg-primary/5'
          }`}
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-105 transition-transform">
            <Icon icon="upload_file" className="text-lg sm:text-xl" />
          </div>
          <p className="text-xs rtl:text-[11px] sm:rtl:text-[11.5px] font-headline font-bold rtl:font-medium uppercase tracking-wider text-deep-blue leading-relaxed">
            {t('fileValidation.dropOrBrowse', 'Drop files here or click to browse')}
          </p>
          <p className="text-[10px] rtl:text-[9.5px] text-slate-400 mt-0.5 font-body leading-normal">
            {t('fileValidation.maxSize')} · {t('fileValidation.allowedTypes')}
          </p>
        </div>
      </div>

      {selectedName && !fileError && (
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium self-start">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span className="truncate max-w-xs">{selectedName}</span>
        </div>
      )}

      {fileError && (
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-medium self-start">
          <span className="material-symbols-outlined text-sm">error</span>
          <span>{fileError}</span>
        </div>
      )}
    </div>
  )
}
