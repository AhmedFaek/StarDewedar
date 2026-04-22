// dashboardService.js
import { API_BASE_URL } from '../utils/constants'
import { apiClient, handleApiResponse } from './apiClient'

export const getDashboardStats = async () => {
    const response = await apiClient(`${API_BASE_URL}/dashboard/stats`, {
        method: 'GET',
    })
    return handleApiResponse(response)
}