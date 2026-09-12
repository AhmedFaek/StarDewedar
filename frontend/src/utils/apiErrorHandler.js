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

/**
 * Try to parse Zod-style JSON from a message string.
 * Zod's ZodError.message is a JSON-stringified array of issue objects.
 */
const tryParseZodMessage = (message) => {
  if (typeof message !== 'string') return []
  const trimmed = message.trim()
  if (!trimmed.startsWith('[')) return []
  try {
    const parsed = JSON.parse(trimmed)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => (typeof item?.message === 'string' ? item.message : ''))
      .filter(Boolean)
  } catch {
    return []
  }
}

const extractMessagesFromArray = (payload) => {
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

const extractValidationMessages = (error) => {
  const payload = error?.errors || error?.data?.errors
  const fromArray = extractMessagesFromArray(payload)
  if (fromArray.length > 0) return fromArray

  // Fallback: try parsing Zod-style JSON from error.message or error.data?.message
  const fromMsg = tryParseZodMessage(error?.message) || tryParseZodMessage(error?.data?.message)
  if (fromMsg.length > 0) return fromMsg

  return []
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
      validationErrors: Array.isArray(error.validationErrors) && error.validationErrors.length > 0
        ? error.validationErrors
        : extractValidationMessages(error),
      code: error.code || error.data?.code,
      remaining: error.remaining ?? error.data?.remaining,
      retryAfter: error.retryAfter ?? error.data?.retryAfter,
      requiresEmailVerification: error.requiresEmailVerification ?? error.data?.requiresEmailVerification,
      email: error.email || error.data?.email,
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
    code: error?.code || error?.data?.code,
    remaining: error?.remaining ?? error?.data?.remaining,
    retryAfter: error?.retryAfter ?? error?.data?.retryAfter,
    requiresEmailVerification: error?.requiresEmailVerification ?? error?.data?.requiresEmailVerification,
    email: error?.email || error?.data?.email,
    raw: error,
  }
}

export const getApiErrorMessage = (error, { t, fallbackMessage = DEFAULT_MESSAGE } = {}) => {
  const normalized = normalizeApiError(error)
  const translate = typeof t === 'function' ? t : null
  const validationErrors = Array.isArray(normalized.validationErrors) ? normalized.validationErrors : []

  const messageFor = (key, options = {}) => {
    if (!translate) return fallbackMessage
    return translate(key, { defaultValue: fallbackMessage, ...options })
  }

  const message = toLower(normalized.message)
  const code = String(normalized.code || '').toUpperCase()

  // 1. Validation errors
  if (validationErrors.length > 0) {
    return validationErrors.join('\n')
  }

  // 2. Authentication & Email Verification domain errors
  if (code === 'INVALID_VERIFICATION_CODE' || message.includes('invalid verification code')) {
    const attemptsMatch = normalized.message.match(/(\d+)\s+attempt/i)
    const remaining = normalized.remaining ?? (attemptsMatch ? parseInt(attemptsMatch[1], 10) : undefined)

    if (remaining !== undefined && remaining > 0) {
      return messageFor('auth.verification.invalidCodeWithAttempts', { count: remaining })
    }
    if (message.includes('maximum') || message.includes('reached') || remaining === 0) {
      return messageFor('auth.verification.maxAttemptsReached')
    }
    return messageFor('auth.verification.invalidCode')
  }

  if (code === 'MAX_VERIFICATION_ATTEMPTS_EXCEEDED' || message.includes('too many failed attempts')) {
    return messageFor('auth.verification.maxAttemptsExceeded')
  }

  if (code === 'VERIFICATION_CODE_EXPIRED' || (message.includes('code') && message.includes('expired'))) {
    return messageFor('auth.verification.codeExpired')
  }

  if (code === 'RESEND_COOLDOWN' || (message.includes('wait') && message.includes('second'))) {
    const secondsMatch = normalized.message.match(/wait\s+(\d+)\s+second/i)
    const seconds = normalized.retryAfter ?? (secondsMatch ? secondsMatch[1] : 60)
    return messageFor('auth.verification.resendCooldownError', { seconds })
  }

  if (code === 'DISPOSABLE_EMAIL_NOT_ALLOWED' || message.includes('disposable') || message.includes('temporary email')) {
    return messageFor('auth.verification.disposableEmailError')
  }

  if (code === 'INVALID_EMAIL_DOMAIN' || message.includes('email domain')) {
    return messageFor('auth.verification.invalidDomainError')
  }

  if (normalized.requiresEmailVerification || message.includes('verify your email address before logging in') || message.includes('verify your email')) {
    return messageFor('auth.verification.unverifiedLoginError')
  }

  if (message.includes('email already exists') || message.includes('already registered')) {
    return messageFor('auth.emailAlreadyExists')
  }

  if (message.includes('current password is incorrect') || message.includes('current password')) {
    return messageFor('auth.currentPasswordIncorrect')
  }

  if (message.includes('passwords do not match') || message.includes('password mismatch')) {
    return messageFor('auth.passwordMismatch')
  }

  // 3. HTTP status-based defaults
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
    const trimmedMsg = normalized.message.trim()
    if (trimmedMsg.startsWith('[') || trimmedMsg.startsWith('{')) {
      return messageFor('notifications.validationError')
    }
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

  if (body?.requiresEmailVerification) {
    error.requiresEmailVerification = true
    error.email = body.email
  }
  if (body?.code) {
    error.code = body.code
  }
  if (body?.remaining !== undefined) {
    error.remaining = body.remaining
  }
  if (body?.retryAfter !== undefined) {
    error.retryAfter = body.retryAfter
  }

  if (Array.isArray(body?.errors)) {
    error.errors = body.errors
  }

  return error
}
