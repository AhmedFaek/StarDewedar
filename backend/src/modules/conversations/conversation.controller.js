import * as service from './conversation.service.js'
import { createConversationSchema, createMessageSchema } from './conversation.validation.js'

/* ─── Customer: Conversations ─────────────────────────────────────────────── */

export const createConversation = async (req, res, next) => {
    try {
        const data = createConversationSchema.parse(req.body)
        const result = await service.createConversation(req.user.userId, data)
        res.status(201).json({ success: true, data: result })
    } catch (err) {
        next(err)
    }
}

export const getMyConversations = async (req, res, next) => {
    try {
        const result = await service.getMyConversations(req.user.userId, req.query)
        res.json({ success: true, ...result })
    } catch (err) {
        next(err)
    }
}

export const getMyConversationById = async (req, res, next) => {
    try {
        const conversation = await service.getMyConversationById(req.user.userId, req.params.id)
        res.json({ success: true, data: conversation })
    } catch (err) {
        next(err)
    }
}

export const getMyMessages = async (req, res, next) => {
    try {
        const result = await service.getMyMessages(req.user.userId, req.params.id, req.query)
        res.json({ success: true, data: result })
    } catch (err) {
        next(err)
    }
}

export const sendMessage = async (req, res, next) => {
    try {
        const data = createMessageSchema.parse(req.body)
        const message = await service.sendMessage(req.user.userId, req.params.id, data)
        res.status(201).json({ success: true, data: message })
    } catch (err) {
        next(err)
    }
}

export const closeConversation = async (req, res, next) => {
    try {
        const conversation = await service.closeConversation(req.user.userId, req.params.id)
        res.json({ success: true, data: conversation })
    } catch (err) {
        next(err)
    }
}

export const reopenConversation = async (req, res, next) => {
    try {
        const conversation = await service.reopenConversation(req.user.userId, req.params.id)
        res.json({ success: true, data: conversation })
    } catch (err) {
        next(err)
    }
}

/* ─── Admin: Conversations ────────────────────────────────────────────────── */

export const adminGetConversations = async (req, res, next) => {
    try {
        const result = await service.adminGetConversations(req.query)
        res.json({ success: true, ...result })
    } catch (err) {
        next(err)
    }
}

export const adminGetConversationById = async (req, res, next) => {
    try {
        const conversation = await service.adminGetConversationById(req.params.id)
        res.json({ success: true, data: conversation })
    } catch (err) {
        next(err)
    }
}

export const adminGetMessages = async (req, res, next) => {
    try {
        const result = await service.adminGetMessages(req.params.id, req.query)
        res.json({ success: true, data: result })
    } catch (err) {
        next(err)
    }
}

export const adminSendMessage = async (req, res, next) => {
    try {
        const data = createMessageSchema.parse(req.body)
        const message = await service.adminSendMessage(req.user.userId, req.params.id, data)
        res.status(201).json({ success: true, data: message })
    } catch (err) {
        next(err)
    }
}

export const adminCloseConversation = async (req, res, next) => {
    try {
        const conversation = await service.adminCloseConversation(req.params.id)
        res.json({ success: true, data: conversation })
    } catch (err) {
        next(err)
    }
}

export const adminReopenConversation = async (req, res, next) => {
    try {
        const conversation = await service.adminReopenConversation(req.params.id)
        res.json({ success: true, data: conversation })
    } catch (err) {
        next(err)
    }
}
