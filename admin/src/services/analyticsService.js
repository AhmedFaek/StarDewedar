// analyticsService.js
import { API_BASE_URL } from '../utils/constants'
import { apiClient, handleApiResponse } from './apiClient'

/**
 * Fetch analytics overview (active, today, this month, last month).
 */
export const getAnalyticsOverview = async () => {
    const response = await apiClient(`${API_BASE_URL}/dashboard/analytics/overview`, {
        method: 'GET',
    })
    return handleApiResponse(response)
}

/**
 * Fetch daily visitor counts for the chart.
 *
 * @param {number} days - Number of recent days (default 30)
 */
export const getAnalyticsDailyVisitors = async (days = 30) => {
    const response = await apiClient(
        `${API_BASE_URL}/dashboard/analytics/visitors?days=${days}`,
        { method: 'GET' }
    )
    return handleApiResponse(response)
}
