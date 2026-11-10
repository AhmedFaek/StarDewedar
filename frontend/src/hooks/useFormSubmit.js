import { useState, useRef, useCallback } from 'react'
import { useNotification } from './useNotification.js'
import { runFormSubmission } from '../utils/formSubmission.js'

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
      await runFormSubmission({
        onSubmit,
        args,
        onSuccess,
        onError,
        onUnknownOutcome,
        successMessage,
        ambiguousNetworkError,
        t,
        showSuccess,
        showError,
      })
    } finally {
      setIsSubmitting(false)
      inflightRef.current = false
    }
  }, [onSubmit, onSuccess, onError, onUnknownOutcome, successMessage, ambiguousNetworkError, t, showSuccess, showError])

  return { isSubmitting, handleSubmit }
}

export default useFormSubmit
