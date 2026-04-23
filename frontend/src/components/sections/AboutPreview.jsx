import { useTranslation } from 'react-i18next'

export default function AboutPreview() {
  const { t } = useTranslation()

  return (
    <section className="bg-surface py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">

          {/* Left */}
          <div className="md:col-span-7">
            <h2 className="font-headline text-4xl md:text-6xl font-black tracking-tighter text-primary mb-8">
              {t('aboutPreview.title1')}
              <br />{t('aboutPreview.title2')}
            </h2>

            <p className="text-secondary text-lg leading-relaxed mb-8">
              {t('aboutPreview.description')}
            </p>

            <div className="flex gap-12 border-t border-outline-variant/15 pt-8">
              <div>
                <div className="font-headline text-4xl font-black text-primary">10+</div>
                <div className="font-label uppercase text-sm tracking-widest text-outline">
                  {t('aboutPreview.yearsExp')}
                </div>
              </div>

              <div>
                <div className="font-headline text-4xl font-black text-primary">300+</div>
                <div className="font-label uppercase text-sm tracking-widest text-outline">
                  {t('aboutPreview.projectsCompleted')}
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="md:col-span-5 bg-surface-container-low p-8">
            <h3 className="font-headline text-xl font-bold uppercase mb-4 border-b border-tertiary-fixed pb-2 w-fit">
              {t('aboutPreview.ourApproach')}
            </h3>

            <p className="text-on-surface-variant mb-6">
              {t('aboutPreview.approachDesc')}
            </p>

            <img
              className="w-full h-64 object-cover grayscale"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPs8uRs-OqR42p1eSgGiJxY4aFOgaNDEVaqABG7wqErxz7gdhiQsnX1J_uipllraAST238yiEyuJ6g0-AXfunB0oS7b8X_FnuG_46m0I5KwiUnhGML5BLcwa2WJz__RatiTf5xQtT6zwG20RqHipS6Q6CKsVBL_YHOGT9hSW0IQpFlk07gDZFjp291B-m6bEujmHCIgg3drJTDCsJ5E48YlXxVip4_8qrA2azDUDwHwPGA7chR25JSkS6dQxgDZ2SKRcK4r7fCeud_"
              alt="Electrical equipment"
            />
          </div>
        </div>
      </div>
    </section>
  )
}