import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../utils/api.js'
import { clearAuth } from '../../utils/auth.js'

/**
 * ChangePasswordModal — lets an authenticated user change their password.
 *
 * Props:
 *   isOpen    {boolean}   — controls visibility
 *   onClose   {function}  — called when user closes modal
 *   onSuccess {function}  — called after successful password change (forces re-login)
 */
export default function ChangePasswordModal({ isOpen, onClose, onSuccess }) {
  const { t } = useTranslation()
  const overlayRef = useRef(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Password validation
  const hasMinLength = newPassword.length >= 8
  const hasUppercase = /[A-Z]/.test(newPassword)
  const hasLowercase = /[a-z]/.test(newPassword)
  const hasNumber    = /[0-9]/.test(newPassword)
  const allValid     = hasMinLength && hasUppercase && hasLowercase && hasNumber
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError('')
      setSuccess(false)
    }
  }, [isOpen])

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!allValid) {
      setError(t('resetPassword.weakPassword'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }

    setLoading(true)
    try {
      await api.changePassword(currentPassword, newPassword)
      setSuccess(true)
      // After a short delay, clear auth and trigger re-login
      setTimeout(() => {
        clearAuth()
        onSuccess()
        onClose()
      }, 3500)
    } catch (err) {
      setError(err?.message || t('auth.errorGeneric'))
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-yellow-500">lock</span>
            <h2 className="font-headline font-bold uppercase text-sm tracking-wider text-slate-900">
              {t('auth.changePassword')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <div className="px-6 py-6">
          {success ? (
            /* ── Success state ── */
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 mb-4">
                <span className="material-symbols-outlined text-3xl text-green-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2 font-headline uppercase tracking-wider">
                {t('auth.changePasswordSuccess')}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('auth.changePasswordDesc')}
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm mt-0.5 shrink-0">error</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Current password */}
                <div>
                  <label className="auth-label">{t('auth.currentPassword')}</label>
                  <input
                    id="change-current-password"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="auth-input"
                    placeholder="••••••••"
                  />
                </div>

                <hr className="border-slate-100" />

                {/* New password */}
                <div>
                  <label className="auth-label">{t('auth.newPassword')}</label>
                  <input
                    id="change-new-password"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="auth-input"
                    placeholder="••••••••"
                  />
                </div>

                {/* Password requirements */}
                {newPassword.length > 0 && (
                  <ul className="space-y-1.5 py-1">
                    <Requirement met={hasMinLength} label={t('resetPassword.req8Chars')} />
                    <Requirement met={hasUppercase} label={t('resetPassword.reqUppercase')} />
                    <Requirement met={hasLowercase} label={t('resetPassword.reqLowercase')} />
                    <Requirement met={hasNumber}    label={t('resetPassword.reqNumber')} />
                  </ul>
                )}

                {/* Confirm new password */}
                <div>
                  <label className="auth-label">{t('auth.confirmNewPassword')}</label>
                  <input
                    id="change-confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`auth-input ${
                      confirmPassword.length > 0
                        ? passwordsMatch ? '!border-green-400' : '!border-red-300'
                        : ''
                    }`}
                    placeholder="••••••••"
                  />
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="text-xs text-red-500 mt-1">{t('auth.passwordMismatch')}</p>
                  )}
                </div>

                <button
                  id="change-password-submit"
                  type="submit"
                  disabled={loading || !allValid || !passwordsMatch}
                  className="auth-btn-primary"
                >
                  {loading ? t('auth.changingPassword') : t('auth.changePassword')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Reuse auth modal styles */}
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
