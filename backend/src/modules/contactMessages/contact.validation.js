import { z } from 'zod'

export const createContactSchema = z.object({
    first_name: z.string().min(2),
    last_name: z.string().min(2),
    email: z.string().email(),
    phone_number: z.string().optional(),
    whatsapp_number: z.string().optional(),
    message: z.string().min(10),
})