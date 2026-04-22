import { z } from 'zod'

export const createProductSchema = z.object({
    name_en: z.string().min(2),
    name_ar: z.string().min(2),
    description_en: z.string().optional(),
    description_ar: z.string().optional(),
    price: z.string().optional(),
    category_id: z.string(),
})