import * as service from './quote.service.js'
import { createQuoteRequestSchema } from './quote.validation.js'

export const createQuote = async (req, res) => {
    try {
        const validatedData = createQuoteRequestSchema.parse(req.body)
        const quote = await service.createQuoteRequest(validatedData)
        res.status(201).json({
            success: true,
            message: 'Quote request created successfully',
            data: quote,
        })
    } catch (error) {
        console.error('Error creating quote request:', error)
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create quote request',
        })
    }
}

export const getQuotes = async (req, res) => {
    try {
        const quotes = await service.getQuoteRequests()
        res.status(200).json({
            success: true,
            data: quotes,
        })
    } catch (error) {
        console.error('Error fetching quotes:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch quote requests',
        })
    }
}

export const getQuoteById = async (req, res) => {
    try {
        const { id } = req.params
        const quote = await service.getQuoteRequestById(id)

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Quote request not found',
            })
        }

        res.status(200).json({
            success: true,
            data: quote,
        })
    } catch (error) {
        console.error('Error fetching quote:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch quote request',
        })
    }
}

export const getQuotesByEmail = async (req, res) => {
    try {
        const { email } = req.params
        const quotes = await service.getQuoteRequestsByEmail(email)

        res.status(200).json({
            success: true,
            data: quotes,
        })
    } catch (error) {
        console.error('Error fetching quotes by email:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch quote requests',
        })
    }
}

export const getQuotesByStatus = async (req, res) => {
    try {
        const { status } = req.params
        const quotes = await service.getQuoteRequestsByStatus(status)

        res.status(200).json({
            success: true,
            data: quotes,
        })
    } catch (error) {
        console.error('Error fetching quotes by status:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch quote requests',
        })
    }
}

export const updateQuote = async (req, res) => {
    try {
        const { id } = req.params
        const quote = await service.updateQuoteRequest(id, req.body)

        res.status(200).json({
            success: true,
            message: 'Quote request updated successfully',
            data: quote,
        })
    } catch (error) {
        console.error('Error updating quote:', error)
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update quote request',
        })
    }
}

export const deleteQuote = async (req, res) => {
    try {
        const { id } = req.params
        await service.deleteQuoteRequest(id)

        res.status(200).json({
            success: true,
            message: 'Quote request deleted successfully',
        })
    } catch (error) {
        console.error('Error deleting quote:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to delete quote request',
        })
    }
}
