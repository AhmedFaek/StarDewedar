import { useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import InputField from '../components/forms/InputField'
import TextAreaField from '../components/forms/TextAreaField'

export default function RequestVisit() {
  const [formData, setFormData] = useState({
    factoryName: '',
    factoryActivity: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    whatsappNumber: '',
    email: '',
    physicalAddress: '',
    technicalDetails: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    // TODO: Add backend API call here
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />

      <main className="flex-grow pt-24 pb-20">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 mb-16">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-end">
            <div>
              <h1 className="font-headline font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tighter text-primary leading-[0.9] mb-6 sm:mb-8">
                PRECISION <br className="hidden sm:block" />
                ON-SITE <br className="hidden sm:block" />
                ASSESSMENT
              </h1>
              <div className="h-1 w-20 sm:w-32 bg-tertiary-fixed mb-6 sm:mb-8"></div>
            </div>
            <div className="pb-2 sm:pb-4">
              <p className="text-secondary text-base sm:text-lg lg:text-xl leading-relaxed max-w-lg">
                Our senior engineers provide comprehensive on-site technical evaluations for complex power systems and lighting infrastructures. We identify critical inefficiencies and engineer scalable solutions designed for the heavy industrial sector.
              </p>
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="bg-surface-container-low grid md:grid-cols-12 gap-0 overflow-hidden rounded-lg">
            {/* Image Side */}
            <div className="md:col-span-4 relative h-48 md:h-full min-h-[400px]">
              <img
                alt="Industrial Infrastructure"
                className="absolute inset-0 w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXZISKS79x-rJ4alZw-7c4maLXMGQAatrDHFwCvhqQaCz1XZl8dwrIywaSEJymATGxM2aGR4CVRQ_q7aAFMxgmu6Z-JCp9soJ2u_FOPUpiITSquZVxgIRaVuXwJ7mZN-o_z_UHShQ7agdzCiwoPxHrThbec7E_xuF7sH0JT-uMh5bAXu_635PhOAdR5fFk_z476CLmEZg1BWa9jSM2-jCPqyS4V7cMrPgefJoqqmHR3Ml14dO6yj1ltRWO0NzoozAKs2YpfGo90B81"
              />
              <div className="absolute inset-0 bg-primary/40"></div>
              <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-8">
                <div className="font-headline text-tertiary-fixed text-3xl sm:text-4xl font-black">
                  VOLTAGE PRO
                </div>
                <div className="font-label text-white uppercase tracking-widest text-[10px] sm:text-xs mt-2">
                  Certified Engineering Division
                </div>
              </div>
            </div>

            {/* Form Side */}
            <div className="md:col-span-8 p-6 sm:p-8 md:p-12 lg:p-16 bg-white">
              <form onSubmit={handleSubmit} className="space-y-10 sm:space-y-12">
                {/* Section 1: Facility Information */}
                <div>
                  <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <span className="bg-primary text-white font-headline px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold">
                      01
                    </span>
                    <h2 className="font-label text-[9px] sm:text-xs font-bold uppercase tracking-[0.2em] text-primary">
                      Facility Information
                    </h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
                    <InputField
                      label="Factory Name"
                      placeholder="E.G. NORTHERN STEEL WORKS"
                      name="factoryName"
                      value={formData.factoryName}
                      onChange={handleChange}
                    />
                    <InputField
                      label="Factory Activity"
                      placeholder="E.G. HEAVY MANUFACTURING"
                      name="factoryActivity"
                      value={formData.factoryActivity}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Section 2: Primary Contact */}
                <div>
                  <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <span className="bg-primary text-white font-headline px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold">
                      02
                    </span>
                    <h2 className="font-label text-[9px] sm:text-xs font-bold uppercase tracking-[0.2em] text-primary">
                      Primary Contact
                    </h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
                    <InputField
                      label="First Name"
                      placeholder=""
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                    <InputField
                      label="Last Name"
                      placeholder=""
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                    <InputField
                      label="Phone Number"
                      type="tel"
                      placeholder=""
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                    />
                    <InputField
                      label="WhatsApp Number"
                      type="tel"
                      placeholder=""
                      name="whatsappNumber"
                      value={formData.whatsappNumber}
                      onChange={handleChange}
                    />
                    <div className="md:col-span-2">
                      <InputField
                        label="Email Address"
                        type="email"
                        placeholder=""
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Visit Logistics */}
                <div>
                  <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <span className="bg-primary text-white font-headline px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold">
                      03
                    </span>
                    <h2 className="font-label text-[9px] sm:text-xs font-bold uppercase tracking-[0.2em] text-primary">
                      Visit Logistics
                    </h2>
                  </div>
                  <div className="space-y-6 sm:space-y-8">
                    <InputField
                      label="Physical Address"
                      placeholder=""
                      name="physicalAddress"
                      value={formData.physicalAddress}
                      onChange={handleChange}
                    />
                    <TextAreaField
                      label="Technical Details & Purpose"
                      placeholder="DESCRIBE SPECIFIC TECHNICAL ISSUES OR PROJECT SCOPE..."
                      name="technicalDetails"
                      value={formData.technicalDetails}
                      onChange={handleChange}
                      rows={4}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6 sm:pt-8">
                  <button
                    type="submit"
                    className="w-full py-4 sm:py-6 bg-gradient-to-r from-primary to-primary-container text-white font-headline font-black text-lg sm:text-xl tracking-tighter transition-transform active:scale-[0.98] hover:shadow-lg flex justify-between items-center px-6 sm:px-8 group"
                  >
                    <span>SCHEDULE ENGINEER VISIT</span>
                    <span className="material-symbols-outlined text-xl sm:text-2xl group-hover:translate-x-2 transition-transform">
                      arrow_forward
                    </span>
                  </button>
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
