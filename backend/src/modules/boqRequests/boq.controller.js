import * as service from './boq.service.js'
import { createBOQRequestSchema } from './boq.validation.js'
import { getPaginationParams } from '../../utils/pagination.js'

export const createBOQ = async (req, res) => {
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
        const boqRequest = await service.createBOQRequest(validatedData, boqFiles, supportingFiles || [])

        res.status(201).json({
            success: true,
            message: 'BOQ request created successfully',
            data: boqRequest,
        })
    } catch (error) {
        console.error('Error creating BOQ request:', error)
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create BOQ request',
        })
    }
}

export const getBOQs = async (req, res) => {
    try {
        const { take, skip } = getPaginationParams(req.query)
        const boqs = await service.getBOQRequests({ take, skip })
        res.status(200).json({ success: true, data: boqs })
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

        res.status(200).json({ success: true, data: boq })
    } catch (error) {
        console.error('Error fetching BOQ:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch BOQ request' })
    }
}

export const getBOQsByEmail = async (req, res) => {
    try {
        const { email } = req.params
        const boqs = await service.getBOQsByEmail(email)
        res.status(200).json({ success: true, data: boqs })
    } catch (error) {
        console.error('Error fetching BOQs by email:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch BOQ requests' })
    }
}

export const getBOQsByStatus = async (req, res) => {
    try {
        const { status } = req.params
        const boqs = await service.getBOQsByStatus(status)
        res.status(200).json({ success: true, data: boqs })
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
            data: boq,
        })
    } catch (error) {
        console.error('Error updating BOQ:', error)
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update BOQ request',
        })
    }
}

export const deleteBOQ = async (req, res) => {
    try {
        const { id } = req.params
        await service.deleteBOQRequest(id)

        res.status(200).json({ success: true, message: 'BOQ request deleted successfully' })
    } catch (error) {
        console.error('Error deleting BOQ:', error)
        res.status(500).json({ success: false, message: 'Failed to delete BOQ request' })
    }
}
