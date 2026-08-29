import { z } from 'zod'

export const createCategorySchema = z.object({
  name_en: z.string().min(2).max(100),
  name_ar: z.string().min(2).max(100),
  type: z.enum(['product', 'project']),
})

export const updateCategorySchema = z.object({
  name_en: z.string().min(2).max(100).optional(),
  name_ar: z.string().min(2).max(100).optional(),
  type: z.enum(['product', 'project']).optional(),
})