import { randomUUID } from 'node:crypto'

export const PUBLIC_REQUEST_SUCCESS_MESSAGES = Object.freeze({
    QUOTE: 'Quote request created successfully',
    VISIT: 'Visit request created successfully',
    BOQ: 'BOQ request created successfully',
    CONTACT: 'Message sent successfully',
})

const isHoneypotTripped = (req) => (
    typeof req.body?.sdc_ref === 'string' && req.body.sdc_ref.trim().length > 0
)

export const respondToPublicRequestHoneypot = (req, res, requestType) => {
    if (!isHoneypotTripped(req)) return false

    console.info(requestType)
    req.file = undefined
    req.files = undefined

    const data = { id: randomUUID() }
    const message = PUBLIC_REQUEST_SUCCESS_MESSAGES[requestType]
    const response = requestType === 'CONTACT'
        ? { message, data }
        : { success: true, message, data }

    res.status(201).json(response)
    return true
}
