import { z } from 'zod'

/* ─── Shared ─────────────────────────────────────────────────────────────── */

const SENDER_TYPES = ['CUSTOMER', 'ADMIN', 'SYSTEM']
const MESSAGE_TYPES = ['TEXT', 'PRODUCT']
const CONV_STATUSES = ['OPEN', 'CLOSED']

/* ─── Conversation ────────────────────────────────────────────────────────── */

export const createConversationSchema = z.object({
    subject: z.string().trim().min(1, 'Subject is required').max(100, 'Subject must be 100 characters or less'),
    content: z.string().trim().min(1, 'First message is required').max(2000, 'Message must be 2000 characters or less'),
    message_type: z.enum(MESSAGE_TYPES).optional().default('TEXT'),
    product_id: z.string().uuid('Invalid product ID').optional().nullable(),
})
    .refine(
        (data) => {
            if (data.message_type === 'PRODUCT') return !!data.product_id
            return true
        },
        { message: 'product_id is required when message_type is PRODUCT', path: ['product_id'] }
    )
    .refine(
        (data) => {
            if (data.message_type === 'TEXT') return !!(data.content && data.content.trim().length > 0)
            return true
        },
        { message: 'content is required for TEXT messages', path: ['content'] }
    )

export const updateConversationStatusSchema = z.object({
    status: z.enum(CONV_STATUSES, { errorMap: () => ({ message: 'Status must be OPEN or CLOSED' }) }),
})

/* ─── Message ─────────────────────────────────────────────────────────────── */

export const createMessageSchema = z.object({
    message_type: z.enum(MESSAGE_TYPES).optional().default('TEXT'),
    content: z.string().trim().max(2000, 'Message must be 2000 characters or less').optional().nullable(),
    product_id: z.string().uuid('Invalid product ID').optional().nullable(),
})
    .refine(
        (data) => {
            if (data.message_type === 'PRODUCT') return !!data.product_id
            return true
        },
        { message: 'product_id is required when message_type is PRODUCT', path: ['product_id'] }
    )
    .refine(
        (data) => {
            if (data.message_type === 'TEXT') {
                return !!(data.content && data.content.trim().length > 0)
            }
            return true
        },
        { message: 'content is required for TEXT messages', path: ['content'] }
    )
