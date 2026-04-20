import { useState } from 'react'
import Icon from '../shared/Icon'
import InputField from '../forms/InputField'
import TextAreaField from '../forms/TextAreaField'
import FileUploadField from '../forms/FileUploadField'
import SelectField from '../forms/SelectField'

export default function QuoteForm({ productId = null }) {
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')

  // Dummy product options - replace with actual API call
  const productOptions = [
    { value: 'electrical-panels', label: 'Electrical Panels' },
    { value: 'industrial-lighting', label: 'Industrial Lighting' },
    { value: 'sub-components', label: 'Sub-Components' },
    { value: 'custom', label: 'Custom Product' },
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      setFormData((prev) => ({
        ...prev,
        file_url: file,
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage('')

    try {
      // Prepare FormData for multipart upload
      const submitData = new FormData()
      submitData.append('first_name', formData.first_name)
      submitData.append('last_name', formData.last_name)
      submitData.append('phone', formData.phone)
      submitData.append('email', formData.email)
      submitData.append('product_id', formData.product_id)
      submitData.append('custom_product_name', formData.custom_product_name)
      submitData.append('details', formData.details)
      if (formData.file_url) {
        submitData.append('file_url', formData.file_url)
      }

      // Replace with your actual API endpoint
      const response = await fetch('/api/quote-requests', {
        method: 'POST',
        body: submitData,
      })

      if (response.ok) {
        setSubmitMessage('✓ Quote request submitted successfully! We will contact you soon.')
        setFormData({
          first_name: '',
          last_name: '',
          phone: '',
          email: '',
          product_id: productId || '',
          custom_product_name: '',
          details: '',
          file_url: null,
        })
        setFileName('')
      } else {
        setSubmitMessage('✗ Failed to submit quote request. Please try again.')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitMessage('✗ An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="lg:col-span-8 bg-surface-container-lowest p-6 sm:p-10 md:p-12 lg:p-16">
      <div className="max-w-2xl">
        <header className="mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl font-headline font-bold tracking-tight text-primary">
            Project Specification Form
          </h2>
          <div className="h-1 w-20 bg-tertiary-fixed mt-3 sm:mt-4"></div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <InputField
              label="First Name"
              name="first_name"
              placeholder="AHMED"
              value={formData.first_name}
              onChange={handleInputChange}
              required
            />
            <InputField
              label="Last Name"
              name="last_name"
              placeholder="KHALED"
              value={formData.last_name}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <InputField
              label="Phone"
              name="phone"
              type="tel"
              placeholder="(+20) 01234567890"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
            <InputField
              label="Work Email Address"
              name="email"
              type="email"
              placeholder="A.KHALED@GMAIL.COM"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Product Selection */}
          <SelectField
            label="Select Product"
            name="product_id"
            value={formData.product_id}
            onChange={handleInputChange}
            options={productOptions}
            placeholder="Choose a product or custom"
          />

          {/* Custom Product Name (if applicable) */}
          {formData.product_id === 'custom' && (
            <InputField
              label="Custom Product Name"
              name="custom_product_name"
              placeholder="Describe your custom product..."
              value={formData.custom_product_name}
              onChange={handleInputChange}
            />
          )}

          {/* Project Details */}
          <TextAreaField
            label="Project Scope & Details"
            name="details"
            placeholder="Describe the load requirements, site conditions, and voltage specifications..."
            value={formData.details}
            onChange={handleInputChange}
            rows={5}
            required
          />

          {/* File Upload */}
          <FileUploadField
            label="Technical Blueprints (PDF/DWG)"
            name="file_url"
            onChange={handleFileChange}
          />
          {fileName && (
            <p className="text-xs text-tertiary-fixed font-semibold">
              ✓ File selected: {fileName}
            </p>
          )}

          {/* Submit Messages */}
          {submitMessage && (
            <div
              className={`p-4 text-sm font-semibold ${
                submitMessage.includes('✓')
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {submitMessage}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4 sm:pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-tertiary-fixed text-on-tertiary-fixed font-headline font-bold uppercase tracking-[0.15em] text-xs sm:text-sm px-8 sm:px-12 py-4 sm:py-5 flex items-center justify-center gap-3 hover:bg-tertiary transition-all hover:text-white group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
              <Icon icon="arrow_forward" className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
