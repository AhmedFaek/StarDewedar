import { z } from 'zod'
import {
    NotificationRecoveryError,
    retryNotification,
} from './notificationRecovery.service.js'

const retryBodySchema = z.object({
    confirmUnknownDelivery: z.boolean().optional(),
}).strict()

export const retryRequestNotification = async (req, res, next) => {
    const body = retryBodySchema.safeParse(req.body ?? {})
    if (!body.success) {
        return res.status(400).json({
            success: false,
            code: 'INVALID_RETRY_OPTIONS',
            message: 'Invalid notification retry options.',
        })
    }

    try {
        const result = await retryNotification(
            req.params.requestType.toLowerCase(),
            req.params.requestId,
            {
                confirmUnknownDelivery: body.data.confirmUnknownDelivery,
                actorId: req.user.userId,
            }
        )
        const statusCode = result.success ? 200 : 502
        return res.status(statusCode).json({
            success: result.success,
            code: result.errorCode || undefined,
            message: result.success
                ? 'Notification accepted by the SMTP server.'
                : result.status === 'unknown'
                    ? 'Delivery outcome is unknown; duplicate delivery is possible.'
                    : 'Notification delivery failed.',
            data: {
                status: result.status,
                attempts: result.attempts,
                lastAttemptAt: result.lastAttemptAt || null,
                sentAt: result.sentAt || null,
                errorCode: result.errorCode || null,
                errorMessage: result.errorMessage || null,
                leaseExpiresAt: result.leaseExpiresAt || null,
            },
        })
    } catch (error) {
        if (error instanceof NotificationRecoveryError) {
            return res.status(error.status).json({
                success: false,
                code: error.code,
                message: error.message,
            })
        }
        return next(error)
    }
}
