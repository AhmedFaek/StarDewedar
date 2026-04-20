import { useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

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

  // Map and Direction Links
  const mapEmbedUrl = "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3423.468205562095!2d30.993738975549045!3d30.78494437456185!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMzDCsDQ3JzA1LjgiTiAzMMKwNTknNDYuOCJF!5e0!3m2!1sen!2seg!4v1715624000000!5m2!1sen!2seg";
  const directionsUrl = "https://www.google.com/maps/dir/?api=1&destination=30.784944,30.996333";

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitMessage('✓ Message transmitted successfully.')
        setFormData({ first_name: '', last_name: '', email: '', phone_number: '', whatsapp_number: '', message: '' })
      } else {
        setSubmitMessage('✗ Transmission failed. Please try again.')
      }
    } catch (error) {
      setSubmitMessage('✗ Error occurred during transmission.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactInfo = {
    addresses: [
      { label: 'Office Address', text: 'Fayrouz Tower, Othman mohamed st, off Modoreya st, Tanta', icon: 'location_on' },
      { label: 'Factory Address', text: 'Wadi El-Natron, Industrial zone (3)', icon: 'factory' },
      { label: 'Store Address', text: 'El madares st, off el nahas st, Tanta', icon: 'store' },
    ],
    lines: [
      { label: 'Phone Number', text: '+20 11 11777478', icon: 'call' },
      { label: 'Whatsapp Number', text: '+20 1000108529', icon: 'chat' },
      { label: 'Email Address', text: 'info@stardewedar.com', icon: 'mail' },
    ]
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
                  Connect with Star Dewedar’s technical department for industrial supply or high-voltage engineering consultations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Form and Info Section */}
        <section className="px-4 sm:px-8 md:px-16 py-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-t border-outline-variant/15">
              
              {/* Form Column */}
              <div className="lg:col-span-7 py-16 lg:pr-20 lg:border-r border-outline-variant/15">
                <h2 className="text-3xl font-headline font-bold uppercase tracking-tight mb-12 text-primary">Technical Inquiry</h2>
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold tracking-widest text-outline uppercase">First Name</label>
                      <input type="text" name="first_name" placeholder="AHMED" value={formData.first_name} onChange={handleInputChange} className="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant focus:border-tertiary focus:ring-0 px-0 py-3 text-primary transition-colors font-body" required />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold tracking-widest text-outline uppercase">Last Name</label>
                      <input type="text" name="last_name" placeholder="KHALED" value={formData.last_name} onChange={handleInputChange} className="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant focus:border-tertiary focus:ring-0 px-0 py-3 text-primary transition-colors font-body" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold tracking-widest text-outline uppercase">Work Email</label>
                      <input type="email" name="email" placeholder="NAME@ENTERPRISE.COM" value={formData.email} onChange={handleInputChange} className="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant focus:border-tertiary focus:ring-0 px-0 py-3 text-primary transition-colors font-body" required />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold tracking-widest text-outline uppercase">Phone Number</label>
                      <input type="tel" name="phone_number" placeholder="+20 11..." value={formData.phone_number} onChange={handleInputChange} className="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant focus:border-tertiary focus:ring-0 px-0 py-3 text-primary transition-colors font-body" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold tracking-widest text-outline uppercase">Detailed Brief</label>
                    <textarea name="message" placeholder="DESCRIBE YOUR INQUIRY..." value={formData.message} onChange={handleInputChange} rows={4} className="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant focus:border-tertiary focus:ring-0 px-0 py-3 text-primary transition-colors font-body resize-none" required />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-12 py-5 font-headline font-bold uppercase text-sm tracking-widest hover:brightness-110 transition-all disabled:opacity-50">
                    {isSubmitting ? 'Transmitting...' : 'Transmit Inquiry'}
                  </button>
                  {submitMessage && <p className="mt-4 font-bold text-sm text-primary uppercase tracking-widest">{submitMessage}</p>}
                </form>
              </div>

              {/* Info Column */}
              <div className="lg:col-span-5 py-16 lg:pl-20 flex flex-col space-y-12">
                <div className="space-y-8">
                  <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase text-tertiary">Locations</h3>
                  {contactInfo.addresses.map((item, idx) => (
                    <div key={idx} className="flex gap-5 group">
                      <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">{item.icon}</span>
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-outline mb-1">{item.label}</h4>
                        <p className="text-lg font-headline font-bold text-primary leading-tight">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-8 pt-8 border-t border-outline-variant/15">
                  <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase text-tertiary">Direct Lines</h3>
                  {contactInfo.lines.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-5 group">
                      <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">{item.icon}</span>
                      <div>
                         <h4 className="text-[11px] font-bold uppercase tracking-wider text-outline mb-0.5">{item.label}</h4>
                         <p className="text-xl font-body font-semibold text-primary">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Google Maps Section */}
        <section className="relative w-full h-[500px] bg-surface-container-high border-t border-outline-variant/15 overflow-hidden">
          <div className="absolute top-8 left-4 sm:left-8 md:left-16 z-10">
            <div className="bg-primary/95 backdrop-blur-md p-6 shadow-2xl border border-white/10 max-w-sm">
              <h3 className="text-white font-headline font-black text-xl mb-2 uppercase">Visit Our Office</h3>
              <p className="text-white/70 text-[9px] font-label tracking-widest uppercase mb-6">Coordinates: 30°47'05.8"N 30°59'46.8"E</p>
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-white text-primary px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-tertiary-fixed transition-all">
                Get Directions
                <span className="material-symbols-outlined text-sm">navigation</span>
              </a>
            </div>
          </div>
          <iframe
            title="Star Dewedar Location"
            src={mapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0, filter: 'grayscale(1) contrast(1.1) opacity(0.8)' }}
            className="hover:grayscale-0 transition-all duration-1000"
            allowFullScreen=""
            loading="lazy"
          ></iframe>
        </section>
      </main>

      <Footer />
    </div>
  )
}