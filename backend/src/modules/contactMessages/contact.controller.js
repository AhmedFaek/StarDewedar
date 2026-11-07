import * as service from './contact.service.js'
import { createContactSchema } from './contact.validation.js'
import { getPaginationParams } from '../../utils/pagination.js'
import { validateAndNormalizeRequestEmail } from '../../utils/publicRequestEmail.js'

export const createContact = async (req, res) => {
    let validatedData
    try {
        validatedData = createContactSchema.parse(req.body)
    } catch (error) {
        return res.status(400).json({
            message: error.errors?.[0]?.message || 'Validation error',
        })
    }

    try {
        const normalizedData = await validateAndNormalizeRequestEmail(validatedData)
        const result = await service.createContact(normalizedData)
        res.status(201).json({
            message: 'Message sent successfully',
            data: result,
        })
    } catch (error) {
        if ([
            'INVALID_EMAIL_FORMAT',
            'INVALID_EMAIL_DOMAIN',
            'DISPOSABLE_EMAIL_NOT_ALLOWED',
        ].includes(String(error?.code || '').toUpperCase())) {
            return res.status(400).json({
                message: error.message,
                code: String(error.code).toUpperCase(),
            })
        }

        console.error(error)
        res.status(500).json({
            message: 'Something went wrong',
        })
    }
}

export const getAllMessages = async (req, res) => {
    try {
        const { take, skip } = getPaginationParams(req.query)
        const messages = await service.getMessages({ take, skip })

        res.json(messages)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages' })
    }
}