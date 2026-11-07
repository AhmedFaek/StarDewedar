import { createRequire } from 'module'
import dns from 'dns'
import net from 'net'

const require = createRequire(import.meta.url)
const CACHE_MAX_DOMAINS = 1000
const CACHE_TTL_MS = 10 * 60 * 1000
const DEFAULT_TIMEOUT_MS = 3500
const SUMMARY_LOG_INTERVAL_MS = 60 * 1000
const NO_RECORD_CODES = new Set(['ENODATA', 'ENOTFOUND', 'NXDOMAIN'])
const DOMAIN_NOT_FOUND_CODES = new Set(['ENOTFOUND', 'NXDOMAIN', 'EBADNAME'])
const INVALID_DOMAIN_MESSAGE = 'The email domain does not appear to exist or cannot receive emails. Please check your email address.'

const isValidDomainSyntax = (domain) => (
  typeof domain === 'string' &&
  domain.length <= 253 &&
  domain.includes('.') &&
  domain.split('.').every((label) => (
    label.length >= 1 &&
    label.length <= 63 &&
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label)
  ))
)

const SUPPLEMENTAL_DISPOSABLE_DOMAINS = [
  'tempmail.com',
  'temp-mail.com',
  'tempmail.net',
  'tempmailo.com',
  'dispostable.com',
  'mohmal.com',
  'dropmail.me',
  'generator.email',
  'crazymailing.com',
  'fakemail.net',
  '10mail.org',
  'getairmail.com',
  'mytemp.email',
]

let disposableDomainsSet
try {
  const domainsList = require('disposable-email-domains')
  disposableDomainsSet = new Set([
    ...domainsList.map((domain) => domain.toLowerCase().trim()),
    ...SUPPLEMENTAL_DISPOSABLE_DOMAINS.map((domain) => domain.toLowerCase().trim()),
  ])
} catch (error) {
  console.error('[emailValidation] Failed to load disposable-email-domains package:', error.message)
  disposableDomainsSet = new Set(SUPPLEMENTAL_DISPOSABLE_DOMAINS)
}

export const createDnsResolver = ({
  servers = process.env.EMAIL_DNS_SERVERS,
  resolverFactory = () => new dns.promises.Resolver(),
  logger = console,
} = {}) => {
  const resolver = resolverFactory()
  const configuredServers = typeof servers === 'string'
    ? servers.split(',').map((server) => server.trim()).filter(Boolean)
    : []
  const validServers = configuredServers.filter((server) => net.isIP(server) !== 0)

  if (configuredServers.length !== validServers.length) {
    logger.warn('[emailValidation] Ignoring invalid EMAIL_DNS_SERVERS entries', {
      event: 'email_dns_servers_invalid',
      invalidCount: configuredServers.length - validServers.length,
    })
  }

  if (validServers.length > 0) {
    try {
      resolver.setServers(validServers)
    } catch {
      logger.warn('[emailValidation] Could not set EMAIL_DNS_SERVERS; using system resolver', {
        event: 'email_dns_servers_unavailable',
      })
    }
  }

  return resolver
}

export const normalizeEmail = (email) => (
  typeof email === 'string' ? email.trim().toLowerCase() : ''
)

export const getEmailDomain = (email) => {
  const parts = normalizeEmail(email).split('@')
  return parts.length === 2 ? parts[1] : ''
}

export const isDisposableEmail = (emailOrDomain) => {
  if (typeof emailOrDomain !== 'string' || !emailOrDomain) return false
  const domain = emailOrDomain.includes('@')
    ? getEmailDomain(emailOrDomain)
    : emailOrDomain.toLowerCase().trim()
  if (!domain) return false

  if (disposableDomainsSet.has(domain)) return true

  const parts = domain.split('.')
  while (parts.length > 2) {
    parts.shift()
    if (disposableDomainsSet.has(parts.join('.'))) return true
  }

  return false
}

const getErrorCode = (error) => (
  typeof error?.code === 'string' ? error.code.toUpperCase() : ''
)

const isNoRecordError = (error) => NO_RECORD_CODES.has(getErrorCode(error))

const isNullMx = (records) => (
  records.length === 1 &&
  (records[0]?.exchange === '' || records[0]?.exchange === '.')
)

const toPublicDnsResult = (result) => {
  const { definitive, skipped, ...publicResult } = result
  return publicResult
}

