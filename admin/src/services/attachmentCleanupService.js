import { API_BASE_URL } from '../utils/constants'
import { apiClient, handleApiResponse } from './apiClient'

export const getCleanupOperations = async ({ status, take = 50, skip = 0 } = {}) => {
    const query = new URLSearchParams({ take: String(take), skip: String(skip) })
    if (status) query.set('status', status)

    const response = await apiClient(`${API_BASE_URL}/attachments/cleanup?${query}`, {
        method: 'GET',
    })
    const result = await handleApiResponse(response)
    return result.data
}

export const retryCleanupOperation = async (id) => {
    const response = await apiClient(`${API_BASE_URL}/attachments/cleanup/${id}/retry`, {
        method: 'POST',
    })
    return handleApiResponse(response)
}
