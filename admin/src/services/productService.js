import { API_BASE_URL } from '../utils/constants'
import { apiClient, handleApiResponse } from './apiClient'

export const getAllProducts = async () => {
    const response = await apiClient(`${API_BASE_URL}/products`, {
        method: 'GET',
    })
    return handleApiResponse(response)
}

export const getProductById = async (id) => {
    const response = await apiClient(`${API_BASE_URL}/products/${id}`, {
        method: 'GET',
    })
    return handleApiResponse(response)
}

export const createProduct = async (formData) => {
    const token = localStorage.getItem('accessToken')

    const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create product')
    }

    return response.json()
}

export const updateProduct = async (id, data) => {
    const response = await apiClient(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    })
    return handleApiResponse(response)
}

export const deleteProduct = async (id) => {
    const response = await apiClient(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
    })
    return handleApiResponse(response)
}