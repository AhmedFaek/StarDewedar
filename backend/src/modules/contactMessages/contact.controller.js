import * as service from './contact.service.js'
import { getPaginationParams } from '../../utils/pagination.js'

export const createContact = async (req, res) => {
    try {
        const result = await service.createContact(req.body)

        res.status(201).json({
            message: 'Message sent successfully',
            data: result,
        })
    } catch (error) {
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