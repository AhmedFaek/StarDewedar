import { z } from 'zod'

export const createVisitRequestSchema = z.object({
    factory_name: z.string().min(2).max(200),
    factory_activity: z.string().min(2).max(200),
    name: z.string().min(2).max(100),
    phone_number: z.string().min(10).max(30),
    whatsapp_number: z.string().max(30).optional(),
    email: z.string().email().max(254),
    address: z.string().min(5).max(500),
    preferred_date: z.string().datetime(),
    details: z.string().min(5).max(10000),
})

export const updateVisitRequestSchema = z.object({
    status: z.enum(['pending', 'contacted', 'closed', 'in_progress', 'completed', 'rejected']).optional(),
    factory_name: z.string().min(2).max(200).optional(),
    factory_activity: z.string().min(2).max(200).optional(),
    name: z.string().min(2).max(100).optional(),
    phone_number: z.string().min(10).max(30).optional(),
    whatsapp_number: z.string().max(30).optional(),
    email: z.string().email().max(254).optional(),
    address: z.string().min(5).max(500).optional(),
    preferred_date: z.string().datetime().optional(),
    details: z.string().min(5).max(10000).optional(),
})
