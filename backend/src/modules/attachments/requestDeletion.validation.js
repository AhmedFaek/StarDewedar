import { z } from 'zod'

export const requestDeletionSchema = z.object({
    confirmation: z.literal('DELETE'),
})
