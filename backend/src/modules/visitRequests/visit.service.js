import * as repo from './visit.repository.js'
import * as contactService from '../contactMessages/contact.service.js'

export const createVisitRequest = async (data) => {
    // Set default status to 'pending'
    const visitData = {
        ...data,
        status: 'pending',
        preferred_date: new Date(data.preferred_date),
    }

    // Create visit request in DB
    const visitRequest = await repo.create(visitData)

    // Send email notification to company
    //await sendVisitRequestEmail(visitRequest)

    return visitRequest
}

export const sendVisitRequestEmail = async (visitRequest) => {
    try {
        const emailData = {
            first_name: visitRequest.name.split(' ')[0],
            last_name: visitRequest.name.split(' ')[1] || '',
            email: visitRequest.email,
            phone_number: visitRequest.phone_number,
            whatsapp_number: visitRequest.whatsapp_number || null,
            message: `
                <h2>New Visit Request</h2>
                
                <p><strong>Name:</strong> ${visitRequest.name}</p>
                <p><strong>Email:</strong> ${visitRequest.email}</p>
                <p><strong>Phone:</strong> ${visitRequest.phone_number}</p>
                ${visitRequest.whatsapp_number ? `<p><strong>WhatsApp:</strong> ${visitRequest.whatsapp_number}</p>` : ''}
                
                <p><strong>Factory Name:</strong> ${visitRequest.factory_name}</p>
                <p><strong>Factory Activity:</strong> ${visitRequest.factory_activity}</p>
                <p><strong>Address:</strong> ${visitRequest.address}</p>
                
                <p><strong>Preferred Date:</strong> ${new Date(visitRequest.preferred_date).toLocaleString()}</p>
                
                <p><strong>Details:</strong></p>
                <p>${visitRequest.details}</p>
                
                <p><strong>Status:</strong> ${visitRequest.status}</p>
            `,
        }

        await contactService.sendContactEmail(emailData)
    } catch (error) {
        console.error('Error sending visit request email:', error)
        // Don't throw - visit request was created successfully, just log the email error
    }
}

export const getVisitRequests = () => repo.findAll()

export const getVisitRequestById = (id) => repo.findById(id)

export const getVisitRequestsByEmail = (email) => repo.findByEmail(email)

export const getVisitRequestsByStatus = (status) => repo.findByStatus(status)

export const updateVisitRequest = (id, data) => {
    return repo.update(id, data)
}

export const deleteVisitRequest = (id) => {
    return repo.remove(id)
}
