import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { isLoggedIn } from '../../utils/auth.js'
import { api } from '../../utils/api.js'
import { getApiErrorMessage } from '../../utils/apiErrorHandler.js'
import { useNotification } from '../../hooks/useNotification.js'

/**
 * FavouriteButton — heart toggle for a single product.
 * Only renders for authenticated users.
 *
 * Props:
 *   productId   {string}   — product UUID
 *   size        {'sm'|'md'} — icon size (default 'md')
 *   className   {string}   — extra wrapper classes
 *   onLoginRequired {fn}  — called when guest taps the button (optional)
 */
export default function FavouriteButton({ productId, size = 'md', className = '', onUnsaved }) {
  const { t } = useTranslation()
  const { showSuccess, showError } = useNotification()
  const loggedIn = isLoggedIn()

  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false) // has the initial check finished?

  const iconSize = size === 'sm' ? 'text-[18px]' : 'text-[22px]'
  const btnSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'

  // Check initial saved state once (only for logged-in users)
  useEffect(() => {
    if (!loggedIn || !productId) {
      setChecked(true)
      return
    }
    api.checkSaved(productId)
      .then(res => setSaved(res.saved))
      .catch(() => {})
      .finally(() => setChecked(true))
  }, [productId, loggedIn])

  if (!loggedIn) return null
  if (!checked) return null // don't flash until we know the state

  const handleToggle = async (e) => {
    e.stopPropagation()
    if (loading) return
    const next = !saved
    setSaved(next) // optimistic
    setLoading(true)
    try {
      if (next) {
        await api.saveProduct(productId)
        showSuccess(t('notifications.savedProductSuccess'))
      } else {
        await api.unsaveProduct(productId)
        onUnsaved?.(productId)
        showSuccess(t('notifications.removedProductSuccess'))
      }
    } catch (error) {
      setSaved(!next) // revert on error
      showError(getApiErrorMessage(error, { t }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={saved ? t('favourites.remove') : t('favourites.save')}
      title={saved ? t('favourites.remove') : t('favourites.save')}
      className={`
        ${btnSize} flex items-center justify-center rounded-full
        transition-all duration-200 disabled:opacity-60
        ${saved
          ? 'bg-red-50 text-red-500 hover:bg-red-100'
          : 'bg-white/80 backdrop-blur-sm text-slate-400 hover:text-red-400 hover:bg-red-50 shadow-sm border border-slate-200/60'}
        ${className}
      `}
      style={{ lineHeight: 1 }}
    >
      <span
        className={`material-symbols-outlined ${iconSize} leading-none`}
        style={{
          fontVariationSettings: saved
            ? "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24"
            : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
          transition: 'font-variation-settings 0.2s ease',
        }}
      >
        favorite
      </span>
    </button>
  )
}
