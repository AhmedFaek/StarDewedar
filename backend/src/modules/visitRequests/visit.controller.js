import * as service from './visit.service.js'
import { createVisitRequestSchema } from './visit.validation.js'
import { getPaginationParams } from '../../utils/pagination.js'
import { validateUploadedFile } from '../../utils/uploadValidation.js'
import { sendPublicRequestError } from '../../utils/publicRequestError.js'
import { toAdminRequest, toPublicRequest } from '../../utils/publicRequestDto.js'
import { validateAndNormalizeRequestEmail } from '../../utils/publicRequestEmail.js'
import { normalizeEmail } from '../../utils/emailValidation.service.js'
import {
    PUBLIC_REQUEST_SUCCESS_MESSAGES,
    respondToPublicRequestHoneypot,
} from '../../utils/publicRequestProtection.js'

export const createVisit = async (req, res) => {
    if (respondToPublicRequestHoneypot(req, res, 'VISIT')) return

    try {
        const validatedData = createVisitRequestSchema.parse(req.body)
        if (req.file) await validateUploadedFile(req.file)
        const normalizedData = await validateAndNormalizeRequestEmail(validatedData)
        const visit = await service.createVisitRequest(normalizedData, req.file)
        res.status(201).json({
            success: true,
            message: PUBLIC_REQUEST_SUCCESS_MESSAGES.VISIT,
            data: toPublicRequest(visit),
        })
    } catch (error) {
        sendPublicRequestError(res, error, 'VISIT')
    }
}

export const getVisits = async (req, res) => {
    try {
        const { take, skip } = getPaginationParams(req.query)
        const visits = await service.getVisitRequests({
            take,
            skip,
            archived: req.requestArchived,
        })
        res.status(200).json({
            success: true,
            data: visits.map(toAdminRequest),
        })
    } catch (error) {
        console.error('Error fetching visit requests:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch visit requests',
        })
    }
}

export const getVisitById = async (req, res) => {
    try {
        const { id } = req.params
        const visit = await service.getVisitRequestById(id)

        if (!visit) {
            return res.status(404).json({
                success: false,
                message: 'Visit request not found',
            })
        }

        res.status(200).json({
            success: true,
            data: toAdminRequest(visit),
        })
    } catch (error) {
        console.error('Error fetching visit:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch visit request',
        })
    }
}

export const getVisitsByEmail = async (req, res) => {
    try {
        const { email } = req.params
        const visits = await service.getVisitRequestsByEmail(normalizeEmail(email), req.requestArchived)

        res.status(200).json({
            success: true,
            data: visits.map(toAdminRequest),
        })
    } catch (error) {
        console.error('Error fetching visits by email:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch visit requests',
        })
    }
}

export const getVisitsByStatus = async (req, res) => {
    try {
        const { status } = req.params
        const visits = await service.getVisitRequestsByStatus(status, req.requestArchived)

        res.status(200).json({
            success: true,
            data: visits.map(toAdminRequest),
        })
    } catch (error) {
        console.error('Error fetching visits by status:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch visit requests',
        })
    }
}

export const updateVisit = async (req, res) => {
    try {
        const { id } = req.params
        const visit = await service.updateVisitRequest(id, req.body)

        res.status(200).json({
            success: true,
            message: 'Visit request updated successfully',
            data: toAdminRequest(visit),
        })
    } catch (error) {
        console.error('Error updating visit:', error)
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update visit request',
        })
    }
}

export const deleteVisit = async (req, res, next) => {
    try {
        const { id } = req.params
        const result = await service.deleteVisitRequest(id, req.body.confirmation)
        const cleanupPending = result.cleanup_operations.some(
            (operation) => operation.status !== 'COMPLETED'
        )

        res.status(cleanupPending ? 202 : 200).json({
            success: true,
            message: cleanupPending
                ? 'Visit request deleted; attachment cleanup requires attention.'
                : 'Visit request deleted successfully',
            data: result,
        })
    } catch (error) {
        next(error)
    }
}
