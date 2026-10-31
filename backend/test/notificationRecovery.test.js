import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
    classifyEmailOutcome,
    createNotificationRecoveryService,
    NotificationRecoveryError,
} from '../src/modules/notifications/notificationRecovery.service.js'

const createHarness = (initialState = {}, send = async () => {}) => {
    let currentTime = new Date('2026-06-16T12:00:00.000Z')
    let tokenSequence = 0
    const calls = []
    const record = {
        id: 'request-1',
        email: 'private@example.invalid',
        name: 'Private Customer',
        notification_status: 'pending',
        notification_attempts: 0,
        notification_error_code: null,
        notification_error_message: null,
        notification_last_attempt_at: null,
        notification_lease_expires_at: null,
        notification_lease_token: null,
        notification_sent_at: null,
        ...initialState,
    }

    const delegate = {
        async updateMany({ where, data }) {
            calls.push({ where, data })
            if (where.notification_lease_token !== undefined) {
                if (record.id !== where.id || record.notification_lease_token !== where.notification_lease_token) {
                    return { count: 0 }
                }
                Object.assign(record, data)
                return { count: 1 }
            }

            if (record.id !== where.id) return { count: 0 }
            const [leaseCondition, statusCondition] = where.AND
            const leaseExpired = leaseCondition.OR.some((condition) =>
                condition.notification_lease_expires_at === null
                    ? record.notification_lease_expires_at === null
                    : record.notification_lease_expires_at
                        && record.notification_lease_expires_at <= condition.notification_lease_expires_at.lte
            )
            const statusMatches = statusCondition.OR.some((condition) => {
                if (typeof condition.notification_status === 'string') {
                    return condition.notification_status === record.notification_status
                }
                return condition.notification_status.in.includes(record.notification_status)
            })
            if (!leaseExpired || !statusMatches) return { count: 0 }
            record.notification_status = data.notification_status
            record.notification_attempts += data.notification_attempts.increment
            record.notification_last_attempt_at = data.notification_last_attempt_at
            record.notification_lease_expires_at = data.notification_lease_expires_at
            record.notification_lease_token = data.notification_lease_token
            record.notification_error_code = data.notification_error_code
            record.notification_error_message = data.notification_error_message
            return { count: 1 }
        },
        async findUnique({ where }) {
            return record.id === where.id ? { ...record } : null
        },
    }
    const loggerEntries = []
    const logger = {
        info: (...args) => loggerEntries.push(['info', ...args]),
        error: (...args) => loggerEntries.push(['error', ...args]),
    }
    const service = createNotificationRecoveryService({
        delegates: { visitRequest: delegate },
        senders: { visit: send },
        now: () => new Date(currentTime),
        createToken: () => `lease-${++tokenSequence}`,
        leaseMs: 60_000,
        cooldownMs: 5 * 60_000,
        logger,
    })

    return {
        service,
        record,
        calls,
        loggerEntries,
        advance(ms) {
            currentTime = new Date(currentTime.getTime() + ms)
        },
    }
}

test('successful notification records SMTP acceptance and attempt metadata', async () => {
    const harness = createHarness()
    const result = await harness.service.attemptInitial('visit', 'request-1')
    assert.equal(result.success, true)
    assert.equal(result.status, 'sent')
    assert.equal(harness.record.notification_status, 'sent')
    assert.equal(harness.record.notification_attempts, 1)
    assert.equal(harness.record.notification_lease_token, null)
    assert.equal(harness.record.notification_error_message, null)
    assert.equal(classifyEmailOutcome(Object.assign(new Error('timeout'), { code: 'EMAIL_TIMEOUT' })), 'unknown')
    assert.equal(classifyEmailOutcome(Object.assign(new Error('auth failure'), { code: 'EAUTH' })), 'failed')
    assert.equal(harness.loggerEntries[0][2].event, 'request_notification_attempt_completed')
})

test('definitive SMTP failure is persisted with safe details', async () => {
    const harness = createHarness({}, async () => {
        throw Object.assign(new Error('contains private SMTP response'), { code: 'EAUTH' })
    })
    const result = await harness.service.attemptInitial('visit', 'request-1')

    assert.equal(result.success, false)
    assert.equal(harness.record.notification_status, 'failed')
    assert.equal(harness.record.notification_attempts, 1)
    assert.equal(harness.record.notification_error_code, 'EAUTH')
    assert.equal(harness.record.notification_error_message, 'The SMTP server did not accept the notification.')
    assert.equal(JSON.stringify(harness.loggerEntries).includes('private SMTP response'), false)
    assert.equal(JSON.stringify(harness.loggerEntries).includes('private@example.invalid'), false)
})

