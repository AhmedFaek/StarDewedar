import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../shared/Icon'
import { validateUploadFile } from '../../utils/fileValidation'

export default function FileUploadField({
  label,
  name,
  onChange,
  className = '',
}) {
  const { t } = useTranslation()
  const [fileError, setFileError] = useState('')
  const [selectedName, setSelectedName] = useState('')

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    setFileError('')
    setSelectedName('')

    if (!file) {
      onChange(e)
      return
    }

    const { valid, error } = validateUploadFile(file, t)
    if (!valid) {
      setFileError(error)
      // Reset the input so the invalid file isn't attached
      e.target.value = ''
      return
    }

    setSelectedName(file.name)
    onChange(e)
  }

  return (
    <div className="flex flex-col">
      <label className="font-label font-bold uppercase text-[10px] sm:text-[12px] tracking-[0.15em] rtl:tracking-normal rtl:normal-case text-secondary mb-2 sm:mb-3">
        {label}
      </label>
      <div className="relative group">
        <input
          type="file"
          name={name}
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className={`border-2 border-dashed bg-surface-container-low p-6 sm:p-8 flex flex-col items-center justify-center transition-all group-hover:bg-surface-variant ${
          fileError
            ? 'border-red-400 group-hover:border-red-500'
            : 'border-outline-variant group-hover:border-primary'
        }`}>
          <Icon
            icon="upload_file"
            className="text-3xl sm:text-4xl text-secondary group-hover:text-primary mb-2"
          />
          <p className="text-xs font-bold uppercase tracking-widest text-secondary text-center">
            Drop files here or click to browse
          </p>
          <p className="text-[9px] sm:text-[10px] text-secondary/60 mt-1">
            {t('fileValidation.maxSize')} · {t('fileValidation.allowedTypes')}
          </p>
        </div>
      </div>
      {selectedName && !fileError && (
        <p className="mt-2 text-xs font-semibold text-green-600 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          {selectedName}
        </p>
      )}
      {fileError && (
        <p className="mt-2 text-xs text-red-500 font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          {fileError}
        </p>
      )}
    </div>
  )
}
