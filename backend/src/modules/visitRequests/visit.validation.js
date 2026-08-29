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

export const updateVisitRequestSchema = z.object({
    status: z.enum(['pending', 'contacted', 'closed', 'in_progress', 'completed', 'rejected']).optional(),
    factory_name: z.string().min(2).optional(),
    factory_activity: z.string().min(2).optional(),
    name: z.string().min(2).optional(),
    phone_number: z.string().min(10).optional(),
    whatsapp_number: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().min(5).optional(),
    preferred_date: z.string().datetime().optional(),
    details: z.string().min(5).optional(),
})
