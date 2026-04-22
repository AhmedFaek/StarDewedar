import { z } from 'zod'

export const createProjectSchema = z.object({
    title_en: z.string().min(2),
    title_ar: z.string().min(2),
    description_en: z.string().min(2),
    description_ar: z.string().min(2),

    category_id: z.string().optional(),
    client_name: z.string().optional(),

    budget: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),

    location_en: z.string().optional(),
    location_ar: z.string().optional(),
})