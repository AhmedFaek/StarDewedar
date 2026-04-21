import { z } from 'zod'

export const createVisitRequestSchema = z.object({
    factory_name: z.string().min(2),
    factory_activity: z.string().min(2),
    name: z.string().min(2),
    phone_number: z.string().min(10),
    whatsapp_number: z.string().optional(),
    email: z.string().email(),
    address: z.string().min(5),
    preferred_date: z.string().datetime(),
    details: z.string().min(5),
})
