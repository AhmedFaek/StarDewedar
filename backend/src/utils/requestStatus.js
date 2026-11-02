import { z } from 'zod'

export const REQUEST_STATUSES = [
    'pending',
    'contacted',
    'in_progress',
    'completed',
    'rejected',
    'closed',
]

export const requestStatusSchema = z.enum(REQUEST_STATUSES)

export const REQUEST_STATUS_DESCRIPTIONS = [
    {
        value: 'pending',
        label: 'PENDING — New Request',
        description: 'The request has been received and no follow-up has taken place yet.',
    },
    {
        value: 'contacted',
        label: 'CONTACTED — Customer Contacted',
        description: 'The company has contacted the customer.',
    },
    {
        value: 'in_progress',
        label: 'IN_PROGRESS — In Progress',
        description: 'Coordination or work related to the request is ongoing.',
    },
    {
        value: 'completed',
        label: 'COMPLETED — Completed',
        description: 'The company has completed its requested work.',
    },
    {
        value: 'rejected',
        label: 'REJECTED — Rejected',
        description: 'The company has decided not to proceed with the request.',
    },
    {
        value: 'closed',
        label: 'CLOSED — Closed',
        description: 'The interaction has ended and no further follow-up is currently expected.',
    },
]

export const QUOTE_COMPLETED_DESCRIPTION =
    'For Quote requests, COMPLETED means the quote has been prepared and sent to the customer, even if the customer has not responded.'
