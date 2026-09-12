import { createRequire } from 'module';
import dns from 'dns';

const require = createRequire(import.meta.url);

// Supplemental list of common disposable/temporary email domains
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
];

// Initialize disposable domains set in memory for O(1) lookup
let disposableDomainsSet;
try {
  const domainsList = require('disposable-email-domains');
  disposableDomainsSet = new Set([
    ...domainsList.map((d) => d.toLowerCase().trim()),
    ...SUPPLEMENTAL_DISPOSABLE_DOMAINS.map((d) => d.toLowerCase().trim()),
  ]);
} catch (err) {
  console.error('[emailValidation] Failed to load disposable-email-domains package:', err.message);
  disposableDomainsSet = new Set(SUPPLEMENTAL_DISPOSABLE_DOMAINS);
}

/**
 * Configure DNS resolver with reliable fallback nameservers
 */
const resolver = new dns.promises.Resolver();
try {
  // Use public DNS resolvers (Google & Cloudflare) to ensure consistent behavior across environments
  resolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (err) {
  console.warn('[emailValidation] Could not set custom DNS servers, using system default:', err.message);
}

/**
 * Normalize an email address (lowercase and trim whitespace)
 * @param {string} email
 * @returns {string}
 */
export const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

/**
 * Extract domain from email address
 * @param {string} email
 * @returns {string}
 */
export const getEmailDomain = (email) => {
  const normalized = normalizeEmail(email);
  const parts = normalized.split('@');
  return parts.length === 2 ? parts[1] : '';
};

/**
 * Check if domain or any of its parent domains is in the disposable list
 * @param {string} emailOrDomain
 * @returns {boolean}
 */
export const isDisposableEmail = (emailOrDomain) => {
  if (!emailOrDomain) return false;
  let domain = emailOrDomain.includes('@') ? getEmailDomain(emailOrDomain) : emailOrDomain.toLowerCase().trim();
  if (!domain) return false;

  // Direct check
  if (disposableDomainsSet.has(domain)) return true;

  // Check subdomains (e.g. mail.tempmail.com -> tempmail.com)
  const parts = domain.split('.');
  while (parts.length > 2) {
    parts.shift();
    const parentDomain = parts.join('.');
    if (disposableDomainsSet.has(parentDomain)) {
      return true;
    }
  }

  return false;
};

/**
 * Perform DNS MX check for domain with timeout and fallback to A record
 * @param {string} domain
 * @param {number} timeoutMs
 * @returns {Promise<{ valid: boolean, reason?: string, warning?: string }>}
 */
export const checkEmailDomainMX = async (domain, timeoutMs = 3500) => {
  if (!domain) {
    return { valid: false, reason: 'EMPTY_DOMAIN' };
  }

  let timerId;
  const timeoutPromise = new Promise((resolve) => {
    timerId = setTimeout(() => {
      console.warn(`[emailValidation] DNS lookup timed out for domain: ${domain}`);
      resolve({ valid: true, warning: 'DNS_TIMEOUT_SKIPPED' });
    }, timeoutMs);
  });

  const lookupPromise = (async () => {
    try {
      const mxRecords = await resolver.resolveMx(domain);
      if (mxRecords && mxRecords.length > 0) {
        return { valid: true };
      }
    } catch (err) {
      // If domain is confirmed not to exist (NXDOMAIN / ENOTFOUND)
      if (err.code === 'ENOTFOUND' || err.code === 'NXDOMAIN') {
        return { valid: false, reason: 'DOMAIN_NOT_FOUND' };
      }

      // If MX query returned NODATA or similar, check A record fallback (RFC 5321)
      if (err.code === 'ENODATA' || err.code === 'SERVFAIL') {
        try {
          const aRecords = await resolver.resolve4(domain);
          if (aRecords && aRecords.length > 0) {
            return { valid: true };
          }
        } catch (aErr) {
          if (aErr.code === 'ENOTFOUND' || aErr.code === 'NXDOMAIN') {
            return { valid: false, reason: 'DOMAIN_NOT_FOUND' };
          }
        }
      }

      // Transient or network error (timeout, ECONNREFUSED, etc.)
      // Fail-open to avoid blocking legitimate customers during DNS hiccups
      console.warn(`[emailValidation] DNS check encountered transient error for domain ${domain}:`, err.code || err.message);
      return { valid: true, warning: 'DNS_CHECK_SKIPPED' };
    }

    return { valid: true };
  })();

  try {
    return await Promise.race([lookupPromise, timeoutPromise]);
  } finally {
    clearTimeout(timerId);
  }
};

/**
 * Validate customer email:
 * 1. Normalize
 * 2. Check disposable email domains
 * 3. Check domain MX / DNS records
 * 
 * @param {string} rawEmail
 * @returns {Promise<{ isValid: boolean, normalizedEmail: string, error?: string, code?: string }>}
 */
export const validateCustomerEmail = async (rawEmail) => {
  const normalizedEmail = normalizeEmail(rawEmail);
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return {
      isValid: false,
      normalizedEmail,
      code: 'INVALID_EMAIL_FORMAT',
      error: 'Invalid email format.',
    };
  }

  const domain = getEmailDomain(normalizedEmail);
  if (!domain) {
    return {
      isValid: false,
      normalizedEmail,
      code: 'INVALID_EMAIL_DOMAIN',
      error: 'Invalid email domain.',
    };
  }

  // 1. Check disposable
  if (isDisposableEmail(domain)) {
    return {
      isValid: false,
      normalizedEmail,
      code: 'DISPOSABLE_EMAIL_NOT_ALLOWED',
      error: 'Disposable or temporary email addresses are not allowed. Please use a permanent email address.',
    };
  }

  // 2. Check MX records
  const mxResult = await checkEmailDomainMX(domain);
  if (!mxResult.valid) {
    return {
      isValid: false,
      normalizedEmail,
      code: 'INVALID_EMAIL_DOMAIN',
      error: 'The email domain does not appear to exist or cannot receive emails. Please check your email address.',
    };
  }

  return {
    isValid: true,
    normalizedEmail,
  };
};
