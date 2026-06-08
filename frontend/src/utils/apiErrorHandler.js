const DEFAULT_MESSAGE = 'Something went wrong. Please try again.'

const toLower = (value) => (typeof value === 'string' ? value.toLowerCase() : '')

const extractResponseMessage = (error) => {
  if (!error) return ''
  if (typeof error === 'string') return error
  if (typeof error.message === 'string') return error.message
  if (typeof error.error === 'string') return error.error
  if (typeof error.detail === 'string') return error.detail
  if (typeof error.data?.message === 'string') return error.data.message
  return ''
}

const extractValidationMessages = (error) => {
  const payload = error?.errors || error?.data?.errors
  if (!Array.isArray(payload) || payload.length === 0) return []

  return payload
    .map((item) => {
      if (!item) return ''
      if (typeof item === 'string') return item
      if (typeof item.message === 'string') return item.message
      if (typeof item.msg === 'string') return item.msg
      if (typeof item.error === 'string') return item.error
      return ''
    })
    .filter(Boolean)
}

export const normalizeApiError = (error) => {
  if (!error) {
    return {
      __normalizedApiError: true,
      message: DEFAULT_MESSAGE,
      status: undefined,
      validationErrors: [],
      raw: error,
    }
  }

  if (error.__normalizedApiError) {
    return {
      __normalizedApiError: true,
      message: typeof error.message === 'string' && error.message ? error.message : DEFAULT_MESSAGE,
      status: error.status || error.statusCode || error.code,
      validationErrors: Array.isArray(error.validationErrors) ? error.validationErrors : [],
      raw: error.raw ?? error,
    }
  }

  const status = error.status || error.statusCode || error.code
  const validationErrors = extractValidationMessages(error)
  const message = extractResponseMessage(error) || DEFAULT_MESSAGE

  return {
    __normalizedApiError: true,
    message,
    status,
    validationErrors,
    raw: error,
  }
}

export const getApiErrorMessage = (error, { t, fallbackMessage = DEFAULT_MESSAGE } = {}) => {
  const normalized = normalizeApiError(error)
  const translate = typeof t === 'function' ? t : null
  const validationErrors = Array.isArray(normalized.validationErrors) ? normalized.validationErrors : []

  const messageFor = (key) => {
    if (!translate) return fallbackMessage
    return translate(key, { defaultValue: fallbackMessage })
  }

  const message = toLower(normalized.message)

  if (validationErrors.length > 0) {
    return validationErrors.join('\n')
  }

  if (normalized.status === 401) {
    if (
      message.includes('invalid credentials') ||
      message.includes('invalid email') ||
      message.includes('invalid password') ||
      message.includes('wrong password') ||
      message.includes('wrong credentials') ||
      message.includes('incorrect password') ||
      message.includes('authentication failed')
    ) {
      return messageFor('notifications.invalidCredentials')
    }
    if (message.includes('session') || message.includes('expired') || message.includes('token')) {
      return messageFor('notifications.sessionExpired')
    }
    return messageFor('notifications.invalidCredentials')
  }

  if (normalized.status === 403) {
    return messageFor('notifications.unauthorized')
  }

  if (normalized.status === 408 || message.includes('network') || message.includes('failed to fetch')) {
    return messageFor('notifications.networkError')
  }

  if (message.includes('upload')) {
    return messageFor('notifications.uploadFailed')
  }

  if (message.includes('validation error')) {
    return messageFor('notifications.validationError')
  }

  if (normalized.message && normalized.message !== DEFAULT_MESSAGE) {
    return normalized.message
  }

  return messageFor('notifications.genericError')
}

export const createApiError = (response, body) => {
  const message = body?.message || body?.error || DEFAULT_MESSAGE
  const error = new Error(message)
  error.status = response.status
  error.data = body
  error.__normalizedApiError = true

  if (Array.isArray(body?.errors)) {
    error.errors = body.errors
  }

  return error
}
