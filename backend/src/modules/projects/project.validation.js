import { z } from 'zod'

export const createProjectSchema = z.object({
    title: z.string().min(2),
    description: z.string().min(2),
    category_id: z.string().optional(),
    client_name: z.string().optional(),
    budget: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    location: z.string().optional(),
})
