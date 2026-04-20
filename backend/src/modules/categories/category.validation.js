import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z.string().min(2),
  type: z.enum(['product', 'project']),
})

export const updateCategorySchema = z.object({
  name: z.string().min(2).optional(),
  type: z.enum(['product', 'project']).optional(),
})