export const createEmailValidator = ({
  resolver: configuredResolver,
  resolverFactory = () => createDnsResolver(),
  now = () => Date.now(),
  timeoutMs = DEFAULT_TIMEOUT_MS,
  logger = console,
} = {}) => {
  const cache = new Map()
  const inFlight = new Map()
  const skippedChecks = { timeout: 0, transient: 0 }
  let lastSummaryLogAt = null
  let pendingSummary = { timeout: 0, transient: 0 }
  let resolver = configuredResolver

  const getResolver = () => {
    if (!resolver) resolver = resolverFactory()
    return resolver
  }

  const cacheResult = (domain, result) => {
    cache.delete(domain)
    cache.set(domain, { expiresAt: now() + CACHE_TTL_MS, result })
    if (cache.size > CACHE_MAX_DOMAINS) {
      cache.delete(cache.keys().next().value)
    }
  }

  const logSkippedSummary = (kind) => {
    skippedChecks[kind] += 1
    pendingSummary[kind] += 1
    const timestamp = now()
    if (lastSummaryLogAt !== null && timestamp - lastSummaryLogAt < SUMMARY_LOG_INTERVAL_MS) return

    logger.warn('[emailValidation] DNS checks skipped', {
      event: 'email_dns_checks_skipped',
      timeoutCount: pendingSummary.timeout,
      transientCount: pendingSummary.transient,
    })
    lastSummaryLogAt = timestamp
    pendingSummary = { timeout: 0, transient: 0 }
  }

  const lookupAddressRecords = async (domain) => {
    const results = await Promise.allSettled([
      Promise.resolve().then(() => getResolver().resolve4(domain)),
      Promise.resolve().then(() => getResolver().resolve6(domain)),
    ])
    let hasTransientError = false

    for (const result of results) {
      if (result.status === 'fulfilled' && Array.isArray(result.value) && result.value.length > 0) {
        return { valid: true, definitive: true }
      }
      if (result.status === 'rejected' && !isNoRecordError(result.reason)) {
        hasTransientError = true
      }
    }

    if (hasTransientError) {
      return { valid: true, warning: 'DNS_CHECK_SKIPPED', skipped: 'transient' }
    }
    return { valid: false, reason: 'DOMAIN_NOT_FOUND', definitive: true }
  }

  const lookupDomain = async (domain) => {
    try {
      const mxRecords = await getResolver().resolveMx(domain)
      if (Array.isArray(mxRecords) && mxRecords.length > 0) {
        if (isNullMx(mxRecords)) {
          return { valid: false, reason: 'NULL_MX', definitive: true }
        }
        return { valid: true, definitive: true }
      }
      return await lookupAddressRecords(domain)
    } catch (error) {
      const code = getErrorCode(error)
      if (DOMAIN_NOT_FOUND_CODES.has(code)) {
        return { valid: false, reason: 'DOMAIN_NOT_FOUND', definitive: true }
      }
      if (code === 'ENODATA') return lookupAddressRecords(domain)
      return { valid: true, warning: 'DNS_CHECK_SKIPPED', skipped: 'transient' }
    }
  }

  const checkEmailDomainMX = async (rawDomain, requestedTimeoutMs = timeoutMs) => {
    const domain = typeof rawDomain === 'string' ? rawDomain.trim().toLowerCase() : ''
    if (!domain) return { valid: false, reason: 'EMPTY_DOMAIN' }
    if (!isValidDomainSyntax(domain)) return { valid: false, reason: 'INVALID_DOMAIN' }

    const cached = cache.get(domain)
    if (cached) {
      if (cached.expiresAt > now()) {
        cache.delete(domain)
        cache.set(domain, cached)
        return toPublicDnsResult(cached.result)
      }
      cache.delete(domain)
    }

    let lookupPromise = inFlight.get(domain)
    if (!lookupPromise) {
      lookupPromise = (async () => {
        let timerId
        let result
        try {
          const timeoutPromise = new Promise((resolve) => {
            timerId = setTimeout(() => resolve({
              valid: true,
              warning: 'DNS_TIMEOUT_SKIPPED',
              skipped: 'timeout',
            }), requestedTimeoutMs)
          })
          result = await Promise.race([lookupDomain(domain), timeoutPromise])
          if (result.skipped) logSkippedSummary(result.skipped)
          if (result.definitive) cacheResult(domain, result)
          return result
        } finally {
          clearTimeout(timerId)
          if (inFlight.get(domain) === lookupPromise) inFlight.delete(domain)
        }
      })()
      inFlight.set(domain, lookupPromise)
    }

    return toPublicDnsResult(await lookupPromise)
  }

  const validateCustomerEmail = async (rawEmail) => {
    const normalizedEmail = normalizeEmail(rawEmail)
    const parts = normalizedEmail.split('@')
    const localPart = parts[0]
    const domain = parts[1]

    if (
      parts.length !== 2 ||
      !localPart ||
      !domain ||
      localPart.length > 64
    ) {
      return {
        isValid: false,
        normalizedEmail,
        code: 'INVALID_EMAIL_FORMAT',
        error: 'Invalid email format.',
      }
    }

    if (domain.length > 253) {
      return {
        isValid: false,
        normalizedEmail,
        code: 'INVALID_EMAIL_DOMAIN',
        error: INVALID_DOMAIN_MESSAGE,
      }
    }

    if (normalizedEmail.length > 254) {
      return {
        isValid: false,
        normalizedEmail,
        code: 'INVALID_EMAIL_FORMAT',
        error: 'Invalid email format.',
      }
    }

    if (!isValidDomainSyntax(domain)) {
      return {
        isValid: false,
        normalizedEmail,
        code: 'INVALID_EMAIL_DOMAIN',
        error: INVALID_DOMAIN_MESSAGE,
      }
    }

    if (isDisposableEmail(domain)) {
      return {
        isValid: false,
        normalizedEmail,
        code: 'DISPOSABLE_EMAIL_NOT_ALLOWED',
        error: 'Disposable or temporary email addresses are not allowed. Please use a permanent email address.',
      }
    }

    const mxResult = await checkEmailDomainMX(domain)
    if (!mxResult.valid) {
      return {
        isValid: false,
        normalizedEmail,
        code: 'INVALID_EMAIL_DOMAIN',
        error: INVALID_DOMAIN_MESSAGE,
      }
    }

    return { isValid: true, normalizedEmail }
  }

  return {
    checkEmailDomainMX,
    validateCustomerEmail,
    getStats: () => ({ ...skippedChecks }),
    resetForTests: () => {
      cache.clear()
      inFlight.clear()
      skippedChecks.timeout = 0
      skippedChecks.transient = 0
      pendingSummary = { timeout: 0, transient: 0 }
      lastSummaryLogAt = null
    },
  }
}

const defaultEmailValidator = createEmailValidator()

export const checkEmailDomainMX = defaultEmailValidator.checkEmailDomainMX
export const validateCustomerEmail = defaultEmailValidator.validateCustomerEmail
export const getEmailValidationStats = defaultEmailValidator.getStats
