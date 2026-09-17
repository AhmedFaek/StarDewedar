/**
 * BOQFormSection
 *
 * BOQ (Bill of Quantities) request form. Uses the same design tokens,
 * component library, Turnstile implementation, and useFormSubmit hook
 * as the existing Visit and Quote forms.
 *
 * Props:
 *   visible (boolean) — when false the form is hidden but NOT unmounted,
 *                        so state is preserved when switching request types.
 */
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import InputField from '../forms/InputField'
import SelectField from '../forms/SelectField'
import TextAreaField from '../forms/TextAreaField'
import SubmitButton from '../forms/SubmitButton'
import TurnstileWidget from '../forms/TurnstileWidget'
import Icon from '../shared/Icon'
import { api } from '../../utils/api'
import { isLoggedIn } from '../../utils/auth'
import { validateBOQFile } from '../../utils/fileValidation'
import { useFormSubmit } from '../../hooks/useFormSubmit.js'

// BOQ-specific file types shown to the user
const BOQ_ACCEPT = '.pdf,.xls,.xlsx,.csv'

export default function BOQFormSection({ visible = true }) {
  const { t } = useTranslation()

  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    project_name: '',
    project_location: '',
    project_type: '',
    additional_requirements: '',
  })

  const [boqFile, setBoqFile] = useState(null)
  const [boqFileError, setBoqFileError] = useState('')
  const [boqFileName, setBoqFileName] = useState('')

  const [supportingFiles, setSupportingFiles] = useState([])
  const [supportingFileErrors, setSupportingFileErrors] = useState([])

  const [errors, setErrors] = useState({})

  // File upload key for resetting inputs after success
  const [boqUploadKey, setBoqUploadKey] = useState(0)
  const [supportingUploadKey, setSupportingUploadKey] = useState(0)

  const [turnstileToken, setTurnstileToken] = useState(null)
  const turnstileRef = useRef(null)

  // ── Fetch logged-in user profile to prefill contact information ────────────
  useEffect(() => {
    if (!isLoggedIn()) return
    api.getMe()
      .then((user) => {
        if (!user) return
        setFormData((prev) => ({
          ...prev,
          name: user.name || prev.name,
          company_name: user.company_name || prev.company_name,
          email: user.email || prev.email,
          phone: user.phone_number || prev.phone,
        }))
      })
      .catch(() => {})
  }, [])

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = () => {
    const e = {}
    if (!formData.name.trim() || formData.name.trim().length < 2)
      e.name = t('requestBOQ.validation.nameRequired')
    if (!formData.company_name.trim() || formData.company_name.trim().length < 2)
      e.company_name = t('requestBOQ.validation.companyRequired')
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      e.email = t('requestBOQ.validation.emailInvalid')
    if (!formData.phone.trim() || formData.phone.trim().length < 10)
      e.phone = t('requestBOQ.validation.phoneRequired')
    if (!formData.project_name.trim() || formData.project_name.trim().length < 2)
      e.project_name = t('requestBOQ.validation.projectNameRequired')
    if (!formData.project_location.trim() || formData.project_location.trim().length < 2)
      e.project_location = t('requestBOQ.validation.projectLocationRequired')
    if (!formData.project_type)
      e.project_type = t('requestBOQ.validation.projectTypeRequired')
    if (!boqFile)
      e.boq_file = t('requestBOQ.validation.boqFileRequired')
    return e
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleBOQFileChange = (e) => {
    const file = e.target.files?.[0]
    setBoqFileError('')
    setBoqFileName('')
    setBoqFile(null)

    if (!file) return

    const { valid, error } = validateBOQFile(file, t)
    if (!valid) {
      setBoqFileError(error)
      e.target.value = ''
      return
    }

    setBoqFile(file)
    setBoqFileName(file.name)
    if (errors.boq_file) setErrors((prev) => ({ ...prev, boq_file: '' }))
  }

  const handleSupportingFilesChange = (e) => {
    const files = Array.from(e.target.files || [])
    const validFiles = []
    const fileErrors = []

    files.forEach((file) => {
      const { valid, error } = validateBOQFile(file, t)
      if (!valid) {
        fileErrors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    })

    setSupportingFiles(validFiles)
    setSupportingFileErrors(fileErrors)
  }

  const resetTurnstile = () => {
    setTurnstileToken(null)
    turnstileRef.current?.reset()
  }

  const { isSubmitting, handleSubmit: submitForm } = useFormSubmit({
    onSubmit: () => {
      const payload = new FormData()

      // Customer info
      payload.append('name', formData.name)
      payload.append('company_name', formData.company_name)
      payload.append('email', formData.email)
      payload.append('phone', formData.phone)

      // Project info
      payload.append('project_name', formData.project_name)
      payload.append('project_location', formData.project_location)
      payload.append('project_type', formData.project_type)

      if (formData.additional_requirements) {
        payload.append('additional_requirements', formData.additional_requirements)
      }

      // Files
      payload.append('boq_file', boqFile)
      supportingFiles.forEach((file) => {
        payload.append('supporting_docs', file)
      })

      // Turnstile
      payload.append('turnstileToken', turnstileToken)

      return api.sendBOQRequest(payload)
    },
    successMessage: t('requestBOQ.successMsg'),
    onSuccess: () => {
      setFormData((prev) => ({
        name: isLoggedIn() ? prev.name : '',
        company_name: isLoggedIn() ? prev.company_name : '',
        email: isLoggedIn() ? prev.email : '',
        phone: isLoggedIn() ? prev.phone : '',
        project_name: '',
        project_location: '',
        project_type: '',
        additional_requirements: '',
      }))
      setBoqFile(null)
      setBoqFileName('')
      setBoqFileError('')
      setSupportingFiles([])
      setSupportingFileErrors([])
      setErrors({})
      setBoqUploadKey((k) => k + 1)
      setSupportingUploadKey((k) => k + 1)
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
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    await submitForm()
  }

  const projectTypeOptions = [
    { value: 'industrial',      label: t('requestBOQ.projectTypes.industrial') },
    { value: 'commercial',      label: t('requestBOQ.projectTypes.commercial') },
    { value: 'residential',     label: t('requestBOQ.projectTypes.residential') },
    { value: 'infrastructure',  label: t('requestBOQ.projectTypes.infrastructure') },
    { value: 'electrical',      label: t('requestBOQ.projectTypes.electrical') },
    { value: 'other',           label: t('requestBOQ.projectTypes.other') },
  ]

  const isSubmitDisabled = isSubmitting || !turnstileToken

  return (
    <div className={visible ? '' : 'hidden'} aria-hidden={!visible}>
      <div className="bg-surface-container-lowest p-6 sm:p-10 md:p-12 lg:p-16">
        <form onSubmit={handleSubmit} className="space-y-10 sm:space-y-12 max-w-3xl">

          {/* ─── Section 1: Customer Information ─────────────────────────── */}
          <div>
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <span className="bg-primary text-white font-headline px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold">01</span>
              <h2 className="font-label text-[9px] sm:text-xs font-bold uppercase tracking-[0.2em] text-primary">
                {t('requestBOQ.section1Title')}
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
              <InputField
                label={t('requestBOQ.fullName')}
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                error={errors.name}
              />
              <InputField
                label={t('requestBOQ.companyName')}
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                required
                error={errors.company_name}
              />
              <InputField
                label={t('requestBOQ.emailAddress')}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                error={errors.email}
              />
              <InputField
                label={t('requestBOQ.phoneNumber')}
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                error={errors.phone}
              />
            </div>
          </div>

          {/* ─── Section 2: Project Information ──────────────────────────── */}
          <div>
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <span className="bg-primary text-white font-headline px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold">02</span>
              <h2 className="font-label text-[9px] sm:text-xs font-bold uppercase tracking-[0.2em] text-primary">
                {t('requestBOQ.section2Title')}
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
              <InputField
                label={t('requestBOQ.projectName')}
                name="project_name"
                value={formData.project_name}
                onChange={handleChange}
                required
                error={errors.project_name}
              />
              <InputField
                label={t('requestBOQ.projectLocation')}
                name="project_location"
                value={formData.project_location}
                onChange={handleChange}
                required
                error={errors.project_location}
              />
              <div className="sm:col-span-2">
                <SelectField
                  label={t('requestBOQ.projectType')}
                  name="project_type"
                  value={formData.project_type}
                  onChange={handleChange}
                  options={projectTypeOptions}
                  placeholder={t('requestBOQ.projectTypePlaceholder')}
                  error={errors.project_type}
                />
                {errors.project_type && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.project_type}</p>
                )}
              </div>
            </div>
          </div>

          {/* ─── Section 3: BOQ & Supporting Documents ────────────────────── */}
          <div>
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <span className="bg-primary text-white font-headline px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold">03</span>
              <h2 className="font-label text-[9px] sm:text-xs font-bold uppercase tracking-[0.2em] text-primary">
                {t('requestBOQ.section3Title')}
              </h2>
            </div>
            <div className="space-y-6 sm:space-y-8">
              {/* BOQ File — Required */}
              <div className="flex flex-col">
                <label className="font-label font-bold uppercase text-[10px] sm:text-[12px] tracking-[0.15em] rtl:tracking-normal rtl:normal-case text-secondary mb-2 sm:mb-3">
                  {t('requestBOQ.boqFile')} <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    key={boqUploadKey}
                    type="file"
                    name="boq_file"
                    accept={BOQ_ACCEPT}
                    onChange={handleBOQFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    aria-label={t('requestBOQ.boqFile')}
                    aria-required="true"
                  />
                  <div className={`border-2 border-dashed bg-surface-container-low p-6 sm:p-8 flex flex-col items-center justify-center transition-all group-hover:bg-surface-variant ${
                    (boqFileError || errors.boq_file)
                      ? 'border-red-400 group-hover:border-red-500'
                      : 'border-outline-variant group-hover:border-primary'
                  }`}>
                    <Icon icon="upload_file" className="text-3xl sm:text-4xl text-secondary group-hover:text-primary mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest text-secondary text-center">
                      {t('requestBOQ.boqFileDesc')}
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-secondary/60 mt-1">
                      {t('fileValidation.boqAllowedTypes')}
                    </p>
                  </div>
                </div>
                {boqFileName && !boqFileError && (
                  <p className="mt-2 text-xs font-semibold text-green-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    {boqFileName}
                  </p>
                )}
                {(boqFileError || errors.boq_file) && (
                  <p className="mt-2 text-xs text-red-500 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {boqFileError || errors.boq_file}
                  </p>
                )}
              </div>

              {/* Supporting Documents — Optional */}
              <div className="flex flex-col">
                <label className="font-label font-bold uppercase text-[10px] sm:text-[12px] tracking-[0.15em] rtl:tracking-normal rtl:normal-case text-secondary mb-2 sm:mb-3">
                  {t('requestBOQ.supportingDocs')}
                </label>
                <div className="relative group">
                  <input
                    key={supportingUploadKey}
                    type="file"
                    name="supporting_docs"
                    accept={BOQ_ACCEPT}
                    multiple
                    onChange={handleSupportingFilesChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    aria-label={t('requestBOQ.supportingDocs')}
                  />
                  <div className="border-2 border-dashed bg-surface-container-low p-6 sm:p-8 flex flex-col items-center justify-center transition-all group-hover:bg-surface-variant border-outline-variant group-hover:border-primary">
                    <Icon icon="folder_open" className="text-3xl sm:text-4xl text-secondary group-hover:text-primary mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest text-secondary text-center">
                      {t('requestBOQ.supportingDocsDesc')}
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-secondary/60 mt-1">
                      {t('fileValidation.boqAllowedTypes')}
                    </p>
                  </div>
                </div>
                {supportingFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {supportingFiles.map((f, i) => (
                      <p key={i} className="text-xs font-semibold text-green-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        {f.name}
                      </p>
                    ))}
                  </div>
                )}
                {supportingFileErrors.map((err, i) => (
                  <p key={i} className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {err}
                  </p>
                ))}
              </div>

              {/* Additional Requirements */}
              <TextAreaField
                label={t('requestBOQ.additionalRequirements')}
                name="additional_requirements"
                placeholder={t('requestBOQ.additionalRequirementsPlaceholder')}
                value={formData.additional_requirements}
                onChange={handleChange}
                rows={5}
              />
            </div>
          </div>

          {/* ─── Turnstile + Submit ───────────────────────────────────────── */}
          <div className="pt-6 sm:pt-8 space-y-6">
            <div className="space-y-2">
              <p className="font-label font-bold uppercase text-[10px] sm:text-[12px] tracking-[0.15em] rtl:tracking-normal rtl:normal-case text-secondary">
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
              loadingText={t('requestBOQ.submitting')}
              disabled={isSubmitDisabled}
              className="w-full sm:w-auto bg-tertiary-fixed text-on-tertiary-fixed font-headline font-bold uppercase tracking-[0.15em] text-xs sm:text-sm px-8 sm:px-12 py-4 sm:py-5 flex items-center justify-center gap-3 hover:bg-tertiary transition-all hover:text-white group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{t('requestBOQ.submitButton')}</span>
              <Icon icon="arrow_forward" className="transition-transform rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  )
}
