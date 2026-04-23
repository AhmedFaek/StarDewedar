import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../shared/Icon'
import InputField from '../forms/InputField'
import TextAreaField from '../forms/TextAreaField'
import FileUploadField from '../forms/FileUploadField'
import SelectField from '../forms/SelectField'
import { api } from '../../utils/api'

export default function QuoteForm({ productId = null }) {
  const { t, i18n } = useTranslation()
  const [products, setProducts] = useState([])
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', phone: '', email: '',
    product_id: productId || '',
    custom_product_name: '', details: '', file_url: null,
  })

  const [fileName, setFileName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')

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
    if (productId) setFormData((prev) => ({ ...prev, product_id: productId }))
  }, [productId])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      setFormData((prev) => ({ ...prev, file_url: file }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage('')
    try {
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

      await api.sendQuoteRequest(formDataToSend)
      
      setSubmitMessage(t('requestQuote.successMsg'))
      setFormData({ first_name: '', last_name: '', phone: '', email: '', product_id: productId || '', custom_product_name: '', details: '', file_url: null })
      setFileName('')
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitMessage(t('requestQuote.errorMsg'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const productOptions = [
    ...products.map(p => ({
      value: p.id,
      label: i18n.language === 'ar' ? p.name_ar : p.name_en
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
          <div className="h-1 w-20 bg-tertiary-fixed mt-3 sm:mt-4"></div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <InputField label={t('requestQuote.firstName')} name="first_name" placeholder="AHMED" value={formData.first_name} onChange={handleInputChange} required />
            <InputField label={t('requestQuote.lastName')} name="last_name" placeholder="KHALED" value={formData.last_name} onChange={handleInputChange} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <InputField label={t('requestQuote.phone')} name="phone" type="tel" placeholder="(+20) 01234567890" value={formData.phone} onChange={handleInputChange} required />
            <InputField label={t('requestQuote.workEmail')} name="email" type="email" placeholder="A.KHALED@GMAIL.COM" value={formData.email} onChange={handleInputChange} required />
          </div>
          <SelectField label={t('requestQuote.selectProduct')} name="product_id" value={formData.product_id} onChange={handleInputChange} options={productOptions} placeholder={t('requestQuote.selectPlaceholder')} />
          {formData.product_id === 'custom' && (
            <InputField label={t('requestQuote.customProductName')} name="custom_product_name" placeholder={t('requestQuote.customProductPlaceholder')} value={formData.custom_product_name} onChange={handleInputChange} />
          )}
          <TextAreaField label={t('requestQuote.projectScope')} name="details" placeholder={t('requestQuote.projectScopePlaceholder')} value={formData.details} onChange={handleInputChange} rows={5} required />
          <FileUploadField label={t('requestQuote.fileUpload')} name="file_url" onChange={handleFileChange} />
          {fileName && <p className="text-xs text-tertiary-fixed font-semibold">{t('requestQuote.fileSelected')} {fileName}</p>}
          {submitMessage && (
            <div className={`p-6 border-l-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
              submitMessage.includes('✓') || submitMessage.includes('نجاح') 
                ? 'bg-green-50 border-green-500 text-green-800' 
                : 'bg-red-50 border-red-500 text-red-800'
            }`}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-xl">
                  {submitMessage.includes('✓') || submitMessage.includes('نجاح') ? 'check_circle' : 'error'}
                </span>
                <p className="font-headline font-bold text-sm tracking-tight">{submitMessage}</p>
              </div>
            </div>
          )}
          <div className="pt-4 sm:pt-6">
            <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-tertiary-fixed text-on-tertiary-fixed font-headline font-bold uppercase tracking-[0.15em] text-xs sm:text-sm px-8 sm:px-12 py-4 sm:py-5 flex items-center justify-center gap-3 hover:bg-tertiary transition-all hover:text-white group disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? t('requestQuote.submitting') : t('requestQuote.submitRequest')}
              <Icon icon="arrow_forward" className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
