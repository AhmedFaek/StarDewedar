import { API_BASE_URL } from '../utils/constants'
import { apiClient, handleApiResponse } from './apiClient'

const REQUEST_ENDPOINTS = {
    quote: 'quotes',
    visit: 'visits',
    boq: 'boq',
}

export const getRequestStatusCatalog = async () => {
    const response = await apiClient(`${API_BASE_URL}/request-workflow/statuses`, {
        method: 'GET',
    })
    const result = await handleApiResponse(response)
    return result.data
}

export const setRequestArchived = async (requestType, requestId, archived) => {
    const endpoint = REQUEST_ENDPOINTS[requestType]
    if (!endpoint) throw new Error('Unsupported request type')

    const action = archived ? 'archive' : 'restore'
    const response = await apiClient(`${API_BASE_URL}/${endpoint}/${requestId}/${action}`, {
        method: 'POST',
    })
    return handleApiResponse(response)
}
