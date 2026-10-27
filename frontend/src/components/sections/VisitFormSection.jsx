/**
 * VisitFormSection
 *
 * Extracted from RequestVisit.jsx — contains the entire visit request form
 * without the page Header / Footer wrapper. Used inside the unified Request page.
 *
 * Props:
 *   visible (boolean) — when false the form is hidden but NOT unmounted,
 *                        so state is preserved when the user switches request types.
 */
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import InputField from '../forms/InputField'
import TextAreaField from '../forms/TextAreaField'
import FileUploadField from '../forms/FileUploadField'
import SubmitButton from '../forms/SubmitButton'
import TurnstileWidget from '../forms/TurnstileWidget'
import Icon from '../shared/Icon'
import { api } from '../../utils/api'
import { isLoggedIn } from '../../utils/auth'
import { validateUploadFile } from '../../utils/fileValidation'
import { useFormSubmit } from '../../hooks/useFormSubmit.js'

export default function VisitFormSection({ visible = true }) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    factory_name: '',
    factory_activity: '',
    name: '',
    phone_number: '',
    whatsapp_number: '',
    email: '',
    address: '',
    details: '',
    preferred_date: new Date().toISOString().split('T')[0],
  })

  const [file, setFile] = useState(null)
  const [fileUploadKey, setFileUploadKey] = useState(0)

  // Turnstile state — null means not yet verified
  const [turnstileToken, setTurnstileToken] = useState(null)
  const turnstileRef = useRef(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const { valid } = validateUploadFile(selectedFile, t)
      if (!valid) {
        setFile(null)
        return
      }
      setFile(selectedFile)
    } else {
      setFile(null)
    }
  }

  useEffect(() => {
    if (!isLoggedIn()) return
    api.getMe()
      .then((user) => {
        const parts = (user.name || '').split(' ')
        setFormData((prev) => ({
          ...prev,
          name: parts[0] ? `${parts[0]}${parts[1] ? ` ${parts[1]}` : ''}` : prev.name,
          phone_number: user.phone_number || prev.phone_number,
          whatsapp_number: user.whatsapp_number || prev.whatsapp_number,
          email: user.email || prev.email,
        }))
      })
      .catch(() => {})
  }, [])

  const resetTurnstile = () => {
    setTurnstileToken(null)
    turnstileRef.current?.reset()
  }

  const { isSubmitting, handleSubmit: submitForm } = useFormSubmit({
    onSubmit: () => {
      const payload = new FormData()
      payload.append('factory_name', formData.factory_name)
      payload.append('factory_activity', formData.factory_activity)
      payload.append('name', formData.name)
      payload.append('phone_number', formData.phone_number)
      if (formData.whatsapp_number) {
        payload.append('whatsapp_number', formData.whatsapp_number)
      }
      payload.append('email', formData.email)
      payload.append('address', formData.address)
      payload.append('details', formData.details)
      payload.append('preferred_date', new Date(formData.preferred_date).toISOString())
      payload.append('status', 'PENDING')
      payload.append('turnstileToken', turnstileToken)
      if (file instanceof File) {
        payload.append('file', file)
      }
      return api.sendVisitRequest(payload)
    },
    successMessage: t('notifications.visitSuccess'),
    onSuccess: () => {
      setFormData({
        factory_name: '',
        factory_activity: '',
        name: '',
        phone_number: '',
        whatsapp_number: '',
        email: '',
        address: '',
        details: '',
        preferred_date: new Date().toISOString().split('T')[0],
      })
      setFile(null)
      setFileUploadKey((prev) => prev + 1)
      resetTurnstile()
    },
    onError: () => {
      resetTurnstile()
      return false
    },
    t,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await submitForm()
  }

  const isSubmitDisabled = isSubmitting || !turnstileToken

  return (
    <div className={`lg:col-span-8 ${visible ? '' : 'hidden'}`} aria-hidden={!visible}>
      <div className="bg-white p-6 sm:p-8 lg:p-10">
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7 max-w-3xl">
          {/* Section 1 — Facility Information */}
          <div>
            <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-headline text-xs font-bold flex items-center justify-center">
                01
              </span>
              <h3 className="font-headline text-xs sm:text-sm font-bold uppercase tracking-wider text-deep-blue">
                {t('requestVisit.section1Title')}
              </h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
              <InputField
                label={t('requestVisit.factoryName')}
                placeholder={t('requestVisit.factoryNamePlaceholder')}
                name="factory_name"
                value={formData.factory_name}
                onChange={handleChange}
                required
                variant="bordered"
              />
              <InputField
                label={t('requestVisit.factoryActivity')}
                placeholder={t('requestVisit.factoryActivityPlaceholder')}
                name="factory_activity"
                value={formData.factory_activity}
                onChange={handleChange}
                required
                variant="bordered"
              />
            </div>
          </div>

          {/* Section 2 — Contact Information */}
          <div>
            <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-headline text-xs font-bold flex items-center justify-center">
                02
              </span>
              <h3 className="font-headline text-xs sm:text-sm font-bold uppercase tracking-wider text-deep-blue">
                {t('requestVisit.section2Title')}
              </h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
              <InputField
                label={t('requestVisit.firstName')}
                placeholder="Ahmed Khaled"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                variant="bordered"
              />
              <InputField
                label={t('requestVisit.phoneNumber')}
                type="tel"
                placeholder="(+20) 01234567890"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                required
                variant="bordered"
              />
              <InputField
                label={t('requestVisit.whatsappNumber')}
                type="tel"
                placeholder="(+20) 01012345678"
                name="whatsapp_number"
                value={formData.whatsapp_number}
                onChange={handleChange}
                variant="bordered"
              />
              <InputField
                label={t('requestVisit.emailAddress')}
                type="email"
                placeholder="name@company.com"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                variant="bordered"
              />
            </div>
          </div>

          {/* Section 3 — Visit Details */}
          <div>
            <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-headline text-xs font-bold flex items-center justify-center">
                03
              </span>
              <h3 className="font-headline text-xs sm:text-sm font-bold uppercase tracking-wider text-deep-blue">
                {t('requestVisit.section3Title')}
              </h3>
            </div>
            <div className="space-y-4 sm:space-y-5">
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
                <InputField
                  label={t('requestVisit.physicalAddress')}
                  placeholder="Cairo / Alexandria Desert Road..."
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  variant="bordered"
                />
                <InputField
                  label={t('requestVisit.preferredDate')}
                  type="date"
                  name="preferred_date"
                  value={formData.preferred_date}
                  onChange={handleChange}
                  required
                  variant="bordered"
                />
              </div>
              <TextAreaField
                label={t('requestVisit.technicalDetails')}
                placeholder={t('requestVisit.technicalDetailsPlaceholder')}
                name="details"
                value={formData.details}
                onChange={handleChange}
                rows={3}
                required
              />
              <FileUploadField
                key={fileUploadKey}
                label={t('requestVisit.fileUpload')}
                name="file"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Turnstile + Submit */}
          <div className="pt-2 space-y-4">
            <div className="space-y-1.5">
              <p className="font-headline font-bold uppercase text-[11px] sm:text-xs tracking-wider text-slate-600">
                {t('turnstile.verifyPrompt')}
              </p>
              <TurnstileWidget
                ref={turnstileRef}
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken(null)}
                onError={() => setTurnstileToken(null)}
              />
            </div>

            <div className="pt-2">
              <SubmitButton
                loading={isSubmitting}
                loadingText={t('requestQuote.submitting')}
                disabled={isSubmitDisabled}
                className="w-full sm:w-auto h-11 sm:h-12 px-7 sm:px-8 rounded-xl bg-primary hover:bg-primary-dark text-white font-headline font-bold uppercase tracking-wider text-xs sm:text-sm shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2.5 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{t('requestVisit.submitButton')}</span>
                <Icon
                  icon="arrow_forward"
                  className="text-base transition-transform rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                />
              </SubmitButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
