import { API_BASE_URL } from '../utils/constants'
import { apiClient, handleApiResponse } from './apiClient'

// GET ALL (admin-only route — returns real budget)
export const getAllProjects = async () => {
    const response = await apiClient(`${API_BASE_URL}/projects/admin/all`, {
        method: 'GET',
    })

    return handleApiResponse(response)
}

export const createProject = async (formData) => {
    const response = await apiClient(`${API_BASE_URL}/projects`, {
        method: 'POST',
        body: formData
        // DO NOT set Content-Type
    })

    return handleApiResponse(response)
}

// UPDATE
export const updateProject = async (id, data) => {
    const response = await apiClient(`${API_BASE_URL}/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    })

    return handleApiResponse(response)
}

// DELETE
export const deleteProject = async (id) => {
    const response = await apiClient(`${API_BASE_URL}/projects/${id}`, {
        method: 'DELETE'
    })

    return handleApiResponse(response)
}