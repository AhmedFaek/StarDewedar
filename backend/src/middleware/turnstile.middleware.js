/**
 * verifyTurnstile — Cloudflare Turnstile server-side verification middleware.
 *
 * Sits between the rate limiter and request parsing. Independently verifies the
 * Turnstile token sent in the X-Turnstile-Token request header. Rejects the
 * request before file parsing or business logic runs if:
 *   • token is missing or empty
 *   • Cloudflare reports the token as invalid / expired
 *   • Cloudflare's Siteverify API is unreachable (fail-safe)
 *
 * Security notes:
 *   • The secret key is read from process.env — never from the request.
 *   • The full token is never logged.
 */
const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const SITEVERIFY_TIMEOUT_MS = 5_000
const EXPECTED_ACTION = 'public_request'

const INVALID_TOKEN_CODES = new Set([
    'missing-input-response',
    'invalid-input-response',
    'timeout-or-duplicate',
])
const PROVIDER_ERROR_CODES = new Set([
    'missing-input-secret',
    'invalid-input-secret',
    'bad-request',
    'internal-error',
])

const respondUnavailable = (res) => res.status(503).json({
    success: false,
    message: 'Security verification service is temporarily unavailable. Please try again later.',
})

export const createTurnstileVerifier = ({
    timeoutMs = SITEVERIFY_TIMEOUT_MS,
    fetchImpl = (...args) => fetch(...args),
} = {}) => async function verifyTurnstile(req, res, next) {
    const token = req.headers?.['x-turnstile-token']

    if (typeof token !== 'string' || token.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Please complete the security verification and try again.',
        })
    }

    const secret = process.env.TURNSTILE_SECRET_KEY

    if (!secret) {
        console.error('Turnstile verification unavailable', { reason: 'missing_secret' })
        return respondUnavailable(res)
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const formBody = new URLSearchParams({
            secret,
            response: token,
            ...(req.ip ? { remoteip: req.ip } : {}),
        })

        const cfRes = await fetchImpl(SITEVERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formBody.toString(),
            signal: controller.signal,
        })

        if (!cfRes.ok) {
            console.error('Turnstile verification unavailable', {
                reason: 'http_failure',
                status: cfRes.status,
            })
            return respondUnavailable(res)
        }

        const result = await cfRes.json()

        if (
            !result ||
            typeof result !== 'object' ||
            typeof result.success !== 'boolean'
        ) {
            console.error('Turnstile verification unavailable', { reason: 'malformed_response' })
            return respondUnavailable(res)
        }

        if (result.success !== true) {
            const errorCodes = Array.isArray(result['error-codes'])
                ? result['error-codes']
                    .filter((code) => typeof code === 'string')
                    .map((code) => code.slice(0, 64))
                : []
            const hasProviderError = errorCodes.some((code) => PROVIDER_ERROR_CODES.has(code))
            const hasInvalidToken = errorCodes.some((code) => INVALID_TOKEN_CODES.has(code))

            if (hasProviderError || !hasInvalidToken) {
                console.error('Turnstile verification unavailable', {
                    reason: hasProviderError ? 'provider_error' : 'unclassified_rejection',
                    errorCodes,
                })
                return respondUnavailable(res)
            }

            console.warn('Turnstile token rejected', { errorCodes })
            return res.status(403).json({
                success: false,
                message: 'Please complete the security verification and try again.',
            })
        }

        if (typeof result.action !== 'string') {
            console.error('Turnstile verification unavailable', { reason: 'malformed_action' })
            return respondUnavailable(res)
        }

        if (result.action !== EXPECTED_ACTION) {
            console.warn('Turnstile action rejected', { reason: 'action_mismatch' })
            return res.status(403).json({
                success: false,
                message: 'Please complete the security verification and try again.',
            })
        }

        next()
    } catch (error) {
        if (controller.signal.aborted) {
            console.error('Turnstile verification unavailable', { reason: 'timeout' })
        } else {
            console.error('Turnstile verification unavailable', {
                reason: 'network_error',
                errorName: typeof error?.name === 'string' ? error.name : 'UnknownError',
            })
        }
        return respondUnavailable(res)
    } finally {
        clearTimeout(timeout)
    }
}

export const verifyTurnstile = createTurnstileVerifier()
