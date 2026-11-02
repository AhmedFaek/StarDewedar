import prisma from '../../utils/prisma.js'
import {
    QUOTE_COMPLETED_DESCRIPTION,
    REQUEST_STATUS_DESCRIPTIONS,
} from '../../utils/requestStatus.js'

const requestDelegates = {
    quote: 'quoteRequest',
    visit: 'visitRequest',
    boq: 'bOQRequest',
}

export const createRequestWorkflowService = ({
    database = prisma,
    now = () => new Date(),
} = {}) => ({
    getStatusCatalog: () => ({
        statuses: REQUEST_STATUS_DESCRIPTIONS,
        request_specific_notes: {
            quote_completed: QUOTE_COMPLETED_DESCRIPTION,
        },
    }),

    async setArchived(requestType, requestId, archived) {
        const delegateName = requestDelegates[requestType]
        if (!delegateName) {
            const error = new Error('Unsupported request type.')
            error.status = 400
            error.code = 'INVALID_REQUEST_TYPE'
            throw error
        }

        const delegate = database[delegateName]
        const current = await delegate.findUnique({
            where: { id: requestId },
            select: { id: true, status: true, archived_at: true },
        })
        if (!current) return null

        const isArchived = Boolean(current.archived_at)
        if (isArchived !== archived) {
            await delegate.updateMany({
                where: {
                    id: requestId,
                    archived_at: isArchived ? { not: null } : null,
                },
                data: { archived_at: archived ? now() : null },
            })
        }

        return delegate.findUnique({
            where: { id: requestId },
            select: { id: true, status: true, archived_at: true },
        })
    },
})

const requestWorkflowService = createRequestWorkflowService()

export const getRequestStatusCatalog = () =>
    requestWorkflowService.getStatusCatalog()

export const setRequestArchived = (requestType, requestId, archived) =>
    requestWorkflowService.setArchived(requestType, requestId, archived)
