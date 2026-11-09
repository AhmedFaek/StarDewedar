import * as service from './boq.service.js'
import { createBOQRequestSchema } from './boq.validation.js'
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

export const createBOQ = async (req, res) => {
    if (respondToPublicRequestHoneypot(req, res, 'BOQ')) return

    try {
        // req.files is populated by boqUpload.fields([...])
        const boqFiles      = req.files?.['boq_file']
        const supportingFiles = req.files?.['supporting_docs']

        if (!boqFiles || boqFiles.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'BOQ file is required.',
            })
        }

        const validatedData = createBOQRequestSchema.parse(req.body)
        await validateUploadedFile(boqFiles[0], { boq: true })
        for (const file of supportingFiles || []) {
            await validateUploadedFile(file, { boq: true })
        }
        const normalizedData = await validateAndNormalizeRequestEmail(validatedData)
        const requestData = req.user?.role === 'customer'
            ? { ...normalizedData, user_id: req.user.userId }
            : normalizedData
        const boqRequest = await service.createBOQRequest(requestData, boqFiles, supportingFiles || [])

        res.status(201).json({
            success: true,
            message: PUBLIC_REQUEST_SUCCESS_MESSAGES.BOQ,
            data: toPublicRequest(boqRequest),
        })
    } catch (error) {
        sendPublicRequestError(res, error, 'BOQ')
    }
}

export const getBOQs = async (req, res) => {
    try {
        const { take, skip } = getPaginationParams(req.query)
        const boqs = await service.getBOQRequests({
            take,
            skip,
            archived: req.requestArchived,
        })
        res.status(200).json({ success: true, data: boqs.map(toAdminRequest) })
    } catch (error) {
        console.error('Error fetching BOQ requests:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch BOQ requests' })
    }
}

export const getBOQById = async (req, res) => {
    try {
        const { id } = req.params
        const boq = await service.getBOQRequestById(id)

        if (!boq) {
            return res.status(404).json({ success: false, message: 'BOQ request not found' })
        }

        res.status(200).json({ success: true, data: toAdminRequest(boq) })
    } catch (error) {
        console.error('Error fetching BOQ:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch BOQ request' })
    }
}

export const getBOQsByEmail = async (req, res) => {
    try {
        const { email } = req.params
        const boqs = await service.getBOQsByEmail(normalizeEmail(email), req.requestArchived)
        res.status(200).json({ success: true, data: boqs.map(toAdminRequest) })
    } catch (error) {
        console.error('Error fetching BOQs by email:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch BOQ requests' })
    }
}

export const getBOQsByStatus = async (req, res) => {
    try {
        const { status } = req.params
        const boqs = await service.getBOQsByStatus(status, req.requestArchived)
        res.status(200).json({ success: true, data: boqs.map(toAdminRequest) })
    } catch (error) {
        console.error('Error fetching BOQs by status:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch BOQ requests' })
    }
}

export const updateBOQ = async (req, res) => {
    try {
        const { id } = req.params
        const boq = await service.updateBOQRequest(id, req.body)

        res.status(200).json({
            success: true,
            message: 'BOQ request updated successfully',
            data: toAdminRequest(boq),
        })
    } catch (error) {
        console.error('Error updating BOQ:', error)
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update BOQ request',
        })
    }
}

export const deleteBOQ = async (req, res, next) => {
    try {
        const { id } = req.params
        const result = await service.deleteBOQRequest(id, req.body.confirmation)
        const cleanupPending = result.cleanup_operations.some(
            (operation) => operation.status !== 'COMPLETED'
        )

        res.status(cleanupPending ? 202 : 200).json({
            success: true,
            message: cleanupPending
                ? 'BOQ request deleted; attachment cleanup requires attention.'
                : 'BOQ request deleted successfully',
            data: result,
        })
    } catch (error) {
        next(error)
    }
}
