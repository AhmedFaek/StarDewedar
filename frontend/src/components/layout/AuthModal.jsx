import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../utils/api.js'
import { getApiErrorMessage } from '../../utils/apiErrorHandler.js'
import { useNotification } from '../../hooks/useNotification.js'
import { useFormSubmit } from '../../hooks/useFormSubmit.js'
import SubmitButton from '../forms/SubmitButton.jsx'

/**
 * AuthModal - slide-in modal with Login / Register / Email Verification / Forgot Password views.
 *
 * Props:
 *   isOpen        {boolean}   - controls visibility
 *   onClose       {function}  - called when user closes modal
 *   onAuthSuccess {function}  - called with the user object after successful auth
 *   defaultTab    {'login'|'register'} - which tab to start on
 */
const Requirement = ({ met, label }) => (
  <li className={`flex items-center gap-2 text-[11px] transition-colors ${met ? 'text-green-600' : 'text-slate-400'}`}>
    <span className="material-symbols-outlined text-xs" style={met ? { fontVariationSettings: "'FILL' 1" } : {}}>
      {met ? 'check_circle' : 'circle'}
    </span>
    {label}
  </li>
)

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

  // Email verification state
  const [showVerification, setShowVerification] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

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

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab)
      setError('')
      setShowForgotPassword(false)
      setShowVerification(false)
      setForgotSent(false)
      setForgotEmail('')
      setVerificationCode('')
      setResendCooldown(0)
    }
  }, [isOpen, defaultTab])

  // Manage body scroll lock
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

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Cooldown timer for resending verification code
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  const hasMinLength = regData.password.length >= 8
  const hasUppercase = /[A-Z]/.test(regData.password)
  const hasLowercase = /[a-z]/.test(regData.password)
  const hasNumber = /[0-9]/.test(regData.password)
  const allValid = hasMinLength && hasUppercase && hasLowercase && hasNumber
  const passwordsMatch = regData.password === regData.confirmPassword && regData.confirmPassword.length > 0

  // ── Login form submission ────────────────────────────────────────
  const { isSubmitting: loginLoading, handleSubmit: doLogin } = useFormSubmit({
    onSubmit: () => api.login(loginData.email, loginData.password),
    successMessage: t('notifications.loginSuccess'),
    onSuccess: (res) => {
      onAuthSuccess(res.user)
      onClose()
    },
    onError: (err) => {
      if (err?.requiresEmailVerification || err?.data?.requiresEmailVerification) {
        const email = err.email || err?.data?.email || loginData.email
        setVerificationEmail(email)
        setShowVerification(true)
        setVerificationCode('')
        setError('')
        showInfo(t('auth.verification.unverifiedLoginPrompt'))
        return true // Suppress default toast
      }
      setError(getApiErrorMessage(err, { t }))
      return false
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
    successMessage: null, // Don't show login success because email verification is required
    onSuccess: (res) => {
      if (res?.requiresEmailVerification) {
        setVerificationEmail(res.email || regData.email)
        setShowVerification(true)
        setVerificationCode('')
        setError('')
        setResendCooldown(60)
        showInfo(t('auth.verification.codeSentNotification'))
      } else if (res?.user) {
        onAuthSuccess(res.user)
        onClose()
      }
    },
    onError: (err) => {
      setError(getApiErrorMessage(err, { t }))
      return false
    },
    t,
  })

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    if (!allValid) {
      setError(t('resetPassword.weakPassword'))
      return
    }

    if (regData.password !== regData.confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }

    await doRegister()
  }

  // ── Verify Email form submission ─────────────────────────────────
  const handleVerifyEmail = async (e) => {
    e.preventDefault()
    setError('')
    const cleanCode = verificationCode.trim()

    if (cleanCode.length !== 6) {
      setError(t('auth.verification.codeRequired'))
      return
    }

    setVerifyLoading(true)
    try {
      const res = await api.verifyEmail(verificationEmail, cleanCode)
      showSuccess(t('notifications.loginSuccess'))
      if (res.user) {
        onAuthSuccess(res.user)
      }
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err, { t }))
    } finally {
      setVerifyLoading(false)
    }
  }

  // ── Resend Verification Code ─────────────────────────────────────
  const handleResendCode = async () => {
    if (resendCooldown > 0 || resendLoading) return
    setError('')
    setResendLoading(true)
    try {
      await api.resendVerification(verificationEmail)
      showSuccess(t('auth.verification.resendSuccess'))
      setResendCooldown(60)
    } catch (err) {
      setError(getApiErrorMessage(err, { t }))
    } finally {
      setResendLoading(false)
    }
  }

  // ── Forgot password form submission ──────────────────────────────
  const { isSubmitting: forgotLoading, handleSubmit: doForgot } = useFormSubmit({
    onSubmit: () => api.forgotPassword(forgotEmail),
    onSuccess: () => {
      showInfo(t('notifications.forgotPasswordSent'))
      setForgotSent(true)
    },
    onError: (err) => {
      setError(getApiErrorMessage(err, { t }))
      return false
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
    setShowVerification(false)
    setForgotSent(false)
    setForgotEmail('')
    setVerificationCode('')
    setError('')
    setTab('login')
  }

  const handleBackToRegister = () => {
    setShowVerification(false)
    setVerificationCode('')
    setError('')
    setTab('register')
  }

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 px-4"
      style={{ animation: 'fadeIn 0.2s ease' }}
    >
      <div
        className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-white shadow-2xl"
        style={{ animation: 'slideUp 0.25s ease' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-0 flex-shrink-0">
          <img src="/logo/logo.png" alt="Star Dewedar" className="h-10 w-auto object-contain" />
          <button
            onClick={onClose}
            className="text-slate-400 transition-colors hover:text-slate-700"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Tab Navigation (only for standard login/register) */}
        {!showForgotPassword && !showVerification && (
          <div className="mt-4 flex border-b border-slate-200 px-6 flex-shrink-0">
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

        {/* Content Body */}
        <div className="px-6 py-6 overflow-y-auto flex-1">
          {showVerification ? (
            /* ── Email Verification View ────────────────────────────── */
            <div>
              <button
                type="button"
                onClick={handleBackToLogin}
                className="mb-4 flex items-center gap-1 text-xs font-headline font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-slate-700"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                {t('auth.backToLogin')}
              </button>

              <div className="mb-4 text-center">
                <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-yellow-50 text-yellow-600">
                  <span className="material-symbols-outlined text-3xl">mark_email_unread</span>
                </div>
                <h3 className="font-headline text-base font-bold uppercase tracking-wider text-slate-900">
                  {t('auth.verification.title')}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  {t('auth.verification.subtitle')}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-900 break-all">
                  {verificationEmail}
                </p>
              </div>

              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div>
                  <label className="auth-label text-center mb-2">
                    {t('auth.verification.codeLabel')}
                  </label>
                  <input
                    id="auth-verification-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    value={verificationCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setVerificationCode(val)
                      if (error) setError('')
                    }}
                    className="auth-input text-center text-2xl font-mono font-bold tracking-[0.4em] py-3"
                    placeholder="000000"
                    autoFocus
                  />
                  <p className="mt-1.5 text-[11px] text-slate-400 text-center">
                    {t('auth.verification.expiryNotice')}
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded">
                    {error}
                  </div>
                )}

                <SubmitButton
                  id="auth-verify-submit"
                  loading={verifyLoading}
                  loadingText={t('auth.verification.verifying')}
                  disabled={verificationCode.length !== 6}
                  className="auth-btn-primary inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('auth.verification.verifyButton')}
                </SubmitButton>

                <div className="flex flex-col items-center gap-2 pt-2 text-center text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    <span>{t('auth.verification.didntReceive')}</span>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendCooldown > 0 || resendLoading}
                      className="font-semibold text-yellow-600 hover:text-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {resendLoading
                        ? t('auth.verification.resending')
                        : resendCooldown > 0
                        ? t('auth.verification.resendCooldown', { seconds: resendCooldown })
                        : t('auth.verification.resendCode')}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleBackToRegister}
                    className="text-[11px] text-slate-400 hover:text-slate-600 underline transition-colors"
                  >
                    {t('auth.verification.wrongEmail')}
                  </button>
                </div>
              </form>
            </div>
          ) : showForgotPassword ? (
            /* ── Forgot Password View ───────────────────────────────── */
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
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded">
                      {error}
                    </div>
                  )}
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
            /* ── Login / Register Tabs ──────────────────────────────── */
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

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded">
                      {error}
                    </div>
                  )}

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
                    <div className="col-span-2 sm:col-span-1">
                      <label className="auth-label">{t('auth.password')}</label>
                      <input
                        id="auth-reg-password"
                        type="password"
                        required
                        value={regData.password}
                        onChange={(e) => setRegData((prev) => ({ ...prev, password: e.target.value }))}
                        className="auth-input"
                        placeholder="••••••••"
                      />
                      {regData.password.length > 0 && (
                        <ul className="mt-1.5 space-y-1">
                          <Requirement met={hasMinLength} label={t('resetPassword.req8Chars')} />
                          <Requirement met={hasUppercase} label={t('resetPassword.reqUppercase')} />
                          <Requirement met={hasLowercase} label={t('resetPassword.reqLowercase')} />
                          <Requirement met={hasNumber} label={t('resetPassword.reqNumber')} />
                        </ul>
                      )}
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="auth-label">{t('auth.confirmPassword')}</label>
                      <input
                        id="auth-reg-confirm"
                        type="password"
                        required
                        value={regData.confirmPassword}
                        onChange={(e) => setRegData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        className={`auth-input ${
                          regData.confirmPassword.length > 0
                            ? passwordsMatch
                              ? '!border-green-400'
                              : '!border-red-300'
                            : ''
                        }`}
                        placeholder="••••••••"
                      />
                      {regData.confirmPassword.length > 0 && !passwordsMatch && (
                        <p className="mt-1 text-[11px] text-red-500">{t('auth.passwordMismatch')}</p>
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

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded">
                      {error}
                    </div>
                  )}

                  <SubmitButton
                    id="auth-reg-submit"
                    loading={regLoading}
                    loadingText={t('auth.registering')}
                    disabled={!allValid || !passwordsMatch}
                    className="auth-btn-primary inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
