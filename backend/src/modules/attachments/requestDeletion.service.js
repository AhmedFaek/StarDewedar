import { randomUUID } from 'node:crypto'
import cloudinary from '../../config/storage.js'
import prisma from '../../utils/prisma.js'

const STALE_PROCESSING_MS = 5 * 60 * 1000
const CLEANUP_ERROR = {
    ASSET_STILL_REFERENCED: 'Asset is still referenced by another active record.',
    REFERENCE_CHECK_FAILED: 'Asset references could not be verified; cleanup was not attempted.',
    CLOUDINARY_UNCONFIRMED_RESULT: 'Cloudinary did not confirm asset deletion.',
    CLOUDINARY_REQUEST_FAILED: 'Cloudinary deletion request failed.',
}

const requestDefinitions = {
    QUOTE: { delegate: 'quoteRequest' },
    VISIT: { delegate: 'visitRequest' },
    BOQ: { delegate: 'bOQRequest' },
}

const legacyUrlDefinitions = [
    { delegate: 'quoteRequest', type: 'QUOTE', fields: ['file_url', 'custom_image_url'] },
    { delegate: 'visitRequest', type: 'VISIT', fields: ['file_url'] },
    { delegate: 'bOQRequest', type: 'BOQ', fields: ['boq_file_url', 'supporting_docs_urls'] },
    { delegate: 'productImage', fields: ['image_url'] },
    { delegate: 'projectImage', fields: ['image_url'] },
    { delegate: 'productCatalog', fields: ['file_url'] },
]

const createError = (status, code, message) =>
    Object.assign(new Error(message), { status, code })

const urlContainsAsset = (value, asset) => {
    if (typeof value !== 'string') return false

    let decodedValue = value
    try {
        decodedValue = decodeURIComponent(value)
    } catch {
        // Keep the original URL when it contains malformed percent-encoding.
    }

    return decodedValue.includes(`/${asset.resource_type}/${asset.delivery_type}/`) &&
        decodedValue.includes(asset.public_id)
}

const getSearchValues = (publicId) =>
    [...new Set([publicId, encodeURI(publicId), encodeURIComponent(publicId)])]

const isReferencedOutsideRequest = async (client, asset, excludedAttachmentIds, requestType, requestId) => {
    const anotherAttachment = await client.attachment.findFirst({
        where: {
            id: { notIn: excludedAttachmentIds },
            public_id: asset.public_id,
            resource_type: asset.resource_type,
            delivery_type: asset.delivery_type,
            status: { not: 'DELETED' },
        },
        select: { id: true },
    })
    if (anotherAttachment) return true

    const searchValues = getSearchValues(asset.public_id)
    for (const definition of legacyUrlDefinitions) {
        const delegate = client[definition.delegate]
        const where = {
            OR: definition.fields.flatMap((field) =>
                searchValues.map((value) => ({ [field]: { contains: value } }))
            ),
        }

        if (definition.type === requestType) {
            where.id = { not: requestId }
        }

        const references = await delegate.findMany({
            where,
            select: Object.fromEntries(definition.fields.map((field) => [field, true])),
        })

        if (references.some((record) =>
            definition.fields.some((field) => urlContainsAsset(record[field], asset))
        )) {
            return true
        }
    }

    return false
}

const cleanupOperationKey = ({ public_id, resource_type, delivery_type }) => ({
    public_id_resource_type_delivery_type: {
        public_id,
        resource_type,
        delivery_type,
    },
})

export const toCleanupOperationDto = (operation) => ({
    id: operation.id,
    request_type: operation.request_type,
    request_id: operation.request_id,
    status: operation.status,
    attempt_count: operation.attempt_count,
    last_error: operation.last_error,
    created_at: operation.created_at,
    updated_at: operation.updated_at,
    completed_at: operation.completed_at,
    attachment: operation.attachment
        ? {
            original_filename: operation.attachment.original_filename,
            mime_type: operation.attachment.mime_type,
            file_size: operation.attachment.file_size,
        }
        : null,
})

