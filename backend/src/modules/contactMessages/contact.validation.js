import { z } from 'zod'

export const createContactSchema = z.object({
    first_name: z.string().min(2).max(100),
    last_name: z.string().min(2).max(100),
    email: z.string().email().max(254),
    phone_number: z.string().max(30).optional(),
    whatsapp_number: z.string().max(30).optional(),
    message: z.string().min(10).max(5000),
})