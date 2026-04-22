import { API_BASE_URL } from '../utils/constants'
import { apiClient, handleApiResponse } from './apiClient'

export const getAllVisits = async () => {
    const response = await apiClient(`${API_BASE_URL}/visits`, {
        method: 'GET',
    })
    return handleApiResponse(response)
}

export const getVisitById = async (id) => {
    const response = await apiClient(`${API_BASE_URL}/visits/${id}`, {
        method: 'GET',
    })
    return handleApiResponse(response)
}

export const getVisitsByStatus = async (status) => {
    const response = await apiClient(`${API_BASE_URL}/visits/status/${status}`, {
        method: 'GET',
    })
    return handleApiResponse(response)
}

export const getVisitsByEmail = async (email) => {
    const response = await apiClient(`${API_BASE_URL}/visits/email/${email}`, {
        method: 'GET',
    })
    return handleApiResponse(response)
}

export const updateVisit = async (id, data) => {
    const response = await apiClient(`${API_BASE_URL}/visits/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
        },
    })
    return handleApiResponse(response)
}

export const deleteVisit = async (id) => {
    const response = await apiClient(`${API_BASE_URL}/visits/${id}`, {
        method: 'DELETE',
    })
    return handleApiResponse(response)
}