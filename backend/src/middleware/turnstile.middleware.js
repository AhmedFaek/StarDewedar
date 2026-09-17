/**
 * verifyTurnstile — Cloudflare Turnstile server-side verification middleware.
 *
 * Sits between the rate limiter and the controller. Independently verifies the
 * Turnstile token that the frontend appended to the request (as a FormData field
 * named `turnstileToken`). Rejects the request before any business logic runs if:
 *   • token is missing or empty
 *   • Cloudflare reports the token as invalid / expired
 *   • Cloudflare's Siteverify API is unreachable (fail-safe)
 *
 * Security notes:
 *   • The secret key is read from process.env — never from the request.
 *   • The full token is never logged.
 *   • On success the token field is deleted from req.body so downstream Zod
 *     schemas do not need to know about it.
 */
const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export async function verifyTurnstile(req, res, next) {
    const token = req.body?.turnstileToken

    // 1. Reject missing / empty tokens immediately — no network call needed.
    if (!token || typeof token !== 'string' || token.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Please complete the security verification and try again.',
        })
    }

    const secret = process.env.TURNSTILE_SECRET_KEY

    if (!secret) {
        // Misconfiguration — fail safe rather than silently passing.
        console.error('❌ TURNSTILE_SECRET_KEY is not set in environment variables.')
        return res.status(503).json({
            success: false,
            message: 'Service temporarily unavailable. Please try again later.',
        })
    }

    try {
        // 2. Verify with Cloudflare's Siteverify API.
        const formBody = new URLSearchParams({
            secret,
            response: token,
            // Optionally bind to the requester's IP for extra assurance.
            ...(req.ip ? { remoteip: req.ip } : {}),
        })

        const cfRes = await fetch(SITEVERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formBody.toString(),
        })

        if (!cfRes.ok) {
            // Cloudflare returned a non-200 HTTP status — treat as network failure.
            console.error(`❌ Turnstile siteverify returned HTTP ${cfRes.status}`)
            return res.status(503).json({
                success: false,
                message: 'Security verification service is temporarily unavailable. Please try again later.',
            })
        }

        const result = await cfRes.json()

        if (!result.success) {
            // Log error codes for debugging without exposing them to the client.
            console.warn('⚠️  Turnstile verification failed. Error codes:', result['error-codes'])
            return res.status(403).json({
                success: false,
                message: 'Please complete the security verification and try again.',
            })
        }

        // 3. Strip the token from req.body before passing to the controller.
        //    This keeps downstream Zod schemas clean and avoids accidental leakage.
        delete req.body.turnstileToken

        next()
    } catch (error) {
        // Network failure talking to Cloudflare — fail safe.
        console.error('❌ Turnstile network error:', error.message)
        return res.status(503).json({
            success: false,
            message: 'Security verification service is temporarily unavailable. Please try again later.',
        })
    }
}
