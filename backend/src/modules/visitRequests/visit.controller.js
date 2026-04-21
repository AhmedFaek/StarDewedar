import * as service from './visit.service.js'
import { createVisitRequestSchema } from './visit.validation.js'

export const createVisit = async (req, res) => {
    try {
        const validatedData = createVisitRequestSchema.parse(req.body)
        const visit = await service.createVisitRequest(validatedData)
        res.status(201).json({
            success: true,
            message: 'Visit request created successfully',
            data: visit,
        })
    } catch (error) {
        console.error('Error creating visit request:', error)
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create visit request',
        })
    }
}

export const getVisits = async (req, res) => {
    try {
        const visits = await service.getVisitRequests()
        res.status(200).json({
            success: true,
            data: visits,
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
            data: visit,
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
        const visits = await service.getVisitRequestsByEmail(email)

        res.status(200).json({
            success: true,
            data: visits,
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
        const visits = await service.getVisitRequestsByStatus(status)

        res.status(200).json({
            success: true,
            data: visits,
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
            data: visit,
        })
    } catch (error) {
        console.error('Error updating visit:', error)
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update visit request',
        })
    }
}

export const deleteVisit = async (req, res) => {
    try {
        const { id } = req.params
        await service.deleteVisitRequest(id)

        res.status(200).json({
            success: true,
            message: 'Visit request deleted successfully',
        })
    } catch (error) {
        console.error('Error deleting visit:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to delete visit request',
        })
    }
}
