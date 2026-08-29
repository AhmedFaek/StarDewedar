import { z } from 'zod'

export const createProductSchema = z.object({
    name_en: z.string().min(2).max(200),
    name_ar: z.string().min(2).max(200),
    description_en: z.string().max(5000).optional(),
    description_ar: z.string().max(5000).optional(),
    price: z.string().max(50).optional(),
    category_id: z.string().max(100),
})

export const updateProductSchema = z.object({
    name_en: z.string().min(2).max(200).optional(),
    name_ar: z.string().min(2).max(200).optional(),
    description_en: z.string().max(5000).optional(),
    description_ar: z.string().max(5000).optional(),
    price: z.string().max(50).optional(),
    category_id: z.string().max(100).optional(),
})