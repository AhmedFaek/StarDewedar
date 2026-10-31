import { randomUUID } from 'node:crypto'
import prisma from '../../utils/prisma.js'
import {
    sendBOQRequestEmail,
    sendQuoteRequestEmail,
    sendVisitRequestEmail,
} from './requestNotificationEmail.js'

export const NOTIFICATION_LEASE_MS = 4 * 60_000
export const AMBIGUOUS_OUTCOME_COOLDOWN_MS = 5 * 60_000

const requestTypes = {
    visit: {
        delegate: 'visitRequest',
        send: sendVisitRequestEmail,
    },
    quote: {
        delegate: 'quoteRequest',
        include: { product: true },
        send: sendQuoteRequestEmail,
    },
    boq: {
        delegate: 'bOQRequest',
        send: sendBOQRequestEmail,
    },
}

const safeCode = (error, outcome) => {
    const code = String(error?.code || '').toUpperCase()
    if (/^[A-Z0-9_]{1,48}$/.test(code)) return code
    return outcome === 'unknown' ? 'EMAIL_OUTCOME_UNKNOWN' : 'EMAIL_DELIVERY_FAILED'
}

export const classifyEmailOutcome = (error) => {
    const code = String(error?.code || '').toUpperCase()
    const ambiguousCodes = new Set([
        'EMAIL_TIMEOUT',
        'ETIMEDOUT',
        'ESOCKETTIMEDOUT',
        'ECONNRESET',
        'ECONNABORTED',
        'EPIPE',
    ])
    const responseCode = Number(error?.responseCode)
    if (responseCode >= 400 && responseCode < 600) return 'failed'
    return ambiguousCodes.has(code) || (error?.command === 'DATA' && !responseCode)
        ? 'unknown'
        : 'failed'
}

export class NotificationRecoveryError extends Error {
    constructor(status, code, message) {
        super(message)
        this.status = status
        this.code = code
    }
}

