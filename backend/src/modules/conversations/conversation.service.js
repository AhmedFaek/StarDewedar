import * as repo from './conversation.repository.js'
import { getPaginationParams } from '../../utils/pagination.js'

const MSG_LIMIT = 30 // messages per page

/* ─── Customer: Conversations ─────────────────────────────────────────────── */

export const createConversation = async (customerId, data) => {
    const { subject, content, message_type: messageType, product_id: productId } = data

    // Validate product exists if sharing one
    if (productId) {
        const product = await repo.validateProductExists(productId)
        if (!product) {
            const err = new Error('Product not found')
            err.status = 404
            throw err
        }
    }

    const { conversation, message } = await repo.createConversationWithMessage(
        customerId,
        subject,
        messageType || 'TEXT',
        content,
        productId || null
    )

    return { conversation, message }
}

export const getMyConversations = async (customerId, query) => {
    const { take, skip, page, limit } = getPaginationParams(query, 15, 50)
    const [conversations, total] = await Promise.all([
        repo.findAllByCustomer(customerId, { take, skip }),
        repo.countByCustomer(customerId),
    ])
    return { conversations, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export const getMyConversationById = async (customerId, conversationId) => {
    const conversation = await repo.findByIdForCustomer(conversationId, customerId)
    if (!conversation) {
        const err = new Error('Conversation not found')
        err.status = 404
        throw err
    }
    return conversation
}

export const getMyMessages = async (customerId, conversationId, query) => {
    // Ownership check & fetch authoritative conversation status
    const conversation = await repo.findByIdForCustomer(conversationId, customerId)
    if (!conversation) {
        const err = new Error('Conversation not found')
        err.status = 404
        throw err
    }

    const page = await _getMessagePage(conversationId, query)

    return {
        ...page,
        conversation,
    }
}

export const sendMessage = async (customerId, conversationId, data) => {
    const { message_type: messageType, content, product_id: productId } = data

    // Ownership check
    const conversation = await repo.validateConversationExists(conversationId)
    if (!conversation || conversation.customer_id !== customerId) {
        const err = new Error('Conversation not found')
        err.status = 404
        throw err
    }

    // Validate product exists if sharing one
    if (productId) {
        const product = await repo.validateProductExists(productId)
        if (!product) {
            const err = new Error('Product not found')
            err.status = 404
            throw err
        }
    }

    const isClosed = conversation.status === 'CLOSED'

    const message = await repo.createMessage(
        conversationId,
        'CUSTOMER',
        customerId,
        messageType || 'TEXT',
        content || null,
        productId || null
    )

    if (isClosed) {
        await repo.updateStatusAndLastMessage(conversationId, 'OPEN', 'CUSTOMER')
    } else {
        await repo.updateLastMessage(conversationId, 'CUSTOMER')
    }

    return message
}

export const closeConversation = async (customerId, conversationId) => {
    const conversation = await repo.validateConversationExists(conversationId)
    if (!conversation || conversation.customer_id !== customerId) {
        const err = new Error('Conversation not found')
        err.status = 404
        throw err
    }
    if (conversation.status === 'CLOSED') {
        const err = new Error('Conversation is already closed')
        err.status = 409
        throw err
    }
    return repo.updateStatus(conversationId, 'CLOSED')
}

export const reopenConversation = async (customerId, conversationId) => {
    const conversation = await repo.validateConversationExists(conversationId)
    if (!conversation || conversation.customer_id !== customerId) {
        const err = new Error('Conversation not found')
        err.status = 404
        throw err
    }
    if (conversation.status === 'OPEN') {
        const err = new Error('Conversation is already open')
        err.status = 409
        throw err
    }
    return repo.updateStatus(conversationId, 'OPEN')
}

/* ─── Admin: Conversations ────────────────────────────────────────────────── */

export const adminGetConversations = async (query) => {
    const { take, skip, page, limit } = getPaginationParams(query, 20, 100)
    const { status, search, awaiting } = query

    const isAwaiting = awaiting === 'true' || status?.toUpperCase() === 'AWAITING'
    const statusFilter = isAwaiting
        ? 'OPEN'
        : (status && ['OPEN', 'CLOSED'].includes(status.toUpperCase()) ? status.toUpperCase() : undefined)

    const lastSenderFilter = isAwaiting ? 'CUSTOMER' : undefined

    const [conversations, total] = await Promise.all([
        repo.findAll({ take, skip, status: statusFilter, lastSender: lastSenderFilter, search }),
        repo.countAll({ status: statusFilter, lastSender: lastSenderFilter, search }),
    ])

    return { conversations, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export const adminGetConversationById = async (conversationId) => {
    const conversation = await repo.findById(conversationId)
    if (!conversation) {
        const err = new Error('Conversation not found')
        err.status = 404
        throw err
    }
    return conversation
}

export const adminGetMessages = async (conversationId, query) => {
    const page = await _getMessagePage(conversationId, query)
    let conversation = await repo.findById(conversationId)
    if (!conversation) {
        const err = new Error('Conversation not found')
        err.status = 404
        throw err
    }

    // Safety check: Keep the backend as the source of truth.
    // If polling detects that the newest customer message arrived around or after the conversation was closed,
    // automatically reopen it in the database and return the updated conversation.
    const latestMessage = page.messages?.[0]
    if (
        conversation.status === 'CLOSED' &&
        latestMessage?.sender_type === 'CUSTOMER' &&
        new Date(latestMessage.created_at).getTime() >= new Date(conversation.updated_at).getTime() - 2000
    ) {
        await repo.updateStatus(conversationId, 'OPEN')
        conversation = await repo.findById(conversationId)
    }

    return {
        ...page,
        conversation,
    }
}

export const adminSendMessage = async (adminId, conversationId, data) => {
    const { message_type: messageType, content, product_id: productId } = data

    const conversation = await repo.validateConversationExists(conversationId)
    if (!conversation) {
        const err = new Error('Conversation not found')
        err.status = 404
        throw err
    }

    if (conversation.status === 'CLOSED') {
        const err = new Error('Cannot reply to a closed conversation. Reopen it first.')
        err.status = 409
        throw err
    }

    if (productId) {
        const product = await repo.validateProductExists(productId)
        if (!product) {
            const err = new Error('Product not found')
            err.status = 404
            throw err
        }
    }

    const message = await repo.createMessage(
        conversationId,
        'ADMIN',
        adminId,
        messageType || 'TEXT',
        content || null,
        productId || null
    )

    await repo.updateLastMessage(conversationId, 'ADMIN')

    return message
}

export const adminCloseConversation = async (conversationId) => {
    const conversation = await repo.validateConversationExists(conversationId)
    if (!conversation) {
        const err = new Error('Conversation not found')
        err.status = 404
        throw err
    }
    if (conversation.status === 'CLOSED') {
        const err = new Error('Conversation is already closed')
        err.status = 409
        throw err
    }
    return repo.updateStatus(conversationId, 'CLOSED')
}

export const adminReopenConversation = async (conversationId) => {
    const conversation = await repo.validateConversationExists(conversationId)
    if (!conversation) {
        const err = new Error('Conversation not found')
        err.status = 404
        throw err
    }
    if (conversation.status === 'OPEN') {
        const err = new Error('Conversation is already open')
        err.status = 409
        throw err
    }
    return repo.updateStatus(conversationId, 'OPEN')
}

/* ─── Shared: cursor-based message pagination ─────────────────────────────── */

async function _getMessagePage(conversationId, query) {
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || MSG_LIMIT))
    const cursor = query.cursor || undefined

    const rows = await repo.findMessages(conversationId, { take: limit, cursor })

    // rows are DESC — detect if more exist
    const hasMore = rows.length > limit
    const messages = hasMore ? rows.slice(0, limit) : rows

    // nextCursor is the LAST (oldest) item in this page
    const nextCursor = hasMore ? messages[messages.length - 1]?.id : null

    return {
        messages,           // newest first — frontend should reverse for display
        nextCursor,
        hasMore,
    }
}