test('failed manual retry increments attempts and preserves the request', async () => {
    const harness = createHarness({}, async () => {
        throw Object.assign(new Error('private SMTP response'), { code: 'SMTP_UNAVAILABLE' })
    })

    await harness.service.attemptInitial('visit', 'request-1')
    const retried = await harness.service.retry('visit', 'request-1')

    assert.equal(retried.success, false)
    assert.equal(harness.record.id, 'request-1')
    assert.equal(harness.record.notification_status, 'failed')
    assert.equal(harness.record.notification_attempts, 2)
    assert.equal(harness.record.notification_error_code, 'SMTP_UNAVAILABLE')
    assert.equal(harness.record.notification_lease_token, null)
})

test('ambiguous delivery requires confirmation and honors the cooldown lease', async () => {
    let sendCount = 0
    const harness = createHarness({}, async () => {
        sendCount += 1
        if (sendCount === 1) {
            throw Object.assign(new Error('private timeout detail'), { code: 'EMAIL_TIMEOUT' })
        }
    })

    const first = await harness.service.attemptInitial('visit', 'request-1')
    assert.equal(first.status, 'unknown')
    assert.equal(harness.record.notification_status, 'unknown')
    assert.ok(harness.record.notification_lease_expires_at)
    assert.equal(harness.record.notification_error_message, 'SMTP outcome is ambiguous; duplicate delivery is possible.')
    await assert.rejects(
        harness.service.retry('visit', 'request-1'),
        (error) => error instanceof NotificationRecoveryError
            && error.code === 'NOTIFICATION_RETRY_IN_PROGRESS'
    )

    harness.advance(5 * 60_000)
    const retried = await harness.service.retry('visit', 'request-1', {
        confirmUnknownDelivery: true,
    })
    assert.equal(retried.success, true)
    assert.equal(harness.record.notification_status, 'sent')
    assert.equal(harness.record.notification_attempts, 2)
})

test('atomic notification lease rejects concurrent retry attempts', async () => {
    let releaseFirstSend
    let markFirstStarted
    const firstStarted = new Promise((resolve) => { markFirstStarted = resolve })
    const firstSendGate = new Promise((resolve) => { releaseFirstSend = resolve })
    const harness = createHarness({}, async () => {
        if (harness.record.notification_attempts === 1) {
            markFirstStarted()
            await firstSendGate
        }
    })

    const first = harness.service.retry('visit', 'request-1')
    await firstStarted
    await assert.rejects(
        harness.service.retry('visit', 'request-1'),
        (error) => error instanceof NotificationRecoveryError
            && error.code === 'NOTIFICATION_RETRY_IN_PROGRESS'
    )
    releaseFirstSend()
    assert.equal((await first).success, true)
    assert.equal(harness.record.notification_attempts, 1)
})

test('expired lease can be reclaimed and stale attempts cannot overwrite the new owner', async () => {
    let firstSendCount = 0
    let releaseFirstSend
    let markFirstStarted
    const firstStarted = new Promise((resolve) => { markFirstStarted = resolve })
    const firstSendGate = new Promise((resolve) => { releaseFirstSend = resolve })
    const harness = createHarness({}, async () => {
        firstSendCount += 1
        if (firstSendCount === 1) {
            markFirstStarted()
            await firstSendGate
        }
    })

    const first = harness.service.retry('visit', 'request-1')
    await firstStarted
    harness.advance(60_001)
    const second = await harness.service.retry('visit', 'request-1')
    assert.equal(second.success, true)
    releaseFirstSend()
    const stale = await first
    assert.equal(stale.stale, true)
    assert.equal(harness.record.notification_status, 'sent')
    assert.equal(harness.record.notification_attempts, 2)
    assert.ok(harness.loggerEntries.some((entry) =>
        entry[2]?.event === 'notification_attempt_stale'
    ))
})

test('missing and non-retryable notifications return explicit conflicts', async () => {
    const harness = createHarness({ notification_status: 'sent' })
    await assert.rejects(
        harness.service.retry('visit', 'missing'),
        (error) => error instanceof NotificationRecoveryError && error.status === 404
    )
    await assert.rejects(
        harness.service.retry('visit', 'request-1'),
        (error) => error instanceof NotificationRecoveryError
            && error.code === 'NOTIFICATION_NOT_RETRYABLE'
    )
})
