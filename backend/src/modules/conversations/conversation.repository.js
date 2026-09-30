import prisma from '../../utils/prisma.js'

/* ─── Product shape for message payloads ─────────────────────────────────── */

const PRODUCT_SELECT = {
    id: true,
    name_en: true,
    name_ar: true,
    description_en: true,
    description_ar: true,
    price: true,
    images: { take: 1, select: { image_url: true } },
    category: { select: { name_en: true, name_ar: true } },
}

/* ─── Conversation repo ───────────────────────────────────────────────────── */

export const create = (customerId, subject) =>
    prisma.conversation.create({
        data: { customer_id: customerId, subject, status: 'OPEN' },
    })

export const findAllByCustomer = (customerId, { take, skip }) =>
    prisma.conversation.findMany({
        where: { customer_id: customerId },
        orderBy: { last_message_at: 'desc' },
        take,
        skip,
        select: {
            id: true,
            subject: true,
            status: true,
            last_message_at: true,
            last_message_sender_type: true,
            created_at: true,
            updated_at: true,
        },
    })

export const countByCustomer = (customerId) =>
    prisma.conversation.count({ where: { customer_id: customerId } })

export const findByIdForCustomer = (id, customerId) =>
    prisma.conversation.findFirst({
        where: { id, customer_id: customerId },
        select: {
            id: true,
            subject: true,
            status: true,
            last_message_at: true,
            last_message_sender_type: true,
            created_at: true,
            updated_at: true,
        },
    })

export const updateStatus = (id, status) =>
    prisma.conversation.update({
        where: { id },
        data: { status, updated_at: new Date() },
    })

export const updateLastMessage = (id, senderType) =>
    prisma.conversation.update({
        where: { id },
        data: {
            last_message_at: new Date(),
            last_message_sender_type: senderType,
            updated_at: new Date(),
        },
    })

/* ─── Admin-only conversation repo ───────────────────────────────────────── */

export const findAll = ({ take, skip, status, search }) => {
    const where = {}
    if (status) where.status = status
    if (search) {
        where.OR = [
            { subject: { contains: search, mode: 'insensitive' } },
            { customer: { name: { contains: search, mode: 'insensitive' } } },
            { customer: { email: { contains: search, mode: 'insensitive' } } },
        ]
    }

    return prisma.conversation.findMany({
        where,
        orderBy: { last_message_at: 'desc' },
        take,
        skip,
        select: {
            id: true,
            subject: true,
            status: true,
            last_message_at: true,
            last_message_sender_type: true,
            created_at: true,
            updated_at: true,
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    company_name: true,
                },
            },
        },
    })
}

export const countAll = ({ status, search }) => {
    const where = {}
    if (status) where.status = status
    if (search) {
        where.OR = [
            { subject: { contains: search, mode: 'insensitive' } },
            { customer: { name: { contains: search, mode: 'insensitive' } } },
            { customer: { email: { contains: search, mode: 'insensitive' } } },
        ]
    }
    return prisma.conversation.count({ where })
}

export const findById = (id) =>
    prisma.conversation.findUnique({
        where: { id },
        select: {
            id: true,
            subject: true,
            status: true,
            last_message_at: true,
            last_message_sender_type: true,
            created_at: true,
            updated_at: true,
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    company_name: true,
                },
            },
        },
    })

/* ─── Message repo ────────────────────────────────────────────────────────── */

export const createMessage = (conversationId, senderType, senderId, messageType, content, productId) =>
    prisma.message.create({
        data: {
            conversation_id: conversationId,
            sender_type: senderType,
            sender_id: senderId || null,
            message_type: messageType,
            content: content || null,
            product_id: productId || null,
        },
        include: {
            product: productId
                ? { select: PRODUCT_SELECT }
                : false,
        },
    })

export const findMessages = (conversationId, { take, cursor }) => {
    const args = {
        where: { conversation_id: conversationId },
        orderBy: { created_at: 'desc' },
        take: take + 1, // fetch one extra to detect if there's a next page
        include: {
            product: { select: PRODUCT_SELECT },
        },
    }

    if (cursor) {
        args.cursor = { id: cursor }
        args.skip = 1 // skip the cursor row itself
    }

    return prisma.message.findMany(args)
}

export const validateProductExists = (productId) =>
    prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
    })

export const validateConversationExists = (id) =>
    prisma.conversation.findUnique({
        where: { id },
        select: { id: true, customer_id: true, status: true },
    })

/* ─── Transaction: create conversation + first message ───────────────────── */

export const createConversationWithMessage = async (customerId, subject, messageType, content, productId) =>
    prisma.$transaction(async (tx) => {
        const conversation = await tx.conversation.create({
            data: {
                customer_id: customerId,
                subject,
                status: 'OPEN',
                last_message_at: new Date(),
                last_message_sender_type: 'CUSTOMER',
            },
        })

        const message = await tx.message.create({
            data: {
                conversation_id: conversation.id,
                sender_type: 'CUSTOMER',
                sender_id: customerId,
                message_type: messageType,
                content: content || null,
                product_id: productId || null,
            },
            include: {
                product: productId
                    ? { select: PRODUCT_SELECT }
                    : false,
            },
        })

        return { conversation, message }
    })
