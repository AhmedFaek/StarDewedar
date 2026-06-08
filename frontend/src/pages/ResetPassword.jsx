import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../utils/api.js'
import Header from '../components/layout/Header.jsx'
import Footer from '../components/layout/Footer.jsx'
import { getApiErrorMessage } from '../utils/apiErrorHandler.js'
import { useNotification } from '../hooks/useNotification.js'

/**
 * ResetPassword — standalone page at /reset-password?token=...
 *
 * The user lands here from the email link. They enter a new password,
 * and the backend validates the token + updates the password.
 */
export default function ResetPassword() {
  const { t } = useTranslation()
  const { showSuccess, showError } = useNotification()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Password validation helpers
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber    = /[0-9]/.test(password)
  const allValid     = hasMinLength && hasUppercase && hasLowercase && hasNumber
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  // If no token present, show error
  useEffect(() => {
    if (!token) {
      setError(t('resetPassword.invalidToken'))
      showError(t('resetPassword.invalidToken'))
    }
  }, [token, t, showError])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!allValid) {
      setError(t('resetPassword.weakPassword'))
      return
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }

    setLoading(true)
    try {
      await api.resetPassword(token, password)
      showSuccess(t('notifications.passwordResetSuccess'))
      setSuccess(true)
    } catch (err) {
      const message = getApiErrorMessage(err, { t })
      setError(message)
      showError(message)
    } finally {
      setLoading(false)
    }
  }

  const Requirement = ({ met, label }) => (
    <li className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-green-600' : 'text-slate-400'}`}>
      <span className="material-symbols-outlined text-sm" style={met ? { fontVariationSettings: "'FILL' 1" } : {}}>
        {met ? 'check_circle' : 'circle'}
      </span>
      {label}
    </li>
  )

  return (
    <>
      <Header />
      <main className="min-h-screen flex items-center justify-center px-4 pt-32 pb-16 bg-surface">
        <div className="w-full max-w-md">

          {/* ── Card ────────────────────────────────────────────────────── */}
          <div className="bg-white shadow-ambient overflow-hidden">

            {/* Top accent bar */}
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #000e24 0%, #e8b540 50%, #000e24 100%)' }} />

            <div className="px-8 py-10">

              {success ? (
                /* ── Success state ─────────────────────────────────────── */
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-5">
                    <span className="material-symbols-outlined text-4xl text-green-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  </div>
                  <h1 className="text-lg font-bold text-slate-900 font-headline uppercase tracking-wider mb-2">
                    {t('resetPassword.successTitle')}
                  </h1>
                  <p className="text-sm text-slate-500 leading-relaxed mb-8">
                    {t('resetPassword.successDesc')}
                  </p>
                  <button
                    id="reset-go-login"
                    onClick={() => navigate('/')}
                    className="w-full py-3 bg-slate-900 text-white font-headline font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors"
                  >
                    {t('resetPassword.goToLogin')}
                  </button>
                </div>
              ) : (
                /* ── Reset form ────────────────────────────────────────── */
                <>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-50 mb-4">
                      <span className="material-symbols-outlined text-4xl text-yellow-500">lock_reset</span>
                    </div>
                    <h1 className="text-lg font-bold text-slate-900 font-headline uppercase tracking-wider">
                      {t('resetPassword.title')}
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                      {t('resetPassword.subtitle')}
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2">
                      <span className="material-symbols-outlined text-sm mt-0.5 shrink-0">error</span>
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* New password */}
                    <div>
                      <label className="block font-headline font-bold uppercase text-[0.65rem] tracking-[0.08em] text-slate-500 mb-1">
                        {t('resetPassword.newPassword')}
                      </label>
                      <input
                        id="reset-new-password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-300 text-sm text-slate-900 bg-slate-50 focus:border-yellow-400 focus:bg-white outline-none transition-colors"
                        placeholder="••••••••"
                        disabled={!token}
                      />
                    </div>

                    {/* Password strength indicators */}
                    {password.length > 0 && (
                      <ul className="space-y-1.5 py-1">
                        <Requirement met={hasMinLength} label={t('resetPassword.req8Chars')} />
                        <Requirement met={hasUppercase} label={t('resetPassword.reqUppercase')} />
                        <Requirement met={hasLowercase} label={t('resetPassword.reqLowercase')} />
                        <Requirement met={hasNumber}    label={t('resetPassword.reqNumber')} />
                      </ul>
                    )}

                    {/* Confirm password */}
                    <div>
                      <label className="block font-headline font-bold uppercase text-[0.65rem] tracking-[0.08em] text-slate-500 mb-1">
                        {t('resetPassword.confirmPassword')}
                      </label>
                      <input
                        id="reset-confirm-password"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full px-3 py-2.5 border text-sm text-slate-900 bg-slate-50 focus:bg-white outline-none transition-colors ${
                          confirmPassword.length > 0
                            ? passwordsMatch
                              ? 'border-green-400 focus:border-green-400'
                              : 'border-red-300 focus:border-red-400'
                            : 'border-slate-300 focus:border-yellow-400'
                        }`}
                        placeholder="••••••••"
                        disabled={!token}
                      />
                      {confirmPassword.length > 0 && !passwordsMatch && (
                        <p className="text-xs text-red-500 mt-1">{t('auth.passwordMismatch')}</p>
                      )}
                    </div>

                    {/* Submit */}
                    <button
                      id="reset-submit-btn"
                      type="submit"
                      disabled={loading || !token || !allValid || !passwordsMatch}
                      className="w-full py-3 bg-slate-900 text-white font-headline font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? t('resetPassword.resetting') : t('resetPassword.resetButton')}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* Back to home link */}
          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors font-headline uppercase tracking-widest"
            >
              ← {t('resetPassword.backToHome')}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
