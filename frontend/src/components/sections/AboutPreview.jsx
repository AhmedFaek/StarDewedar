export default function AboutPreview() {
  return (
    <section className="bg-surface py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center">
          {/* Left Content */}
          <div className="md:col-span-7">
            <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-primary mb-6 md:mb-8">
              Architecting the Backbone of Modern Industry.
            </h2>

            <p className="text-secondary text-base sm:text-lg leading-relaxed mb-6 md:mb-8">
              Since our inception, Star Dewedar has focused on the intersection of heavy
              industrial demands and meticulous manufacturing standards. We don't just supply
              equipment; we engineer the essential systems that power global infrastructure.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-8 sm:gap-12 border-t border-outline-variant/15 pt-6 md:pt-8">
              <div>
                <div className="font-headline text-3xl sm:text-4xl font-bold text-primary">25+</div>
                <div className="font-label uppercase text-xs tracking-widest text-outline">
                  Years Expertise
                </div>
              </div>
              <div>
                <div className="font-headline text-3xl sm:text-4xl font-bold text-primary">500+</div>
                <div className="font-label uppercase text-xs tracking-widest text-outline">
                  Global Projects
                </div>
              </div>
            </div>
          </div>

          {/* Right Card with Image */}
          <div className="md:col-span-5 bg-surface-container-low p-6 sm:p-8 md:p-12">
            <h3 className="font-headline text-lg sm:text-xl font-bold uppercase tracking-tight mb-3 sm:mb-4 border-b border-tertiary-fixed pb-2 w-fit">
              Manufacturing Excellence
            </h3>

            <p className="text-on-surface-variant font-body text-sm sm:text-base mb-4 sm:mb-6">
              Every component passing through our facility undergoes rigorous load-testing and
              environmental stress simulations to guarantee zero-fail performance in the field.
            </p>

            <img
              className="w-full h-48 sm:h-56 md:h-64 object-cover grayscale"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPs8uRs-OqR42p1eSgGiJxY4aFOgaNDEVaqABG7wqErxz7gdhiQsnX1J_uipllraAST238yiEyuJ6g0-AXfunB0oS7b8X_FnuG_46m0I5KwiUnhGML5BLcwa2WJz__RatiTf5xQtT6zwG20RqHipS6Q6CKsVBL_YHOGT9hSW0IQpFlk07gDZFjp291B-m6bEujmHCIgg3drJTDCsJ5E48YlXxVip4_8qrA2azDUDwHwPGA7chR25JSkS6dQxgDZ2SKRcK4r7fCeud_"
              alt="Precision electrical components"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
