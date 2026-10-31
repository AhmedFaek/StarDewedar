import { useState, useRef, useCallback } from 'react'
import { useNotification } from './useNotification.js'
import { getApiErrorMessage } from '../utils/apiErrorHandler.js'

/**
 * useFormSubmit — reusable hook that wraps any async form submission with:
 *   • loading state management
 *   • duplicate submission prevention (single concurrent request per form)
 *   • network error detection with user-friendly notifications
 *   • automatic loading state reset on success or failure
 *
 * @param {object} options
 * @param {function} options.onSubmit      — async function that performs the actual submission
 * @param {function} [options.onSuccess]   — called with the result after a successful submit
 * @param {function} [options.onError]     — called with the normalized error; return `true` to suppress the default toast
 * @param {string}   [options.successMessage] — notification text shown on success
 * @param {function} [options.t]           — i18next `t` function for translation
 * @returns {{ isSubmitting, handleSubmit }}
 */
export function useFormSubmit({
  onSubmit,
  onSuccess,
  onError,
  onUnknownOutcome,
  successMessage,
  ambiguousNetworkError = false,
  t,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inflightRef = useRef(false)
  const { showSuccess, showError } = useNotification()

  const handleSubmit = useCallback(async (...args) => {
    // Prevent duplicate concurrent submissions
    if (inflightRef.current) return
    inflightRef.current = true
    setIsSubmitting(true)

    try {
      const result = await onSubmit(...args)

      if (successMessage) {
        showSuccess(successMessage)
      }

      if (onSuccess) {
        onSuccess(result)
      }
    } catch (error) {
      // Detect network errors (fetch failures, server unreachable)
      const isNetworkError = error instanceof TypeError && (
        ambiguousNetworkError || error.message?.toLowerCase().includes('failed to fetch')
      )

      if (isNetworkError) {
        const suppressed = ambiguousNetworkError && onError ? onError(error) : false
        const recoveryHandled = ambiguousNetworkError && onUnknownOutcome?.(error) === true
        if (!suppressed && !recoveryHandled) {
          const networkMsg = typeof t === 'function'
            ? t(ambiguousNetworkError
              ? 'notifications.submissionOutcomeUnknown'
              : 'notifications.networkError')
            : ambiguousNetworkError
              ? 'We could not confirm whether your request was received. Please verify again before retrying.'
              : 'Network error. Please check your connection and try again.'
          showError(networkMsg)
        }
      } else {
        // Let the caller optionally handle the error; if they return true, we skip the toast
        const suppressed = onError ? onError(error) : false
        if (!suppressed) {
          showError(getApiErrorMessage(error, { t }))
        }
      }
    } finally {
      setIsSubmitting(false)
      inflightRef.current = false
    }
  }, [onSubmit, onSuccess, onError, onUnknownOutcome, successMessage, ambiguousNetworkError, t, showSuccess, showError])

  return { isSubmitting, handleSubmit }
}

export default useFormSubmit
