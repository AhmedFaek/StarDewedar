import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import InputField from '../components/forms/InputField'
import TextAreaField from '../components/forms/TextAreaField'
import FileUploadField from '../components/forms/FileUploadField'
import SubmitButton from '../components/forms/SubmitButton'
import TurnstileWidget from '../components/forms/TurnstileWidget'
import { api } from '../utils/api'
import { isLoggedIn } from '../utils/auth'
import { validateUploadFile } from '../utils/fileValidation'
import { useFormSubmit } from '../hooks/useFormSubmit.js'

export default function RequestVisit() {
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

  // Reset Turnstile widget (called after success or failure requiring re-verification)
  const resetTurnstile = () => {
    setTurnstileToken(null)
    turnstileRef.current?.reset()
  }

  const { isSubmitting, handleSubmit: submitForm } = useFormSubmit({
    onSubmit: () => {
      // Build FormData so the backend (multer) can parse the multipart body,
      // and so the Turnstile token and optional file are included.
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
      // Include the verified Turnstile token
      payload.append('turnstileToken', turnstileToken)
      // Attach file if one was selected
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
      // Reset Turnstile so a fresh token is required for any subsequent submission
      resetTurnstile()
    },
    onError: () => {
      // Reset Turnstile on failure so the user must re-verify before retrying
      resetTurnstile()
      // Return false so the hook still shows the error toast
      return false
    },
    t,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await submitForm()
  }

  // Submit is allowed only when Turnstile has been verified
  const isSubmitDisabled = isSubmitting || !turnstileToken

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="flex-grow pt-32 pb-20">
        <section className="max-w-7xl mx-auto px-4 sm:px-8 mb-16">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-end">
            <div>
              <h1 className="font-headline font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tighter text-primary leading-[0.9] mb-6 sm:mb-8">
                {t('requestVisit.heroTitle1')} <br className="hidden sm:block" />
                {t('requestVisit.heroTitle2')} <br className="hidden sm:block" />
                {t('requestVisit.heroTitle3')}
              </h1>
              <div className="h-1 w-20 sm:w-32 bg-tertiary-fixed mb-6 sm:mb-8" />
            </div>
            <div className="pb-2 sm:pb-4">
              <p className="text-secondary text-base sm:text-lg lg:text-xl leading-relaxed max-w-lg">
                {t('requestVisit.heroDesc')}
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="bg-surface-container-low grid md:grid-cols-12 gap-0 overflow-hidden rounded-lg">
            <div className="md:col-span-4 relative h-48 md:h-full min-h-[400px]">
              <img
                alt="Industrial Infrastructure"
                className="absolute inset-0 w-full h-full object-cover"
                src="/images/visit_hero.webp"
              />
              <div className="absolute inset-0 bg-primary/40" />
            </div>

            <div className="md:col-span-8 p-6 sm:p-8 md:p-12 lg:p-16 bg-white">
              <form onSubmit={handleSubmit} className="space-y-10 sm:space-y-12">
                <div>
                  <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <span className="bg-primary text-white font-headline px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold">01</span>
                    <h2 className="font-label text-[9px] sm:text-xs font-bold uppercase tracking-[0.2em] text-primary">{t('requestVisit.section1Title')}</h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
                    <InputField label={t('requestVisit.factoryName')} placeholder={t('requestVisit.factoryNamePlaceholder')} name="factory_name" value={formData.factory_name} onChange={handleChange} required />
                    <InputField label={t('requestVisit.factoryActivity')} placeholder={t('requestVisit.factoryActivityPlaceholder')} name="factory_activity" value={formData.factory_activity} onChange={handleChange} required />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <span className="bg-primary text-white font-headline px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold">02</span>
                    <h2 className="font-label text-[9px] sm:text-xs font-bold uppercase tracking-[0.2em] text-primary">{t('requestVisit.section2Title')}</h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
                    <InputField label={t('requestVisit.firstName')} placeholder="" name="name" value={formData.name} onChange={handleChange} required />
                    <InputField label={t('requestVisit.phoneNumber')} type="tel" placeholder="" name="phone_number" value={formData.phone_number} onChange={handleChange} required />
                    <InputField label={t('requestVisit.whatsappNumber')} type="tel" placeholder="" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleChange} />
                    <InputField label={t('requestVisit.emailAddress')} type="email" placeholder="" name="email" value={formData.email} onChange={handleChange} required />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <span className="bg-primary text-white font-headline px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold">03</span>
                    <h2 className="font-label text-[9px] sm:text-xs font-bold uppercase tracking-[0.2em] text-primary">{t('requestVisit.section3Title')}</h2>
                  </div>
                  <div className="space-y-6 sm:space-y-8">
                    <InputField label={t('requestVisit.physicalAddress')} placeholder="" name="address" value={formData.address} onChange={handleChange} required />
                    <InputField label={t('requestVisit.preferredDate')} type="date" name="preferred_date" value={formData.preferred_date} onChange={handleChange} required />
                    <TextAreaField label={t('requestVisit.technicalDetails')} placeholder={t('requestVisit.technicalDetailsPlaceholder')} name="details" value={formData.details} onChange={handleChange} rows={4} required />
                    {/* Optional file/document attachment */}
                    <FileUploadField
                      key={fileUploadKey}
                      label={t('requestVisit.fileUpload')}
                      name="file"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                <div className="pt-6 sm:pt-8 space-y-6">
                  {/* Cloudflare Turnstile — must be completed before submitting */}
                  <div className="space-y-2">
                    <p className="font-label font-bold uppercase text-[10px] sm:text-[12px] tracking-[0.2em] text-primary">
                      {t('turnstile.verifyPrompt')}
                    </p>
                    <TurnstileWidget
                      ref={turnstileRef}
                      onVerify={(token) => setTurnstileToken(token)}
                      onExpire={() => setTurnstileToken(null)}
                      onError={() => setTurnstileToken(null)}
                    />
                  </div>

                  <SubmitButton
                    loading={isSubmitting}
                    loadingText={t('requestQuote.submitting')}
                    disabled={isSubmitDisabled}
                    className="w-full py-4 sm:py-6 bg-gradient-to-r from-primary to-primary-container text-white font-headline font-black text-lg sm:text-xl tracking-tighter transition-transform active:scale-[0.98] hover:shadow-lg flex justify-between items-center px-6 sm:px-8 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{t('requestVisit.submitButton')}</span>
                    <span className="material-symbols-outlined text-xl sm:text-2xl rtl:rotate-180 group-hover:translate-x-2 rtl:group-hover:-translate-x-2 transition-transform">arrow_forward</span>
                  </SubmitButton>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
