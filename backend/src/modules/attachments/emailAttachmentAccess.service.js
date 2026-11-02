import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import env from '../../config/env.js'
import { createSignedAttachmentDownloadUrl } from './attachment.service.js'
import * as repository from './emailAttachmentAccess.repository.js'

const EMAIL_ACCESS_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000
const CLOUDINARY_DOWNLOAD_TTL_SECONDS = 5 * 60
const HASH_PATTERN = /^[a-f0-9]{64}$/
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/

const hashToken = (token) =>
    createHash('sha256').update(token, 'utf8').digest('hex')

const getApiBaseUrl = () => {
    const configuredApiUrl = typeof env.apiPublicUrl === 'string'
        ? env.apiPublicUrl.trim()
        : ''
    let url
    try {
        url = new URL(configuredApiUrl)
    } catch {
        throw Object.assign(
            new Error('Company attachment links require API_PUBLIC_URL'),
            { code: 'API_PUBLIC_URL_NOT_CONFIGURED' }
        )
    }

    if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        (env.nodeEnv === 'production' && url.protocol !== 'https:')
    ) {
        throw Object.assign(
            new Error('API_PUBLIC_URL must be a public HTTP(S) API base URL'),
            { code: 'API_PUBLIC_URL_INVALID' }
        )
    }

    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`
}

const getTokenOwnerKey = (requestType) => ({
    QUOTE: 'quote_request_id',
    VISIT: 'visit_request_id',
    BOQ: 'boq_request_id',
})[requestType]

const getAttachmentLabel = (requestType, attachment, index) => {
    if (requestType === 'VISIT') return 'Uploaded Site / Project Document'
    if (requestType === 'QUOTE') return 'Uploaded Spec / Document'
    if (attachment.public_id.startsWith('boq/documents/')) {
        return 'BOQ Main Document'
    }
    return `Supporting Document ${index + 1}`
}

export const createCompanyEmailAttachmentLinks = async ({
    requestType,
    request,
    attempt,
    transactionClient,
    now,
}) => {
    const attachments = Array.isArray(request.attachments)
        ? request.attachments.filter((attachment) =>
            attachment?.id &&
            typeof attachment.original_filename === 'string' &&
            typeof attachment.public_id === 'string'
        )
        : []

    if (attachments.length === 0) return []

    if (!transactionClient?.emailAttachmentAccessToken) {
        throw Object.assign(
            new Error('Email attachment token persistence is unavailable'),
            { code: 'EMAIL_ATTACHMENT_TOKEN_PERSISTENCE_UNAVAILABLE' }
        )
    }

    const apiBaseUrl = getApiBaseUrl()
    const issuedAt = new Date(now)
    const expiresAt = new Date(issuedAt.getTime() + EMAIL_ACCESS_TOKEN_TTL_MS)
    const ownerKey = getTokenOwnerKey(requestType.toUpperCase())
    if (!ownerKey) {
        throw Object.assign(
            new Error('Unsupported request type for email attachment access'),
            { code: 'EMAIL_ATTACHMENT_REQUEST_TYPE_INVALID' }
        )
    }

    let supportingIndex = 0
    const generated = attachments.map((attachment) => {
        const token = randomBytes(32).toString('base64url')
        const labelIndex = requestType.toUpperCase() === 'BOQ' &&
            !attachment.public_id.startsWith('boq/documents/')
            ? supportingIndex++
            : 0
        return {
            token,
            row: {
                attachment_id: attachment.id,
                notification_attempt_id: attempt.id,
                token_hash: hashToken(token),
                issued_at: issuedAt,
                expires_at: expiresAt,
            },
            link: {
                label: getAttachmentLabel(requestType.toUpperCase(), attachment, labelIndex),
                url: `${apiBaseUrl}/attachments/email/${token}`,
            },
        }
    })

    await transactionClient.emailAttachmentAccessToken.createMany({
        data: generated.map(({ row }) => row),
    })

    return generated.map(({ link }) => link)
}

const hasValidRequestAttachmentRelationship = (attachment, attempt) => {
    const ownerKey = getTokenOwnerKey(attempt.request_type)
    return Boolean(
        ownerKey &&
        attachment[ownerKey] === attempt.request_id &&
        [
            attachment.quote_request_id,
            attachment.visit_request_id,
            attachment.boq_request_id,
        ].filter(Boolean).length === 1
    )
}

export const createEmailAttachmentDownloadUrl = async (token, now = new Date()) => {
    if (typeof token !== 'string' || !TOKEN_PATTERN.test(token)) return null

    const tokenHash = hashToken(token)
    const access = await repository.findByTokenHash(tokenHash)
    const storedHash = typeof access?.token_hash === 'string' &&
        HASH_PATTERN.test(access.token_hash)
        ? access.token_hash
        : '0'.repeat(64)
    const hashMatches = timingSafeEqual(
        Buffer.from(tokenHash, 'hex'),
        Buffer.from(storedHash, 'hex')
    )

    if (
        !access ||
        !hashMatches ||
        access.revoked_at ||
        !(new Date(access.expires_at) > now) ||
        !['SENDING', 'SENT', 'UNKNOWN'].includes(access.notification_attempt?.status) ||
        access.attachment?.status !== 'ACTIVE' ||
        !hasValidRequestAttachmentRelationship(access.attachment, access.notification_attempt)
    ) {
        return null
    }

    const expiresAt = Math.floor(now.getTime() / 1000) + CLOUDINARY_DOWNLOAD_TTL_SECONDS
    return createSignedAttachmentDownloadUrl(access.attachment, expiresAt)
}
