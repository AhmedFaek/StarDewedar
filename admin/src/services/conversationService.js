import { API_BASE_URL } from '../utils/constants'
import { apiClient, handleApiResponse } from './apiClient'

const CONV_BASE = `${API_BASE_URL}/dashboard/conversations`

/* ─── Conversations ───────────────────────────────────────────────────────── */

export const getAllConversations = async (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    const response = await apiClient(`${CONV_BASE}${qs ? `?${qs}` : ''}`)
    return handleApiResponse(response)
}

export const getConversationById = async (id) => {
    const response = await apiClient(`${CONV_BASE}/${id}`)
    return handleApiResponse(response)
}

export const closeConversation = async (id) => {
    const response = await apiClient(`${CONV_BASE}/${id}/close`, { method: 'PATCH' })
    return handleApiResponse(response)
}

export const reopenConversation = async (id) => {
    const response = await apiClient(`${CONV_BASE}/${id}/reopen`, { method: 'PATCH' })
    return handleApiResponse(response)
}

/* ─── Messages ────────────────────────────────────────────────────────────── */

export const getMessages = async (conversationId, params = {}) => {
    const qs = new URLSearchParams(params).toString()
    const response = await apiClient(`${CONV_BASE}/${conversationId}/messages${qs ? `?${qs}` : ''}`)
    return handleApiResponse(response)
}

export const sendAdminMessage = async (conversationId, data) => {
    const response = await apiClient(`${CONV_BASE}/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    })
    return handleApiResponse(response)
}

/* ─── Products (for product picker) ─────────────────────────────────────── */

export const getProducts = async () => {
    const response = await apiClient(`${API_BASE_URL}/products`)
    return handleApiResponse(response)
}

export const getCategories = async () => {
    const response = await apiClient(`${API_BASE_URL}/categories`)
    return handleApiResponse(response)
}
