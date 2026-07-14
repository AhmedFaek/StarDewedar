import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../shared/Icon'
import InputField from '../forms/InputField'
import TextAreaField from '../forms/TextAreaField'
import FileUploadField from '../forms/FileUploadField'
import SelectField from '../forms/SelectField'
import SubmitButton from '../forms/SubmitButton'
import { api } from '../../utils/api'
import { isLoggedIn } from '../../utils/auth'
import { validateUploadFile } from '../../utils/fileValidation'
import { useFormSubmit } from '../../hooks/useFormSubmit.js'

export default function QuoteForm({ productId = null }) {
  const { t, i18n } = useTranslation()
  const [products, setProducts] = useState([])
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    product_id: productId || '',
    custom_product_name: '',
    details: '',
    file_url: null,
  })

  const [fileName, setFileName] = useState('')
  const [errors, setErrors] = useState({})
  const [fileUploadKey, setFileUploadKey] = useState(0)

  const validate = () => {
    const e = {}
    if (!formData.first_name.trim() || formData.first_name.trim().length < 2)
      e.first_name = t('contact.validation.minChars', { n: 2 })
    if (!formData.last_name.trim() || formData.last_name.trim().length < 2)
      e.last_name = t('contact.validation.minChars', { n: 2 })
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      e.email = t('contact.validation.invalidEmail')
    if (!formData.phone.trim() || formData.phone.trim().length < 10)
      e.phone = t('contact.validation.required')
    if (!formData.details.trim() || formData.details.trim().length < 5)
      e.details = t('requestQuote.validation.detailsMin', { n: 5 })
    return e
  }

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.getProducts()
        setProducts(data)
      } catch (error) {
        console.error('Error fetching products:', error)
      }
    }
    fetchProducts()
  }, [])

  useEffect(() => {
    if (!isLoggedIn()) return
    api.getMe()
      .then((user) => {
        const parts = (user.name || '').split(' ')
        setFormData((prev) => ({
          ...prev,
          first_name: parts[0] || prev.first_name,
          last_name: parts[1] || prev.last_name,
          email: user.email || prev.email,
          phone: user.phone_number || prev.phone,
        }))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (productId) {
      setFormData((prev) => ({ ...prev, product_id: productId }))
    }
  }, [productId])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // FileUploadField already validates, but double-check here
      const { valid } = validateUploadFile(file, t)
      if (!valid) {
        setFileName('')
        setFormData((prev) => ({ ...prev, file_url: null }))
        return
      }
      setFileName(file.name)
      setFormData((prev) => ({ ...prev, file_url: file }))
    } else {
      setFileName('')
      setFormData((prev) => ({ ...prev, file_url: null }))
    }
  }

  const { isSubmitting, handleSubmit: submitForm } = useFormSubmit({
    onSubmit: () => {
      const formDataToSend = new FormData()
      formDataToSend.append('first_name', formData.first_name)
      formDataToSend.append('last_name', formData.last_name)
      formDataToSend.append('phone', formData.phone)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('details', formData.details)

      if (formData.product_id && formData.product_id !== 'custom') {
        formDataToSend.append('product_id', formData.product_id)
      } else {
        formDataToSend.append('custom_product_name', formData.custom_product_name || 'Custom Product Request')
      }

      if (formData.file_url instanceof File) {
        formDataToSend.append('file', formData.file_url)
      }

      return api.sendQuoteRequest(formDataToSend)
    },
    successMessage: t('notifications.quoteSuccess'),
    onSuccess: () => {
      setFormData((prev) => ({
        ...prev,
        product_id: productId || '',
        custom_product_name: '',
        details: '',
        file_url: null,
      }))
      setFileName('')
      setFileUploadKey((prev) => prev + 1)
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

  const productOptions = [
    ...products.map((p) => ({
      value: p.id,
      label: i18n.language === 'ar' ? p.name_ar : p.name_en,
    })),
    { value: 'custom', label: t('requestQuote.customProduct') },
  ]

  return (
    <section className="lg:col-span-8 bg-surface-container-lowest p-6 sm:p-10 md:p-12 lg:p-16">
      <div className="max-w-2xl">
        <header className="mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl font-headline font-bold tracking-tight text-primary">
            {t('requestQuote.formTitle')}
          </h2>
          <div className="h-1 w-20 bg-tertiary-fixed mt-3 sm:mt-4" />
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <InputField label={t('requestQuote.firstName')} name="first_name" placeholder="AHMED" value={formData.first_name} onChange={handleInputChange} required error={errors.first_name} />
            <InputField label={t('requestQuote.lastName')} name="last_name" placeholder="KHALED" value={formData.last_name} onChange={handleInputChange} required error={errors.last_name} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <InputField label={t('requestQuote.phone')} name="phone" type="tel" placeholder="(+20) 01234567890" value={formData.phone} onChange={handleInputChange} required error={errors.phone} />
            <InputField label={t('requestQuote.workEmail')} name="email" type="email" placeholder="A.KHALED@GMAIL.COM" value={formData.email} onChange={handleInputChange} required error={errors.email} />
          </div>
          <SelectField label={t('requestQuote.selectProduct')} name="product_id" value={formData.product_id} onChange={handleInputChange} options={productOptions} placeholder={t('requestQuote.selectPlaceholder')} />
          {formData.product_id === 'custom' && (
            <InputField label={t('requestQuote.customProductName')} name="custom_product_name" placeholder={t('requestQuote.customProductPlaceholder')} value={formData.custom_product_name} onChange={handleInputChange} error={errors.custom_product_name} />
          )}
          <TextAreaField label={t('requestQuote.projectScope')} name="details" placeholder={t('requestQuote.projectScopePlaceholder')} value={formData.details} onChange={handleInputChange} rows={5} required error={errors.details} />
          <FileUploadField key={fileUploadKey} label={t('requestQuote.fileUpload')} name="file_url" onChange={handleFileChange} />
          <div className="pt-4 sm:pt-6">
            <SubmitButton
              loading={isSubmitting}
              loadingText={t('requestQuote.submitting')}
              className="w-full sm:w-auto bg-tertiary-fixed text-on-tertiary-fixed font-headline font-bold uppercase tracking-[0.15em] text-xs sm:text-sm px-8 sm:px-12 py-4 sm:py-5 flex items-center justify-center gap-3 hover:bg-tertiary transition-all hover:text-white group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('requestQuote.submitRequest')}
              <Icon icon="arrow_forward" className="transition-transform group-hover:translate-x-1" />
            </SubmitButton>
          </div>
        </form>
      </div>
    </section>
  )
}
