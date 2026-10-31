import { z } from 'zod'
import {
    egyptianPhoneSchema,
    optionalEgyptianPhoneSchema,
} from '../../utils/egyptianPhone.validation.js'

export const createContactSchema = z.object({
    first_name: z.string().min(2).max(100),
    last_name: z.string().min(2).max(100),
    email: z.string().email().max(254),
    phone_number: egyptianPhoneSchema,
    whatsapp_number: optionalEgyptianPhoneSchema,
    message: z.string().min(10).max(5000),
})