export const createRequestDeletionService = ({
    database = prisma,
    cloudinaryClient = cloudinary,
    now = () => new Date(),
    createClaimToken = randomUUID,
    logger = console,
} = {}) => {
    const finalizeCleanup = async (operation, claimToken, status, lastError = null) =>
        database.$transaction(async (transaction) => {
            const completedAt = status === 'COMPLETED' ? now() : null
            const result = await transaction.cloudinaryCleanupOperation.updateMany({
                where: {
                    id: operation.id,
                    status: 'PROCESSING',
                    processing_token: claimToken,
                },
                data: {
                    status,
                    processing_token: null,
                    last_error: lastError,
                    completed_at: completedAt,
                },
            })

            if (result.count > 0 && operation.attachment_id) {
                await transaction.attachment.updateMany({
                    where: { id: operation.attachment_id },
                    data: {
                        status: status === 'COMPLETED' ? 'DELETED' : 'CLEANUP_FAILED',
                    },
                })
            }

            return transaction.cloudinaryCleanupOperation.findUnique({
                where: { id: operation.id },
                include: {
                    attachment: {
                        select: {
                            original_filename: true,
                            mime_type: true,
                            file_size: true,
                        },
                    },
                },
            })
        })

    const executeCleanupOperation = async (operationId, { conflictOnProcessing = false } = {}) => {
        const initial = await database.cloudinaryCleanupOperation.findUnique({
            where: { id: operationId },
            include: {
                attachment: {
                    select: {
                        id: true,
                        original_filename: true,
                        mime_type: true,
                        file_size: true,
                    },
                },
            },
        })
        if (!initial) {
            throw createError(404, 'CLEANUP_OPERATION_NOT_FOUND', 'Cleanup operation not found.')
        }
        if (initial.status === 'COMPLETED') return initial

        const claimToken = createClaimToken()
        const staleBefore = new Date(now().getTime() - STALE_PROCESSING_MS)
        const claim = await database.cloudinaryCleanupOperation.updateMany({
            where: {
                id: operationId,
                OR: [
                    { status: { in: ['PENDING', 'FAILED'] } },
                    { status: 'PROCESSING', updated_at: { lte: staleBefore } },
                ],
            },
            data: {
                status: 'PROCESSING',
                processing_token: claimToken,
                attempt_count: { increment: 1 },
                last_error: null,
                completed_at: null,
            },
        })

        if (claim.count === 0) {
            const current = await database.cloudinaryCleanupOperation.findUnique({
                where: { id: operationId },
                include: {
                    attachment: {
                        select: {
                            id: true,
                            original_filename: true,
                            mime_type: true,
                            file_size: true,
                        },
                    },
                },
            })
            if (!current) {
                throw createError(404, 'CLEANUP_OPERATION_NOT_FOUND', 'Cleanup operation not found.')
            }
            if (current.status === 'COMPLETED' || !conflictOnProcessing) return current
            throw createError(409, 'CLEANUP_OPERATION_IN_PROGRESS', 'Cleanup operation is already in progress.')
        }

        const operation = await database.cloudinaryCleanupOperation.findUnique({
            where: { id: operationId },
            include: {
                attachment: {
                    select: {
                        id: true,
                        original_filename: true,
                        mime_type: true,
                        file_size: true,
                    },
                },
            },
        })

        const asset = {
            public_id: operation.public_id,
            resource_type: operation.resource_type,
            delivery_type: operation.delivery_type,
        }
        let sharedReference
        try {
            sharedReference = await isReferencedOutsideRequest(
                database,
                asset,
                operation.attachment_id ? [operation.attachment_id] : [],
                operation.request_type,
                operation.request_id
            )
        } catch (error) {
            logger.error('Cloudinary cleanup reference check failed', {
                event: 'cloudinary_cleanup_reference_check_failed',
                operationId: operation.id,
                errorName: error?.name || 'Error',
            })
            return finalizeCleanup(
                operation,
                claimToken,
                'FAILED',
                CLEANUP_ERROR.REFERENCE_CHECK_FAILED
            )
        }

        if (sharedReference) {
            return finalizeCleanup(
                operation,
                claimToken,
                'FAILED',
                CLEANUP_ERROR.ASSET_STILL_REFERENCED
            )
        }

        let response
        try {
            response = await cloudinaryClient.uploader.destroy(asset.public_id, {
                resource_type: asset.resource_type,
                type: asset.delivery_type,
                invalidate: true,
            })
        } catch (error) {
            logger.error('Cloudinary deletion request failed', {
                event: 'cloudinary_cleanup_request_failed',
                operationId: operation.id,
                errorName: error?.name || 'Error',
                errorCode: typeof error?.http_code === 'number'
                    ? `HTTP_${error.http_code}`
                    : 'CLOUDINARY_REQUEST_FAILED',
            })
            return finalizeCleanup(
                operation,
                claimToken,
                'FAILED',
                CLEANUP_ERROR.CLOUDINARY_REQUEST_FAILED
            )
        }

        if (response?.result === 'ok' || response?.result === 'not found') {
            return finalizeCleanup(operation, claimToken, 'COMPLETED')
        }

        logger.error('Cloudinary deletion was not confirmed', {
            event: 'cloudinary_cleanup_unconfirmed',
            operationId: operation.id,
        })
        return finalizeCleanup(
            operation,
            claimToken,
            'FAILED',
            CLEANUP_ERROR.CLOUDINARY_UNCONFIRMED_RESULT
        )
    }

    const deleteRequest = async (requestType, requestId, confirmation) => {
        const definition = requestDefinitions[requestType]
        if (!definition) {
            throw createError(400, 'INVALID_REQUEST_TYPE', 'Unsupported request type.')
        }
        if (confirmation !== 'DELETE') {
            throw createError(400, 'DELETE_CONFIRMATION_REQUIRED', 'Type DELETE to confirm permanent deletion.')
        }

        const operationIds = await database.$transaction(async (transaction) => {
            const delegate = transaction[definition.delegate]
            const request = await delegate.findUnique({
                where: { id: requestId },
                include: { attachments: true },
            })
            if (!request) {
                throw createError(404, 'REQUEST_NOT_FOUND', 'Request not found.')
            }

            const attachments = request.attachments || []
            const attachmentIds = attachments.map(({ id }) => id)
            const operationIdsForRequest = []

            for (const attachment of attachments) {
                await transaction.emailAttachmentAccessToken.updateMany({
                    where: { attachment_id: attachment.id, revoked_at: null },
                    data: { revoked_at: now() },
                })

                const asset = {
                    public_id: attachment.public_id,
                    resource_type: attachment.resource_type,
                    delivery_type: attachment.delivery_type,
                }
                const existing = await transaction.cloudinaryCleanupOperation.findUnique({
                    where: cleanupOperationKey(asset),
                })

                if (attachment.status === 'DELETED' || existing?.status === 'COMPLETED') {
                    await transaction.attachment.updateMany({
                        where: { id: attachment.id },
                        data: { status: 'DELETED' },
                    })
                    continue
                }

                const sharedReference = await isReferencedOutsideRequest(
                    transaction,
                    asset,
                    attachmentIds,
                    requestType,
                    requestId
                )
                const operation = await transaction.cloudinaryCleanupOperation.upsert({
                    where: cleanupOperationKey(asset),
                    create: {
                        attachment_id: attachment.id,
                        request_type: requestType,
                        request_id: requestId,
                        ...asset,
                        status: sharedReference ? 'FAILED' : 'PENDING',
                        last_error: sharedReference ? CLEANUP_ERROR.ASSET_STILL_REFERENCED : null,
                    },
                    update: {},
                })

                await transaction.attachment.updateMany({
                    where: { id: attachment.id },
                    data: {
                        status: sharedReference ? 'CLEANUP_FAILED' : 'PENDING_DELETION',
                    },
                })
                operationIdsForRequest.push(operation.id)
            }

            await delegate.delete({ where: { id: requestId } })
            return operationIdsForRequest
        })

        const operations = await Promise.all(
            operationIds.map((id) => executeCleanupOperation(id))
        )

        return {
            request_deleted: true,
            cleanup_operations: operations.map(toCleanupOperationDto),
        }
    }

    const listCleanupOperations = async ({ status, take = 50, skip = 0 } = {}) => {
        const allowedStatuses = ['PENDING', 'PROCESSING', 'FAILED', 'COMPLETED']
        if (status && !allowedStatuses.includes(status)) {
            throw createError(400, 'INVALID_CLEANUP_STATUS', 'Invalid cleanup status.')
        }

        const operations = await database.cloudinaryCleanupOperation.findMany({
            where: status
                ? { status }
                : { status: { in: ['PENDING', 'PROCESSING', 'FAILED'] } },
            orderBy: { updated_at: 'desc' },
            take: Math.min(100, Math.max(1, Number(take) || 50)),
            skip: Math.max(0, Number(skip) || 0),
            include: {
                attachment: {
                    select: {
                        original_filename: true,
                        mime_type: true,
                        file_size: true,
                    },
                },
            },
        })

        return operations.map(toCleanupOperationDto)
    }

    return {
        deleteRequest,
        executeCleanupOperation,
        listCleanupOperations,
    }
}

const requestDeletionService = createRequestDeletionService()

export const deleteRequestWithCleanup = (...args) =>
    requestDeletionService.deleteRequest(...args)
export const retryCleanupOperation = (id) =>
    requestDeletionService.executeCleanupOperation(id, { conflictOnProcessing: true })
export const getCleanupOperations = (options) =>
    requestDeletionService.listCleanupOperations(options)
