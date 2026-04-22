// contactService.js
import { API_BASE_URL } from '../utils/constants'
import { apiClient, handleApiResponse } from './apiClient'

export const getAllMessages = async () => {
    const response = await apiClient(`${API_BASE_URL}/contact`, {
        method: 'GET',
    })
    return handleApiResponse(response)
}