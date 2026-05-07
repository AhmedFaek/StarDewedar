import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../utils/api.js'

/**
 * AuthModal — slide-in modal with Login / Register tabs.
 *
 * Props:
 *   isOpen        {boolean}   — controls visibility
 *   onClose       {function}  — called when user closes modal
 *   onAuthSuccess {function}  — called with the user object after successful auth
 *   defaultTab    {'login'|'register'} — which tab to start on
 */
export default function AuthModal({ isOpen, onClose, onAuthSuccess, defaultTab = 'login' }) {
  const { t } = useTranslation()
  const [tab, setTab] = useState(defaultTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const overlayRef = useRef(null)

  // Sync defaultTab when modal opens
  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab)
      setError('')
    }
  }, [isOpen, defaultTab])

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Escape key closes modal
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  // ── Login ────────────────────────────────────────────────────────────────

  const [loginData, setLoginData] = useState({ email: '', password: '' })

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.login(loginData.email, loginData.password)
      onAuthSuccess(res.user)
      onClose()
    } catch (err) {
      setError(err?.message || t('auth.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  // ── Register ─────────────────────────────────────────────────────────────

  const [regData, setRegData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone_number: '',
    whatsapp_number: '',
    company_name: '',
  })

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (regData.password !== regData.confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }
    setLoading(true)
    try {
      const { confirmPassword, ...payload } = regData
      // Remove empty optional fields
      if (!payload.phone_number)     delete payload.phone_number
      if (!payload.whatsapp_number)  delete payload.whatsapp_number
      if (!payload.company_name)     delete payload.company_name
      const res = await api.register(payload)
      onAuthSuccess(res.user)
      onClose()
    } catch (err) {
      setError(err?.message || t('auth.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4"
      style={{ animation: 'fadeIn 0.2s ease' }}
    >
      <div
        className="relative w-full max-w-md bg-white shadow-2xl overflow-hidden"
        style={{ animation: 'slideUp 0.25s ease' }}
      >
        {/* ── Header bar ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          <img src="/logo/logo.png" alt="Star Dewedar" className="h-10 w-auto object-contain" />
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div className="flex border-b border-slate-200 mt-4 px-6">
          {['login', 'register'].map((t_) => (
            <button
              key={t_}
              onClick={() => { setTab(t_); setError('') }}
              className={`
                flex-1 py-3 font-headline font-bold uppercase text-xs tracking-widest transition-all border-b-2
                ${tab === t_
                  ? 'text-slate-900 border-yellow-400'
                  : 'text-slate-400 border-transparent hover:text-slate-600'}
              `}
            >
              {t_ === 'login' ? t('auth.login') : t('auth.register')}
            </button>
          ))}
        </div>

        {/* ── Forms ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-6">
          {/* Error banner */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* ── Login form ───────────────────────────────────────────────── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="auth-label">{t('auth.email')}</label>
                <input
                  id="auth-login-email"
                  type="email"
                  required
                  value={loginData.email}
                  onChange={e => setLoginData(p => ({ ...p, email: e.target.value }))}
                  className="auth-input"
                  placeholder="name@company.com"
                />
              </div>
              <div>
                <label className="auth-label">{t('auth.password')}</label>
                <input
                  id="auth-login-password"
                  type="password"
                  required
                  value={loginData.password}
                  onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))}
                  className="auth-input"
                  placeholder="••••••••"
                />
              </div>
              <button
                id="auth-login-submit"
                type="submit"
                disabled={loading}
                className="auth-btn-primary"
              >
                {loading ? t('auth.loggingIn') : t('auth.login')}
              </button>
              <p className="text-center text-xs text-slate-500 pt-1">
                {t('auth.noAccount')}{' '}
                <button
                  type="button"
                  onClick={() => { setTab('register'); setError('') }}
                  className="text-yellow-600 hover:text-yellow-700 font-semibold underline"
                >
                  {t('auth.registerHere')}
                </button>
              </p>
            </form>
          )}

          {/* ── Register form ────────────────────────────────────────────── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="auth-label">{t('auth.fullName')}</label>
                  <input
                    id="auth-reg-name"
                    type="text"
                    required
                    value={regData.name}
                    onChange={e => setRegData(p => ({ ...p, name: e.target.value }))}
                    className="auth-input"
                    placeholder={t('auth.fullNamePlaceholder')}
                  />
                </div>
                <div className="col-span-2">
                  <label className="auth-label">{t('auth.email')}</label>
                  <input
                    id="auth-reg-email"
                    type="email"
                    required
                    value={regData.email}
                    onChange={e => setRegData(p => ({ ...p, email: e.target.value }))}
                    className="auth-input"
                    placeholder="name@company.com"
                  />
                </div>
                <div>
                  <label className="auth-label">{t('auth.password')}</label>
                  <input
                    id="auth-reg-password"
                    type="password"
                    required
                    minLength={6}
                    value={regData.password}
                    onChange={e => setRegData(p => ({ ...p, password: e.target.value }))}
                    className="auth-input"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="auth-label">{t('auth.confirmPassword')}</label>
                  <input
                    id="auth-reg-confirm"
                    type="password"
                    required
                    value={regData.confirmPassword}
                    onChange={e => setRegData(p => ({ ...p, confirmPassword: e.target.value }))}
                    className="auth-input"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="auth-label">{t('auth.phoneOptional')}</label>
                  <input
                    id="auth-reg-phone"
                    type="tel"
                    value={regData.phone_number}
                    onChange={e => setRegData(p => ({ ...p, phone_number: e.target.value }))}
                    className="auth-input"
                    placeholder="+20 ..."
                  />
                </div>
                <div>
                  <label className="auth-label">{t('auth.whatsappOptional')}</label>
                  <div style={{ position: 'relative' }}>
                    <span
                      className="material-symbols-outlined"
                      style={{ position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', fontSize: '16px', color: '#22c55e', pointerEvents: 'none' }}
                    >chat</span>
                    <input
                      id="auth-reg-whatsapp"
                      type="tel"
                      value={regData.whatsapp_number}
                      onChange={e => setRegData(p => ({ ...p, whatsapp_number: e.target.value }))}
                      className="auth-input"
                      style={{ paddingLeft: '34px' }}
                      placeholder="+20 ..."
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="auth-label">{t('auth.companyOptional')}</label>
                  <input
                    id="auth-reg-company"
                    type="text"
                    value={regData.company_name}
                    onChange={e => setRegData(p => ({ ...p, company_name: e.target.value }))}
                    className="auth-input"
                    placeholder={t('auth.companyPlaceholder')}
                  />
                </div>
              </div>
              <button
                id="auth-reg-submit"
                type="submit"
                disabled={loading}
                className="auth-btn-primary"
              >
                {loading ? t('auth.registering') : t('auth.createAccount')}
              </button>
              <p className="text-center text-xs text-slate-500 pt-1">
                {t('auth.hasAccount')}{' '}
                <button
                  type="button"
                  onClick={() => { setTab('login'); setError('') }}
                  className="text-yellow-600 hover:text-yellow-700 font-semibold underline"
                >
                  {t('auth.loginHere')}
                </button>
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Scoped animations + utility classes */}
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }

        .auth-label {
          display: block;
          font-family: var(--font-headline, sans-serif);
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.65rem;
          letter-spacing: 0.08em;
          color: #475569;
          margin-bottom: 4px;
        }
        .auth-input {
          display: block;
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          font-size: 0.85rem;
          color: #0f172a;
          background: #f8fafc;
          outline: none;
          transition: border-color 0.2s;
        }
        .auth-input:focus { border-color: #eab308; background: #fff; }
        .auth-btn-primary {
          width: 100%;
          padding: 12px;
          background: #0f172a;
          color: #fff;
          font-family: var(--font-headline, sans-serif);
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          border: none;
          cursor: pointer;
          transition: background 0.2s, opacity 0.2s;
        }
        .auth-btn-primary:hover:not(:disabled) { background: #1e293b; }
        .auth-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  )
}
