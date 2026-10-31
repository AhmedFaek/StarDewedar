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
import UnknownSubmissionOutcome from '../forms/UnknownSubmissionOutcome'
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
  const [unknownOutcome, setUnknownOutcome] = useState(false)

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
    if (!file) return

    const { valid, error } = validateBOQFile(file, t)
    if (!valid) {
      setBoqFileError(error)
      e.target.value = ''
      return
    }

    setBoqFileError('')
    setBoqFile(file)
    setBoqFileName(file.name)
    if (errors.boq_file) setErrors((prev) => ({ ...prev, boq_file: '' }))
  }

  const handleSupportingFilesChange = (e) => {
    const files = Array.from(e.target.files || [])
    const fileErrors = []
    const newValidFiles = []

    files.forEach((file) => {
      const { valid, error } = validateBOQFile(file, t)
      if (!valid) {
        fileErrors.push(`${file.name}: ${error}`)
      } else {
        newValidFiles.push(file)
      }
    })

    const uniqueFiles = newValidFiles.filter((file, index) => {
      const alreadySelected = supportingFiles.some((selected) =>
        selected.name === file.name &&
        selected.size === file.size &&
        selected.lastModified === file.lastModified
      )
      const duplicateInSelection = newValidFiles.findIndex((candidate) =>
        candidate.name === file.name &&
        candidate.size === file.size &&
        candidate.lastModified === file.lastModified
      ) !== index
      return !alreadySelected && !duplicateInSelection
    })
    const availableSlots = Math.max(0, 5 - supportingFiles.length)
    const acceptedFiles = uniqueFiles.slice(0, availableSlots)
    if (uniqueFiles.length > availableSlots) {
      fileErrors.push(t('fileValidation.maxSupportingFiles', { max: 5 }))
    }

    setSupportingFiles((previous) => [...previous, ...acceptedFiles])
    setSupportingFileErrors(fileErrors)
    e.target.value = ''
  }

  const resetTurnstile = () => {
    setTurnstileToken(null)
    turnstileRef.current?.reset()
  }

  const { isSubmitting, handleSubmit: submitForm } = useFormSubmit({
    onSubmit: () => {
      setUnknownOutcome(false)
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

      return api.sendBOQRequest(payload, turnstileToken)
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
    onUnknownOutcome: () => {
      setUnknownOutcome(true)
      return true
    },
    ambiguousNetworkError: true,
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
    <div className={`lg:col-span-8 ${visible ? '' : 'hidden'}`} aria-hidden={!visible}>
      <div className="bg-white p-6 sm:p-8 lg:p-10">
        {unknownOutcome && <UnknownSubmissionOutcome requestType="boq" />}
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7 max-w-3xl">

          {/* ─── Section 1: Customer Information ─────────────────────────── */}
          <div>
            <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-headline text-xs font-bold flex items-center justify-center">
                01
              </span>
              <h3 className="font-headline text-xs sm:text-sm font-bold uppercase tracking-wider text-deep-blue">
                {t('requestBOQ.section1Title')}
              </h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
              <InputField
                label={t('requestBOQ.fullName')}
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                error={errors.name}
                variant="bordered"
              />
              <InputField
                label={t('requestBOQ.companyName')}
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                required
                error={errors.company_name}
                variant="bordered"
              />
              <InputField
                label={t('requestBOQ.emailAddress')}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                error={errors.email}
                variant="bordered"
              />
              <InputField
                label={t('requestBOQ.phoneNumber')}
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                error={errors.phone}
                variant="bordered"
              />
            </div>
          </div>

          {/* ─── Section 2: Project Information ──────────────────────────── */}
          <div>
            <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-headline text-xs font-bold flex items-center justify-center">
                02
              </span>
              <h3 className="font-headline text-xs sm:text-sm font-bold uppercase tracking-wider text-deep-blue">
                {t('requestBOQ.section2Title')}
              </h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
              <InputField
                label={t('requestBOQ.projectName')}
                name="project_name"
                value={formData.project_name}
                onChange={handleChange}
                required
                error={errors.project_name}
                variant="bordered"
              />
              <InputField
                label={t('requestBOQ.projectLocation')}
                name="project_location"
                value={formData.project_location}
                onChange={handleChange}
                required
                error={errors.project_location}
                variant="bordered"
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
              </div>
            </div>
          </div>

          {/* ─── Section 3: BOQ & Supporting Documents ────────────────────── */}
          <div>
            <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-headline text-xs font-bold flex items-center justify-center">
                03
              </span>
              <h3 className="font-headline text-xs sm:text-sm font-bold uppercase tracking-wider text-deep-blue">
                {t('requestBOQ.section3Title')}
              </h3>
            </div>
            <div className="space-y-4 sm:space-y-5">
              {/* Dual-column File Upload Zone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* BOQ File — Required */}
                <div className="flex flex-col">
                  <label className="font-headline font-bold uppercase text-[11px] sm:text-xs rtl:text-[11px] rtl:font-semibold tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>
                      {t('requestBOQ.boqFile')} <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <div className="relative group flex-1">
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
                    <div className={`h-full min-h-[120px] rounded-xl border-2 border-dashed p-4 flex flex-col items-center justify-center text-center transition-all ${
                      (boqFileError || errors.boq_file)
                        ? 'border-red-300 bg-red-50/30 group-hover:border-red-400'
                        : 'border-slate-200 bg-slate-50/60 group-hover:border-primary group-hover:bg-primary/5'
                    }`}>
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                        <Icon icon="upload_file" className="text-lg" />
                      </div>
                      <p className="text-xs rtl:text-[11px] sm:rtl:text-[11.5px] font-headline font-bold rtl:font-medium uppercase tracking-wider text-deep-blue leading-relaxed">
                        {t('requestBOQ.boqFileDesc')}
                      </p>
                      <p className="text-[10px] rtl:text-[9.5px] text-slate-400 mt-0.5 font-body leading-normal">
                        {t('fileValidation.boqAllowedTypes')}
                      </p>
                    </div>
                  </div>
                  {boqFileName && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium self-start">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span className="truncate max-w-xs">{boqFileName}</span>
                    </div>
                  )}
                  {(boqFileError || errors.boq_file) && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-medium self-start">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{boqFileError || errors.boq_file}</span>
                    </div>
                  )}
                </div>

                {/* Supporting Documents — Optional */}
                <div className="flex flex-col">
                  <label className="font-headline font-bold uppercase text-[11px] sm:text-xs rtl:text-[11px] rtl:font-semibold tracking-wider text-slate-700 mb-1.5">
                    {t('requestBOQ.supportingDocs')}
                  </label>
                  <div className="relative group flex-1">
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
                    <div className="h-full min-h-[120px] rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-4 flex flex-col items-center justify-center text-center transition-all group-hover:border-primary group-hover:bg-primary/5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                        <Icon icon="folder_open" className="text-lg" />
                      </div>
                      <p className="text-xs rtl:text-[11px] sm:rtl:text-[11.5px] font-headline font-bold rtl:font-medium uppercase tracking-wider text-deep-blue leading-relaxed">
                        {t('requestBOQ.supportingDocsDesc')}
                      </p>
                      <p className="text-[10px] rtl:text-[9.5px] text-slate-400 mt-0.5 font-body leading-normal">
                        {t('fileValidation.boqAllowedTypes')}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-body">
                    {t('fileValidation.maxSupportingFiles', { max: 5 })}
                  </p>
                  {supportingFiles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {supportingFiles.map((f, i) => (
                        <div key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                          <span className="material-symbols-outlined text-xs">check_circle</span>
                          <span className="truncate max-w-[140px]">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSupportingFiles((previous) => previous.filter((_, index) => index !== i))
                              setSupportingFileErrors([])
                            }}
                            aria-label={t('fileValidation.removeFile', { name: f.name })}
                            className="ms-1 text-emerald-700 hover:text-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {supportingFileErrors.map((err, i) => (
                    <div key={i} className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-[11px] font-medium self-start">
                      <span className="material-symbols-outlined text-xs">error</span>
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Requirements */}
              <TextAreaField
                label={t('requestBOQ.additionalRequirements')}
                name="additional_requirements"
                placeholder={t('requestBOQ.additionalRequirementsPlaceholder')}
                value={formData.additional_requirements}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>

          {/* ─── Turnstile + Submit ───────────────────────────────────────── */}
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
                loadingText={t('requestBOQ.submitting')}
                disabled={isSubmitDisabled}
                className="w-full sm:w-auto h-11 sm:h-12 px-7 sm:px-8 rounded-xl bg-primary hover:bg-primary-dark text-white font-headline font-bold uppercase tracking-wider text-xs sm:text-sm shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2.5 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{t('requestBOQ.submitButton')}</span>
                <Icon icon="arrow_forward" className="text-base transition-transform rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </SubmitButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
