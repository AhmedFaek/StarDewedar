import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../utils/api.js'
import { getApiErrorMessage } from '../../utils/apiErrorHandler.js'
import { useNotification } from '../../hooks/useNotification.js'
import { useFormSubmit } from '../../hooks/useFormSubmit.js'
import SubmitButton from '../forms/SubmitButton.jsx'

/**
 * AuthModal - slide-in modal with Login / Register / Forgot Password views.
 *
 * Props:
 *   isOpen        {boolean}   - controls visibility
 *   onClose       {function}  - called when user closes modal
 *   onAuthSuccess {function}  - called with the user object after successful auth
 *   defaultTab    {'login'|'register'} - which tab to start on
 */
export default function AuthModal({ isOpen, onClose, onAuthSuccess, defaultTab = 'login' }) {
  const { t } = useTranslation()
  const { showSuccess, showError, showInfo } = useNotification()
  const [tab, setTab] = useState(defaultTab)
  const [error, setError] = useState('')
  const overlayRef = useRef(null)

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone_number: '',
    whatsapp_number: '',
    company_name: '',
  })

  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab)
      setError('')
      setShowForgotPassword(false)
      setForgotSent(false)
      setForgotEmail('')
    }
  }, [isOpen, defaultTab])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  // ── Login form submission ────────────────────────────────────────
  const { isSubmitting: loginLoading, handleSubmit: doLogin } = useFormSubmit({
    onSubmit: () => api.login(loginData.email, loginData.password),
    successMessage: t('notifications.loginSuccess'),
    onSuccess: (res) => {
      onAuthSuccess(res.user)
      onClose()
    },
    t,
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    await doLogin()
  }

  // ── Register form submission ─────────────────────────────────────
  const { isSubmitting: regLoading, handleSubmit: doRegister } = useFormSubmit({
    onSubmit: () => {
      const { confirmPassword, ...payload } = regData
      if (!payload.phone_number) delete payload.phone_number
      if (!payload.whatsapp_number) delete payload.whatsapp_number
      if (!payload.company_name) delete payload.company_name
      return api.register(payload)
    },
    successMessage: t('notifications.registrationSuccess'),
    onSuccess: (res) => {
      onAuthSuccess(res.user)
      onClose()
    },
    t,
  })

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    if (regData.password !== regData.confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }

    await doRegister()
  }

  // ── Forgot password form submission ──────────────────────────────
  const { isSubmitting: forgotLoading, handleSubmit: doForgot } = useFormSubmit({
    onSubmit: () => api.forgotPassword(forgotEmail),
    onSuccess: () => {
      showInfo(t('notifications.forgotPasswordSent'))
      setForgotSent(true)
    },
    t,
  })

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError('')
    await doForgot()
  }

  const handleBackToLogin = () => {
    setShowForgotPassword(false)
    setForgotSent(false)
    setForgotEmail('')
    setError('')
  }

  // Determine which loading state is active for disabling UI
  const loading = loginLoading || regLoading || forgotLoading

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4"
      style={{ animation: 'fadeIn 0.2s ease' }}
    >
      <div
        className="relative w-full max-w-md overflow-hidden bg-white shadow-2xl"
        style={{ animation: 'slideUp 0.25s ease' }}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          <img src="/logo/logo.png" alt="Star Dewedar" className="h-10 w-auto object-contain" />
          <button
            onClick={onClose}
            className="text-slate-400 transition-colors hover:text-slate-700"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {!showForgotPassword && (
          <div className="mt-4 flex border-b border-slate-200 px-6">
            {['login', 'register'].map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => {
                  setTab(tabKey)
                  setError('')
                }}
                className={`flex-1 border-b-2 py-3 font-headline text-xs font-bold uppercase tracking-widest transition-all
                  ${tab === tabKey
                    ? 'border-yellow-400 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                {tabKey === 'login' ? t('auth.login') : t('auth.register')}
              </button>
            ))}
          </div>
        )}

        <div className="px-6 py-6">
          {showForgotPassword ? (
            <div>
              <button
                type="button"
                onClick={handleBackToLogin}
                className="mb-4 flex items-center gap-1 text-xs font-headline font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-slate-700"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                {t('auth.backToLogin')}
              </button>

              {forgotSent ? (
                <div className="py-4 text-center">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                    <span className="material-symbols-outlined text-3xl text-green-500">mark_email_read</span>
                  </div>
                  <h3 className="mb-2 font-headline text-sm font-bold uppercase tracking-wider text-slate-900">
                    {t('auth.forgotSentTitle')}
                  </h3>
                  <p className="mb-6 text-xs leading-relaxed text-slate-500">
                    {t('auth.forgotSentDesc')}
                  </p>
                  <button type="button" onClick={handleBackToLogin} className="auth-btn-primary">
                    {t('auth.backToLogin')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="mb-2 text-center">
                    <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-yellow-50">
                      <span className="material-symbols-outlined text-3xl text-yellow-500">lock_reset</span>
                    </div>
                    <h3 className="font-headline text-sm font-bold uppercase tracking-wider text-slate-900">
                      {t('auth.forgotPasswordTitle')}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {t('auth.forgotPasswordDesc')}
                    </p>
                  </div>
                  <div>
                    <label className="auth-label">{t('auth.email')}</label>
                    <input
                      id="auth-forgot-email"
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="auth-input"
                      placeholder="name@company.com"
                    />
                  </div>
                  <SubmitButton
                    id="auth-forgot-submit"
                    loading={forgotLoading}
                    loadingText={t('auth.sending')}
                    className="auth-btn-primary inline-flex items-center justify-center"
                  >
                    {t('auth.sendResetLink')}
                  </SubmitButton>
                </form>
              )}
            </div>
          ) : (
            <>
              {tab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="auth-label">{t('auth.email')}</label>
                    <input
                      id="auth-login-email"
                      type="email"
                      required
                      value={loginData.email}
                      onChange={(e) => setLoginData((prev) => ({ ...prev, email: e.target.value }))}
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
                      onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                      className="auth-input"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      id="auth-forgot-link"
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true)
                        setError('')
                      }}
                      className="text-xs font-semibold text-yellow-600 transition-colors hover:text-yellow-700"
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  </div>
                  <SubmitButton
                    id="auth-login-submit"
                    loading={loginLoading}
                    loadingText={t('auth.loggingIn')}
                    className="auth-btn-primary inline-flex items-center justify-center"
                  >
                    {t('auth.login')}
                  </SubmitButton>
                  <p className="pt-1 text-center text-xs text-slate-500">
                    {t('auth.noAccount')}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setTab('register')
                        setError('')
                      }}
                      className="font-semibold text-yellow-600 underline hover:text-yellow-700"
                    >
                      {t('auth.registerHere')}
                    </button>
                  </p>
                </form>
              )}

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
                        onChange={(e) => setRegData((prev) => ({ ...prev, name: e.target.value }))}
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
                        onChange={(e) => setRegData((prev) => ({ ...prev, email: e.target.value }))}
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
                        onChange={(e) => setRegData((prev) => ({ ...prev, password: e.target.value }))}
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
                        onChange={(e) => setRegData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        className="auth-input"
                        placeholder="••••••••"
                      />
                      {error && (
                        <p className="mt-1 text-xs text-red-600">
                          {error}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="auth-label">{t('auth.phoneOptional')}</label>
                      <input
                        id="auth-reg-phone"
                        type="tel"
                        value={regData.phone_number}
                        onChange={(e) => setRegData((prev) => ({ ...prev, phone_number: e.target.value }))}
                        className="auth-input"
                        placeholder="+20 ..."
                      />
                    </div>
                    <div>
                      <label className="auth-label">{t('auth.whatsappOptional')}</label>
                      <div style={{ position: 'relative' }}>
                        <span
                          className="material-symbols-outlined"
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '10px',
                            transform: 'translateY(-50%)',
                            fontSize: '16px',
                            color: '#22c55e',
                            pointerEvents: 'none',
                          }}
                        >
                          chat
                        </span>
                        <input
                          id="auth-reg-whatsapp"
                          type="tel"
                          value={regData.whatsapp_number}
                          onChange={(e) => setRegData((prev) => ({ ...prev, whatsapp_number: e.target.value }))}
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
                        onChange={(e) => setRegData((prev) => ({ ...prev, company_name: e.target.value }))}
                        className="auth-input"
                        placeholder={t('auth.companyPlaceholder')}
                      />
                    </div>
                  </div>
                  <SubmitButton
                    id="auth-reg-submit"
                    loading={regLoading}
                    loadingText={t('auth.registering')}
                    className="auth-btn-primary inline-flex items-center justify-center"
                  >
                    {t('auth.createAccount')}
                  </SubmitButton>
                  <p className="pt-1 text-center text-xs text-slate-500">
                    {t('auth.hasAccount')}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setTab('login')
                        setError('')
                      }}
                      className="font-semibold text-yellow-600 underline hover:text-yellow-700"
                    >
                      {t('auth.loginHere')}
                    </button>
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </div>

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
