const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Something went wrong' }))
        throw error
    }
    return response.json()
}

export const api = {
    // Products
    getProducts: () => fetch(`${API_URL}/products`).then(handleResponse),
    getProductById: (id) => fetch(`${API_URL}/products/${id}`).then(handleResponse),

    // Projects
    getProjects: () => fetch(`${API_URL}/projects`).then(handleResponse),
    getProjectById: (id) => fetch(`${API_URL}/projects/${id}`).then(handleResponse),

    // Contact
    sendContactMessage: (data) => fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then(handleResponse),

    // Quotes
    sendQuoteRequest: (data) => fetch(`${API_URL}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then(handleResponse),

    // Visits
    sendVisitRequest: (data) => fetch(`${API_URL}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then(handleResponse),

    // i18n helper
    getLocalizedField: (obj, field, lang) => {
        if (!obj) return ''
        const fieldName = `${field}_${lang}`
        return obj[fieldName] || obj[`${field}_en`] || obj[field] || ''
    }
}
