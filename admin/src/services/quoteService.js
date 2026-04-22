import { API_BASE_URL } from '../utils/constants'
import { apiClient, handleApiResponse } from './apiClient'

export const getAllQuotes = async () => {
    const response = await apiClient(`${API_BASE_URL}/quotes`, {
        method: 'GET',
    })
    return handleApiResponse(response)
}

export const getQuoteById = async (id) => {
    const response = await apiClient(`${API_BASE_URL}/quotes/${id}`, {
        method: 'GET',
    })
    return handleApiResponse(response)
}

export const getQuotesByStatus = async (status) => {
    const response = await apiClient(`${API_BASE_URL}/quotes/status/${status}`, {
        method: 'GET',
    })
    return handleApiResponse(response)
}

export const getQuotesByEmail = async (email) => {
    const response = await apiClient(`${API_BASE_URL}/quotes/email/${email}`, {
        method: 'GET',
    })
    return handleApiResponse(response)
}

export const updateQuote = async (id, data) => {
    const response = await apiClient(`${API_BASE_URL}/quotes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
        },
    })
    return handleApiResponse(response)
}

export const deleteQuote = async (id) => {
    const response = await apiClient(`${API_BASE_URL}/quotes/${id}`, {
        method: 'DELETE',
    })
    return handleApiResponse(response)
}