export const createNotificationRecoveryService = ({
    delegates,
    senders = {
        visit: sendVisitRequestEmail,
        quote: sendQuoteRequestEmail,
        boq: sendBOQRequestEmail,
    },
    now = () => new Date(),
    createToken = randomUUID,
    leaseMs = NOTIFICATION_LEASE_MS,
    cooldownMs = AMBIGUOUS_OUTCOME_COOLDOWN_MS,
    logger = console,
}) => {
    const getDefinition = (type) => {
        const definition = requestTypes[type]
        if (!definition || !delegates[definition.delegate]) {
            throw new NotificationRecoveryError(400, 'INVALID_REQUEST_TYPE', 'Unsupported request type.')
        }
        return {
            ...definition,
            delegate: delegates[definition.delegate],
            send: senders[type] || definition.send,
        }
    }

    const readRequest = (definition, id) => definition.delegate.findUnique({
        where: { id },
        ...(definition.include ? { include: definition.include } : {}),
    })

    const claimAttempt = async (definition, id, { initial, confirmUnknownDelivery }) => {
        const claimedAt = now()
        const leaseToken = createToken()
        const eligibleStates = initial
            ? [{ notification_status: 'pending' }]
            : [
                { notification_status: { in: ['pending', 'failed'] } },
                { notification_status: 'sending' },
                ...(confirmUnknownDelivery ? [{ notification_status: 'unknown' }] : []),
            ]

        const result = await definition.delegate.updateMany({
            where: {
                id,
                AND: [
                    {
                        OR: [
                            { notification_lease_expires_at: null },
                            { notification_lease_expires_at: { lte: claimedAt } },
                        ],
                    },
                    { OR: eligibleStates },
                ],
            },
            data: {
                notification_status: 'sending',
                notification_attempts: { increment: 1 },
                notification_last_attempt_at: claimedAt,
                notification_lease_expires_at: new Date(claimedAt.getTime() + leaseMs),
                notification_lease_token: leaseToken,
                notification_error_code: null,
                notification_error_message: null,
            },
        })

        if (result.count === 1) {
            const claimed = await definition.delegate.findUnique({
                where: { id },
                ...(definition.include ? { include: definition.include } : {}),
            })
            if (!claimed) {
                throw new NotificationRecoveryError(404, 'REQUEST_NOT_FOUND', 'Request not found.')
            }
            return { leaseToken, claimedAt, request: claimed }
        }

        const current = await readRequest(definition, id)
        if (!current) {
            throw new NotificationRecoveryError(404, 'REQUEST_NOT_FOUND', 'Request not found.')
        }
        const leaseActive = current.notification_lease_expires_at
            && current.notification_lease_expires_at > claimedAt
        if (leaseActive) {
            throw new NotificationRecoveryError(409, 'NOTIFICATION_RETRY_IN_PROGRESS', 'A notification attempt is already active.')
        }
        if (current.notification_status === 'sent') {
            throw new NotificationRecoveryError(409, 'NOTIFICATION_NOT_RETRYABLE', 'This notification has already been accepted by SMTP.')
        }
        if (current.notification_status === 'unknown' && !confirmUnknownDelivery) {
            throw new NotificationRecoveryError(409, 'UNKNOWN_DELIVERY_CONFIRMATION_REQUIRED', 'Explicit confirmation is required to resend a notification with unknown delivery.')
        }
        throw new NotificationRecoveryError(409, 'NOTIFICATION_NOT_RETRYABLE', 'This notification is not eligible for retry.')
    }

    const finalizeAttempt = async (definition, id, leaseToken, outcome, error) => {
        const finishedAt = now()
        const isUnknown = outcome === 'unknown'
        const message = isUnknown
            ? 'SMTP outcome is ambiguous; duplicate delivery is possible.'
            : 'The SMTP server did not accept the notification.'
        const data = {
            notification_status: outcome,
            notification_lease_expires_at: isUnknown
                ? new Date(finishedAt.getTime() + cooldownMs)
                : null,
            notification_lease_token: null,
            notification_error_code: outcome === 'sent' ? null : safeCode(error, outcome),
            notification_error_message: outcome === 'sent' ? null : message,
            ...(outcome === 'sent' ? { notification_sent_at: finishedAt } : {}),
        }
        const result = await definition.delegate.updateMany({
            where: { id, notification_lease_token: leaseToken },
            data,
        })

        if (result.count !== 1) {
            logger.error('Notification attempt lost ownership before finalization', {
                event: 'notification_attempt_stale',
                outcome,
            })
            const current = await readRequest(definition, id)
            return {
                success: false,
                stale: true,
                status: current?.notification_status || 'unknown',
                attempts: current?.notification_attempts || 0,
                lastAttemptAt: current?.notification_last_attempt_at || null,
                sentAt: current?.notification_sent_at || null,
                errorMessage: current?.notification_error_message || null,
                leaseExpiresAt: current?.notification_lease_expires_at || null,
                errorCode: 'NOTIFICATION_ATTEMPT_OWNERSHIP_LOST',
            }
        }

        const updated = await readRequest(definition, id)
        return {
            success: outcome === 'sent',
            stale: false,
            status: outcome,
            attempts: updated?.notification_attempts || 0,
            lastAttemptAt: updated?.notification_last_attempt_at || finishedAt,
            sentAt: updated?.notification_sent_at || null,
            errorCode: updated?.notification_error_code || null,
            errorMessage: updated?.notification_error_message || null,
            leaseExpiresAt: updated?.notification_lease_expires_at || null,
        }
    }

    const runAttempt = async ({
        type,
        id,
        initial = false,
        confirmUnknownDelivery = false,
        actorId = null,
    }) => {
        const definition = getDefinition(type)
        const startedAt = now()
        const claim = await claimAttempt(definition, id, { initial, confirmUnknownDelivery })
        let outcome = 'sent'
        let sendError = null

        try {
            await definition.send(claim.request)
        } catch (error) {
            sendError = error
            outcome = classifyEmailOutcome(error)
        }

        const result = await finalizeAttempt(definition, id, claim.leaseToken, outcome, sendError)
        const log = outcome === 'sent' ? logger.info : logger.error
        log.call(logger, 'Request notification attempt completed', {
            event: 'request_notification_attempt_completed',
            requestType: type.toUpperCase(),
            requestId: id,
            attempt: result.attempts,
            outcome: result.stale ? 'unknown' : outcome,
            durationMs: Math.max(0, now().getTime() - startedAt.getTime()),
            ...(sendError ? {
                errorCode: safeCode(sendError, outcome),
                errorName: /^[A-Za-z0-9_$]{1,64}$/.test(String(sendError.name || ''))
                    ? sendError.name
                    : 'Error',
            } : {}),
            ...(actorId ? { actorId } : {}),
        })
        return result
    }

    return {
        attemptInitial: (type, id) => runAttempt({ type, id, initial: true }),
        retry: (type, id, options = {}) => runAttempt({
            type,
            id,
            confirmUnknownDelivery: options.confirmUnknownDelivery === true,
            actorId: options.actorId || null,
        }),
    }
}

const productionService = createNotificationRecoveryService({
    delegates: {
        visitRequest: prisma.visitRequest,
        quoteRequest: prisma.quoteRequest,
        bOQRequest: prisma.bOQRequest,
    },
})

export const attemptInitialNotification = productionService.attemptInitial
export const retryNotification = productionService.retry
