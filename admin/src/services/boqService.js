import { API_BASE_URL } from '../utils/constants'
import { apiClient, handleApiResponse } from './apiClient'

export const getAllBOQs = async () => {
    const response = await apiClient(`${API_BASE_URL}/boq`, {
        method: 'GET',
    })
    return handleApiResponse(response)
}

export const getBOQById = async (id) => {
    const response = await apiClient(`${API_BASE_URL}/boq/${id}`, {
        method: 'GET',
    })
    return handleApiResponse(response)
}

export const getBOQsByStatus = async (status) => {
    const response = await apiClient(`${API_BASE_URL}/boq/status/${status}`, {
        method: 'GET',
    })
    return handleApiResponse(response)
}

export const updateBOQ = async (id, data) => {
    const response = await apiClient(`${API_BASE_URL}/boq/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
        },
    })
    return handleApiResponse(response)
}

export const deleteBOQ = async (id) => {
    const response = await apiClient(`${API_BASE_URL}/boq/${id}`, {
        method: 'DELETE',
    })
    return handleApiResponse(response)
}
