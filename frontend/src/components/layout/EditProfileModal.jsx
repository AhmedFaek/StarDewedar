import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormSubmit } from '../../hooks/useFormSubmit.js'
import { api } from '../../utils/api.js'
import { getAllowedEgyptianPhoneInput, isValidEgyptianPhoneNumber } from '../../../../shared/egyptianPhone.js'
import SubmitButton from '../forms/SubmitButton.jsx'

export default function EditProfileModal({ isOpen, user, onClose, onSuccess }) {
  const { t } = useTranslation()
  const overlayRef = useRef(null)
  const [form, setForm] = useState({
    name: '',
    phone_number: '',
    whatsapp_number: '',
    company_name: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      setForm({
        name: user?.name || '',
        phone_number: user?.phone_number || '',
        whatsapp_number: user?.whatsapp_number || '',
        company_name: user?.company_name || '',
      })
      setErrors({})
    }
  }, [isOpen, user])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const { isSubmitting, handleSubmit: submitForm } = useFormSubmit({
    onSubmit: () => api.updateProfile({
      name: form.name.trim(),
      phone_number: form.phone_number.trim(),
      whatsapp_number: form.whatsapp_number.trim(),
      company_name: form.company_name.trim(),
    }),
    successMessage: t('auth.profileUpdatedSuccess'),
    onSuccess,
    t,
  })

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    const trimmedName = form.name.trim()
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      nextErrors.name = t('auth.profileNameInvalid')
    }

    for (const field of ['phone_number', 'whatsapp_number']) {
      const value = form[field].trim()
      if (value && !isValidEgyptianPhoneNumber(value)) {
        nextErrors[field] = t('phone.invalid')
      }
    }
    if (form.company_name.trim().length > 150) {
      nextErrors.company_name = t('auth.profileCompanyInvalid')
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    await submitForm()
  }

  const handlePhoneChange = (field) => (event) => {
    const value = getAllowedEgyptianPhoneInput(event)
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({
      ...current,
      [field]: value && !isValidEgyptianPhoneNumber(value) ? t('phone.invalid') : '',
    }))
  }

  const handleOverlayClick = (event) => {
    if (event.target === overlayRef.current) onClose()
  }

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 px-4"
      style={{ animation: 'fadeIn 0.2s ease' }}
    >
      <div
        className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-white shadow-2xl"
        style={{ animation: 'slideUp 0.25s ease' }}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-0 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">person_edit</span>
            <h2 className="font-headline text-sm font-bold uppercase tracking-wider text-slate-900">
              {t('auth.editProfile')}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 transition-colors hover:text-slate-700" aria-label={t('auth.close')}>
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <div className="px-6 py-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="edit-profile-name"
                className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                {t('auth.fullName')}
              </label>
              <input
                id="edit-profile-name"
                required
                maxLength={100}
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="block w-full border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-primary focus:bg-white"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label
                htmlFor="edit-profile-phone"
                className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                {t('auth.phoneOptional')}
              </label>
              <input
                id="edit-profile-phone"
                type="tel"
                inputMode="tel"
                dir="ltr"
                value={form.phone_number}
                onChange={handlePhoneChange('phone_number')}
                className="block w-full border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-primary focus:bg-white"
              />
              {errors.phone_number && <p className="mt-1 text-xs text-red-500">{errors.phone_number}</p>}
            </div>

            <div>
              <label
                htmlFor="edit-profile-whatsapp"
                className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                {t('auth.whatsappOptional')}
              </label>
              <input
                id="edit-profile-whatsapp"
                type="tel"
                inputMode="tel"
                dir="ltr"
                value={form.whatsapp_number}
                onChange={handlePhoneChange('whatsapp_number')}
                className="block w-full border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-primary focus:bg-white"
              />
              {errors.whatsapp_number && <p className="mt-1 text-xs text-red-500">{errors.whatsapp_number}</p>}
            </div>

            <div>
              <label
                htmlFor="edit-profile-company"
                className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                {t('auth.companyOptional')}
              </label>
              <input
                id="edit-profile-company"
                maxLength={150}
                value={form.company_name}
                onChange={(event) => setForm((current) => ({ ...current, company_name: event.target.value }))}
                className="block w-full border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-primary focus:bg-white"
              />
              {errors.company_name && <p className="mt-1 text-xs text-red-500">{errors.company_name}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-slate-300 px-3 py-3 text-xs font-headline font-bold uppercase tracking-wider text-slate-600 transition-colors hover:bg-slate-50"
              >
                {t('auth.cancel')}
              </button>
              <SubmitButton
                id="edit-profile-submit"
                loading={isSubmitting}
                loadingText={t('auth.savingProfile')}
                className="flex-1 bg-primary px-3 py-3 text-xs font-headline font-bold uppercase tracking-wider text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('auth.saveProfile')}
              </SubmitButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
