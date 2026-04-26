import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import InputField from '../components/forms/InputField'

export default function Contact() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone_number: '', whatsapp_number: '', message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')

  const mapEmbedUrl = "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3423.468205562095!2d30.993738975549045!3d30.78494437456185!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMzDCsDQ3JzA1LjgiTiAzMMKwNTknNDYuOCJF!5e0!3m2!1sen!2seg!4v1715624000000!5m2!1sen!2seg"
  const directionsUrl = "https://www.google.com/maps/dir/?api=1&destination=30.784944,30.996333"

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
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
      })
      if (response.ok) {
        setSubmitMessage(t('contact.successMsg'))
        setFormData({ first_name: '', last_name: '', email: '', phone_number: '', whatsapp_number: '', message: '' })
      } else {
        setSubmitMessage(t('contact.failMsg'))
      }
    } catch (error) {
      setSubmitMessage(t('contact.errorMsg'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactInfo = {
    addresses: [
      { label: t('contact.officeAddress'), text: t('contact.officeAddressText'), icon: 'location_on' },
      { label: t('contact.factoryAddress'), text: t('contact.factoryAddressText'), icon: 'factory' },
      { label: t('contact.storeAddress'), text: t('contact.storeAddressText'), icon: 'store' },
    ],
    lines: [
      { label: t('contact.phoneLabel'), text: t('contact.phoneText'), icon: 'call' },
      { label: t('contact.whatsappLabel'), text: t('contact.whatsappText'), icon: 'chat' },
      { label: t('contact.emailLabel'), text: t('contact.emailText'), icon: 'mail' },
    ]
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="pt-32">
        {/* Hero Section */}
        <section className="px-4 sm:px-8 md:px-16 py-20 bg-[#f2f4f7]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
              <div>
                <span className="inline-block px-3 py-1 bg-primary text-white text-[10px] font-bold tracking-[0.2em] uppercase mb-6">
                  {t('contact.badge')}
                </span>
                <h1 className="text-5xl md:text-7xl font-headline font-black tracking-tighter leading-none text-primary uppercase">
                  {t('contact.heroTitle1')}<br />{t('contact.heroTitle2')}
                </h1>
              </div>
              <div className="pb-2">
                <p className="text-xl text-secondary max-w-md leading-relaxed">{t('contact.heroDesc')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Form and Info Section */}
        <section className="px-4 sm:px-8 md:px-16 py-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-t border-outline-variant/15">
              {/* Form Column */}
              <div className="lg:col-span-7 py-16 lg:pe-20 lg:border-e border-outline-variant/15">
                <h2 className="text-3xl font-headline font-bold uppercase tracking-tight mb-12 text-primary">{t('contact.formTitle')}</h2>
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <InputField label={t('contact.firstName')} name="first_name" placeholder="AHMED" value={formData.first_name} onChange={handleInputChange} required />
                    <InputField label={t('contact.lastName')} name="last_name" placeholder="KHALED" value={formData.last_name} onChange={handleInputChange} required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <InputField label={t('contact.workEmail')} name="email" type="email" placeholder="NAME@ENTERPRISE.COM" value={formData.email} onChange={handleInputChange} required />
                    <InputField label={t('contact.phoneNumber')} name="phone_number" type="tel" placeholder="+20 11..." value={formData.phone_number} onChange={handleInputChange} required />
                  </div>
                  {/* WhatsApp field — uses InputField with a custom green focus colour */}
                  <InputField
                    label={
                      <span className="flex items-center gap-1.5">
                        <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#25D366] shrink-0" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        {t('contact.whatsappNumber')}
                      </span>
                    }
                    name="whatsapp_number"
                    type="tel"
                    placeholder="+20 10..."
                    value={formData.whatsapp_number}
                    onChange={handleInputChange}
                    className="focus:border-[#25D366]"
                  />
                  <div className="space-y-2">
                    <label className="block text-[12px] font-bold tracking-widest text-outline uppercase">{t('contact.detailedBrief')}</label>
                    <textarea name="message" placeholder={t('contact.briefPlaceholder')} value={formData.message} onChange={handleInputChange} rows={4} className="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant focus:border-tertiary focus:ring-0 px-0 py-3 text-primary transition-colors font-body resize-none" required />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-12 py-5 font-headline font-bold uppercase text-sm tracking-widest hover:brightness-110 transition-all disabled:opacity-50">
                    {isSubmitting ? t('contact.transmitting') : t('contact.transmitInquiry')}
                  </button>
                  {submitMessage && (
                    <div className={`p-6 border-l-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
                      submitMessage.includes('✓') || submitMessage.includes('بنجاح') 
                        ? 'bg-green-50 border-green-500 text-green-800' 
                        : 'bg-red-50 border-red-500 text-red-800'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-xl">
                          {submitMessage.includes('✓') || submitMessage.includes('بنجاح') ? 'check_circle' : 'error'}
                        </span>
                        <p className="font-headline font-bold text-sm tracking-tight">{submitMessage}</p>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Info Column */}
              <div className="lg:col-span-5 py-16 lg:ps-20 flex flex-col space-y-12">
                <div className="space-y-8">
                  <h3 className="text-[11px] font-bold tracking-[0.3em] uppercase text-tertiary">{t('contact.locations')}</h3>
                  {contactInfo.addresses.map((item, idx) => (
                    <div key={idx} className="flex gap-5 group">
                      <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">{item.icon}</span>
                      <div>
                        <h4 className="text-[12px] font-bold uppercase tracking-wider text-outline mb-1">{item.label}</h4>
                        <p className="text-lg font-headline font-bold text-primary leading-tight">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-8 pt-8 border-t border-outline-variant/15">
                  <h3 className="text-[11px] font-bold tracking-[0.3em] uppercase text-tertiary">{t('contact.directLines')}</h3>
                  {contactInfo.lines.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-5 group">
                      <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">{item.icon}</span>
                      <div>
                         <h4 className="text-[12px] font-bold uppercase tracking-wider text-outline mb-0.5">{item.label}</h4>
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
              <h3 className="text-white font-headline font-black text-xl mb-2 uppercase">{t('contact.visitOffice')}</h3>
              <p className="text-white/70 text-[9px] font-label tracking-widest uppercase mb-6">{t('contact.coordinates')}</p>
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-white text-primary px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-tertiary-fixed transition-all">
                {t('contact.getDirections')}
                <span className="material-symbols-outlined text-sm">navigation</span>
              </a>
            </div>
          </div>
          <iframe title="Star Dewedar Location" src={mapEmbedUrl} width="100%" height="100%" style={{ border: 0, filter: 'grayscale(1) contrast(1.1) opacity(0.8)' }} className="hover:grayscale-0 transition-all duration-1000" allowFullScreen="" loading="lazy"></iframe>
        </section>
      </main>
      <Footer />
    </div>
  )
}