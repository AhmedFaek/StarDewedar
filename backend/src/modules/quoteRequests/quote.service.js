import * as repo from './quote.repository.js'
import * as contactService from '../contactMessages/contact.service.js'

export const createQuoteRequest = async (data) => {
    // Set default status to 'pending'
    const quoteData = {
        ...data,
        status: 'pending',
        product_id: data.product_id || null,
    }

    // Create quote request in DB
    const quoteRequest = await repo.create(quoteData)

    // Send email notification to company
    //await sendQuoteRequestEmail(quoteRequest)

    return quoteRequest
}

export const sendQuoteRequestEmail = async (quoteRequest) => {
    try {
        const productInfo = quoteRequest.product
            ? `<p><strong>Product:</strong> ${quoteRequest.product.name}</p>`
            : `<p><strong>Custom Product:</strong> ${quoteRequest.custom_product_name}</p>`

        const emailData = {
            first_name: quoteRequest.first_name,
            last_name: quoteRequest.last_name,
            email: quoteRequest.email,
            phone_number: quoteRequest.phone,
            whatsapp_number: null,
            message: `
                <h2>New Quote Request</h2>
                
                <p><strong>Name:</strong> ${quoteRequest.first_name} ${quoteRequest.last_name}</p>
                <p><strong>Email:</strong> ${quoteRequest.email}</p>
                <p><strong>Phone:</strong> ${quoteRequest.phone}</p>
                
                ${productInfo}
                
                <p><strong>Details:</strong></p>
                <p>${quoteRequest.details}</p>
                
                ${quoteRequest.file_url ? `<p><strong>File:</strong> <a href="${quoteRequest.file_url}">Download</a></p>` : ''}
                
                <p><strong>Status:</strong> ${quoteRequest.status}</p>
            `,
        }

        await contactService.sendContactEmail(emailData)
    } catch (error) {
        console.error('Error sending quote request email:', error)
        // Don't throw - quote was created successfully, just log the email error
    }
}

export const getQuoteRequests = () => repo.findAll()

export const getQuoteRequestById = (id) => repo.findById(id)

export const getQuoteRequestsByEmail = (email) => repo.findByEmail(email)

export const getQuoteRequestsByStatus = (status) => repo.findByStatus(status)

export const updateQuoteRequest = (id, data) => {
    return repo.update(id, data)
}

export const deleteQuoteRequest = (id) => {
    return repo.remove(id)
}
