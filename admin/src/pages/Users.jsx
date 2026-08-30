// ─── Users.jsx ────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Badge } from '../components'
import { Pagination } from '../components/ui/Pagination'
import * as userService from '../services/userService'

export default function Users() {
  const { t } = useTranslation()
  const [users, setUsers] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    phone_number: '',
    whatsapp_number: '',
    company_name: '',
  })

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await userService.getAllUsers()
      setUsers(data || [])
    } catch (err) {
      setError(err.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const itemsPerPage = 8
  const totalPages = Math.ceil(users.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const displayedData = users.slice(startIdx, startIdx + itemsPerPage)

  const openAddModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'customer',
      phone_number: '',
      whatsapp_number: '',
      company_name: '',
    })
    setShowPassword(false)
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError(null)
    setIsSaving(true)
    try {
      // Build payload — only include optional fields if they have values
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      }
      if (formData.phone_number) payload.phone_number = formData.phone_number
      if (formData.whatsapp_number) payload.whatsapp_number = formData.whatsapp_number
      if (formData.company_name) payload.company_name = formData.company_name

      await userService.createUser(payload)
      setSuccess(t('users.create_success'))
      await fetchUsers()
      setIsModalOpen(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || t('common.error'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('users.delete_confirm'))) return
    setError(null)
    try {
      await userService.deleteUser(id)
      setSuccess(t('users.delete_success'))
      await fetchUsers()
      if (currentPage > totalPages - 1) setCurrentPage(Math.max(1, currentPage - 1))
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || t('common.error'))
    }
  }

  return (
    <div className="max-w-full relative">
      {error && <div className="mb-6 p-4 bg-error-container border border-error text-on-error-container rounded"><p className="text-sm font-medium">{error}</p></div>}
      {success && <div className="mb-6 p-4 bg-tertiary-fixed border border-tertiary text-on-tertiary-fixed rounded"><p className="text-sm font-medium">{success}</p></div>}

      <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between lg:mb-12">
        <div>
          <span className="text-tertiary font-bold tracking-widest text-xs uppercase mb-2 block">{t('users.subtitle')}</span>
          <h2 className="text-3xl font-black font-headline tracking-tighter text-primary leading-none sm:text-4xl lg:text-5xl">{t('users.title')}<span className="text-tertiary">.</span></h2>
        </div>
        <Button variant="tertiary" size="lg" icon="person_add" onClick={openAddModal} disabled={loading} className="w-full sm:w-auto">{t('users.add_button')}</Button>
      </div>

      {loading && !users.length ? (
        <div className="flex items-center justify-center py-20"><p className="text-secondary text-lg">{t('users.loading')}</p></div>
      ) : (
        <div className="bg-surface-container-lowest border border-surface-variant overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-surface-variant">
                  <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary">{t('users.table.id')}</th>
                  <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary">{t('users.table.name')}</th>
                  <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary">{t('users.table.email')}</th>
                  <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary">{t('users.table.role')}</th>
                  <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary">{t('users.table.company')}</th>
                  <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary">{t('users.table.created')}</th>
                  <th className="px-8 py-5 text-xs font-bold font-headline uppercase tracking-widest text-secondary text-right">{t('users.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {displayedData.length > 0 ? displayedData.map((user) => (
                  <tr key={user.id} className="group hover:bg-surface-container-low transition-colors">
                    <td className="px-8 py-6 text-xs font-mono text-slate-400">#{String(user.id).slice(0, 6).padStart(3, '0')}</td>
                    <td className="px-8 py-6">
                      <span className="block font-bold text-primary font-headline tracking-tight">{user.name}</span>
                      {user.phone_number && <span className="block text-xs text-secondary font-medium">{user.phone_number}</span>}
                    </td>
                    <td className="px-8 py-6 text-sm text-secondary font-medium">{user.email}</td>
                    <td className="px-8 py-6">
                      <Badge className={user.role === 'admin' ? 'bg-[#c62828] text-white font-black' : 'bg-[#e8eaf6] text-[#1a237e] font-bold'}>
                        {user.role === 'admin' ? t('users.role_admin') : t('users.role_customer')}
                      </Badge>
                    </td>
                    <td className="px-8 py-6 text-sm text-secondary font-medium">{user.company_name || '—'}</td>
                    <td className="px-8 py-6 text-sm text-secondary font-medium">
                      {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-4">
                        <button onClick={() => handleDelete(user.id)} className="text-error hover:opacity-70 transition-opacity flex items-center gap-1 text-xs font-bold font-headline uppercase tracking-widest">
                          <span className="material-symbols-outlined text-sm">delete</span>{t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="7" className="px-8 py-12 text-center text-secondary">{t('users.no_users')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {users.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalDisplayed={displayedData.length} totalItems={users.length} variant="table" />}
        </div>
      )}

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-surface-container-lowest border border-surface-variant w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <form onSubmit={handleSave}>
              <div className="flex items-center justify-between border-b border-surface-variant bg-surface-container-low px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
                <h3 className="text-xl font-black font-headline tracking-tighter text-primary uppercase sm:text-2xl">
                  {t('users.modal.title')}<span className="text-tertiary">.</span>
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-secondary hover:text-primary transition-colors"><span className="material-symbols-outlined">close</span></button>
              </div>
              <div className="space-y-5 p-4 sm:p-6 lg:p-8">
                {/* Name */}
                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">{t('users.modal.name_label')}</label>
                  <input
                    className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-bold focus:outline-none focus:border-tertiary"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('users.modal.name_placeholder')}
                    required
                    disabled={isSaving}
                    minLength={2}
                    maxLength={100}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">{t('users.modal.email_label')}</label>
                  <input
                    type="email"
                    className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-bold focus:outline-none focus:border-tertiary"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={t('users.modal.email_placeholder')}
                    required
                    disabled={isSaving}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">{t('users.modal.password_label')}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-bold focus:outline-none focus:border-tertiary pr-12"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={t('users.modal.password_placeholder')}
                      required
                      disabled={isSaving}
                      minLength={8}
                      maxLength={128}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  <p className="mt-1.5 text-[10px] text-slate-400 tracking-wide">{t('users.modal.password_hint')}</p>
                </div>

                {/* Role */}
                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">{t('users.modal.role_label')}</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-bold focus:outline-none focus:border-tertiary uppercase"
                    disabled={isSaving}
                  >
                    <option value="customer">{t('users.role_customer')}</option>
                    <option value="admin">{t('users.role_admin')}</option>
                  </select>
                </div>

                {/* Phone & WhatsApp */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">{t('users.modal.phone_label')}</label>
                    <input
                      className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-bold focus:outline-none focus:border-tertiary"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      placeholder={t('users.modal.phone_placeholder')}
                      disabled={isSaving}
                      maxLength={30}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">{t('users.modal.whatsapp_label')}</label>
                    <input
                      className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-bold focus:outline-none focus:border-tertiary"
                      value={formData.whatsapp_number}
                      onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                      placeholder={t('users.modal.whatsapp_placeholder')}
                      disabled={isSaving}
                      maxLength={30}
                    />
                  </div>
                </div>

                {/* Company Name */}
                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-2">{t('users.modal.company_label')}</label>
                  <input
                    className="w-full bg-surface-container-low border border-surface-variant px-4 py-3 text-primary font-bold focus:outline-none focus:border-tertiary"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder={t('users.modal.company_placeholder')}
                    disabled={isSaving}
                    maxLength={150}
                  />
                </div>
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-surface-variant bg-surface-container-low px-4 py-4 sm:flex-row sm:justify-end sm:gap-4 sm:px-6 lg:px-8 lg:py-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-xs font-bold uppercase tracking-widest text-secondary px-6 hover:text-primary disabled:opacity-50" disabled={isSaving}>{t('common.cancel')}</button>
                <Button type="submit" variant="tertiary" disabled={isSaving} className="w-full sm:w-auto">
                  {isSaving ? t('common.saving') : t('users.modal.submit')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
