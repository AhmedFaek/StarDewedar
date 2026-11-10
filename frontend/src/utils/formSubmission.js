import { getApiErrorMessage } from './apiErrorHandler.js'

export class NetworkRequestError extends Error {
  constructor(cause) {
    super('Network request failed')
    this.name = 'NetworkRequestError'
    this.isNetworkRequestError = true
    this.cause = cause
  }
}

export const isNetworkRequestError = (error) =>
  error?.isNetworkRequestError === true

export const runFormSubmission = async ({
  onSubmit,
  args = [],
  onSuccess,
  onError,
  onUnknownOutcome,
  successMessage,
  ambiguousNetworkError = false,
  t,
  showSuccess,
  showError,
  logger = console,
}) => {
  let result

  try {
    result = await onSubmit(...args)
  } catch (error) {
    const isNetworkError = isNetworkRequestError(error) || (
      !ambiguousNetworkError &&
      error instanceof TypeError &&
      error.message?.toLowerCase().includes('failed to fetch')
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
      return
    }

    const suppressed = onError ? onError(error) : false
    if (!suppressed) {
      showError(getApiErrorMessage(error, { t }))
    }
    return
  }

  if (successMessage) {
    try {
      await showSuccess(successMessage)
    } catch (error) {
      logger.error('Form submission success notification failed', {
        errorName: error?.name || 'Error',
      })
    }
  }

  if (onSuccess) {
    try {
      await onSuccess(result)
    } catch (error) {
      logger.error('Form submission success callback failed', {
        errorName: error?.name || 'Error',
      })
    }
  }
}
