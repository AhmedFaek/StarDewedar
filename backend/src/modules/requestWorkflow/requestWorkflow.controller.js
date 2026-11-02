import * as service from './requestWorkflow.service.js'

export const getRequestStatusCatalog = (req, res) => {
    res.set('Cache-Control', 'no-store')
    res.status(200).json({
        success: true,
        data: service.getRequestStatusCatalog(),
    })
}

const setArchived = (requestType, archived) => async (req, res, next) => {
    try {
        const request = await service.setRequestArchived(
            requestType,
            req.params.id,
            archived
        )
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found.',
            })
        }

        res.status(200).json({
            success: true,
            message: archived ? 'Request archived.' : 'Request restored.',
            data: request,
        })
    } catch (error) {
        next(error)
    }
}

export const archiveQuoteRequest = setArchived('quote', true)
export const restoreQuoteRequest = setArchived('quote', false)
export const archiveVisitRequest = setArchived('visit', true)
export const restoreVisitRequest = setArchived('visit', false)
export const archiveBOQRequest = setArchived('boq', true)
export const restoreBOQRequest = setArchived('boq', false)
