import { z } from 'zod'

export const createProjectSchema = z.object({
    title_en: z.string().min(2).max(200),
    title_ar: z.string().min(2).max(200),
    description_en: z.string().min(2).max(10000),
    description_ar: z.string().min(2).max(10000),

    category_id: z.string().max(100).optional(),
    client_name: z.string().max(150).optional(),

    budget: z.string().max(50).optional(),
    start_date: z.string().max(50).optional(),
    end_date: z.string().max(50).optional(),

    location_en: z.string().max(200).optional(),
    location_ar: z.string().max(200).optional(),
})

export const updateProjectSchema = createProjectSchema.partial()