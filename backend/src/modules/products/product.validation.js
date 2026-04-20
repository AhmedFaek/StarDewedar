import { z } from 'zod'

export const createProductSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    price: z.string().optional(),
    category_id: z.string(),
    specifications: z.string().optional(),
})