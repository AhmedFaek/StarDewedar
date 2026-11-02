import * as service from './requestDeletion.service.js'

export const listCleanupOperations = async (req, res, next) => {
    try {
        const operations = await service.getCleanupOperations({
            status: req.query.status,
            take: req.query.take,
            skip: req.query.skip,
        })
        res.set('Cache-Control', 'no-store')
        res.status(200).json({ success: true, data: operations })
    } catch (error) {
        next(error)
    }
}

export const retryCleanupOperation = async (req, res, next) => {
    try {
        const operation = await service.retryCleanupOperation(req.params.id)
        const completed = operation.status === 'COMPLETED'
        res.status(completed ? 200 : 202).json({
            success: completed,
            message: completed
                ? 'Attachment cleanup completed.'
                : 'Attachment cleanup remains pending or failed.',
            data: service.toCleanupOperationDto(operation),
        })
    } catch (error) {
        next(error)
    }
}
