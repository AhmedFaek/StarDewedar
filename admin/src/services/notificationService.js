import { API_BASE_URL } from '../utils/constants'
import { apiClient } from './apiClient'

export const retryRequestNotification = async (requestType, requestId, options = {}) => {
    const response = await apiClient(
        `${API_BASE_URL}/notifications/${requestType}/${requestId}/retry`,
        {
            method: 'POST',
            body: JSON.stringify(options),
            headers: { 'Content-Type': 'application/json' },
        }
    )
    const result = await response.json()
    if (!response.ok) {
        const error = new Error(result.message || `HTTP ${response.status}`)
        error.status = response.status
        error.code = result.code
        error.data = result.data
        throw error
    }
    return result
}
