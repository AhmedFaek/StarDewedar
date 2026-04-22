import { API_BASE_URL } from '../utils/constants'
import { apiClient, handleApiResponse } from './apiClient'

// GET ALL
export const getAllProjects = async () => {
    console.log('Fetching all projects...')
    const response = await apiClient(`${API_BASE_URL}/projects`, {
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