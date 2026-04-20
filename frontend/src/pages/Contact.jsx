import { useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Icon from '../components/shared/Icon'

export default function Contact() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    whatsapp_number: '',
    message: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitMessage('✓ Message sent successfully! We will contact you soon.')
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone_number: '',
          whatsapp_number: '',
          message: '',
        })
      } else {
        setSubmitMessage('✗ Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitMessage('✗ An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />

      <main className="pt-24">
        {/* Hero Section */}
        <section className="px-4 sm:px-8 md:px-16 py-20 bg-[#f2f4f7]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
              <div>
                <span className="inline-block px-3 py-1 bg-primary text-white text-[10px] font-bold tracking-[0.2em] uppercase mb-6">
                  Establish Connection
                </span>
                <h1 className="text-6xl md:text-8xl font-headline font-black tracking-tighter leading-none text-primary uppercase">
                  Contact<br />Engineering
                </h1>
              </div>
              <div className="pb-2">
                <p className="text-xl text-secondary max-w-md leading-relaxed">
                  Meticulous precision meets global distribution. Reach out to our technical team for architectural consultations and high-voltage industrial specifications.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <section className="px-4 sm:px-8 md:px-16 py-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-t border-outline-variant/15">
              
              {/* Contact Form: 7 Cols */}
              <div className="lg:col-span-7 py-16 lg:pr-20 border-r border-outline-variant/15">
                <h2 className="text-3xl font-headline font-bold uppercase tracking-tight mb-12 text-primary">
                  Technical Inquiry
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold tracking-widest uppercase text-outline">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        placeholder="AHMED"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant focus:border-tertiary focus:ring-0 px-0 py-3 text-primary transition-colors font-body"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold tracking-widest uppercase text-outline">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        placeholder="KHALED"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant focus:border-tertiary focus:ring-0 px-0 py-3 text-primary transition-colors font-body"
                        required
                      />
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold tracking-widest uppercase text-outline">
                        Work Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        placeholder="NAME@ENTERPRISE.COM"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant focus:border-tertiary focus:ring-0 px-0 py-3 text-primary transition-colors font-body"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold tracking-widest uppercase text-outline">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone_number"
                        placeholder="(+20) 01234567890"
                        value={formData.phone_number}
                        onChange={handleInputChange}
                        className="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant focus:border-tertiary focus:ring-0 px-0 py-3 text-primary transition-colors font-body"
                        required
                      />
                    </div>
                  </div>

                  {/* WhatsApp Number */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-outline">
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      name="whatsapp_number"
                      placeholder="(+20) 01234567890"
                      value={formData.whatsapp_number}
                      onChange={handleInputChange}
                      className="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant focus:border-tertiary focus:ring-0 px-0 py-3 text-primary transition-colors font-body"
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-outline">
                      Detailed Brief
                    </label>
                    <textarea
                      name="message"
                      placeholder="DESCRIBE YOUR INQUIRY IN DETAIL..."
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant focus:border-tertiary focus:ring-0 px-0 py-3 text-primary transition-colors font-body resize-none"
                      required
                    />
                  </div>

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
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="voltage-gradient text-white w-full md:w-auto px-12 py-5 font-headline font-bold uppercase text-sm tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Transmitting...' : 'Transmit Inquiry'}
                  </button>
                </form>
              </div>

              {/* Company Info: 5 Cols */}
              <div className="lg:col-span-5 py-16 lg:pl-20 flex flex-col justify-between space-y-16">
                <div className="space-y-12">
                  
                  {/* Headquarters */}
                  <div>
                    <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase text-tertiary mb-4">
                      Headquarters
                    </h3>
                    <p className="text-2xl font-headline font-bold text-primary leading-tight">
                      Star Dewedar<br />
                      Zurich, CH
                    </p>
                  </div>

                  {/* Direct Lines */}
                  <div>
                    <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase text-tertiary mb-4">
                      Direct Lines
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-outline text-xl">
                          call
                        </span>
                        <span className="text-lg font-body font-medium text-primary tracking-tight">
                          +20 (1) 000-000-000
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-outline text-xl">
                          mail
                        </span>
                        <span className="text-lg font-body font-medium text-primary tracking-tight">
                          sales@stardewedar.com
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Image Anchor */}
                <div className="relative w-full aspect-video overflow-hidden">
                  <img
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                    alt="Industrial electrical equipment and high-precision components"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUXL_VtCwqN-8kADU0N7-D8WTM0S3lHvmPuCeIP6EiDiMQkkPfpbjCXVPi0PFLoQyJNZr2mQHBsPQfIYJYkxCosaMyK_mCTYgZ0BkffVYTYxIKqSB_UWPn33PnE8UAgPXwQpYoJB1WszVFW443Nb00VX4H6yJ6NkXrVhfiRDWBS-PfqPNfU-IlNfOdSccBYZ_g4U3RJa-hlF17EjIvV4xbhToSG2Jb_mrt84tiA2S0n0SlGyOAe2Iu9i0L150AQWi1O6l2hFSfGstz"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
