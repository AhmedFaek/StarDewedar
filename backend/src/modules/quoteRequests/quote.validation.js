import { z } from 'zod'

export const createQuoteRequestSchema = z.object({
    first_name: z.string().min(2),
    last_name: z.string().min(2),
    phone: z.string().min(10),
    email: z.string().email(),
    product_id: z.string().optional(),
    custom_product_name: z.string().optional(),
    custom_image_url: z.string().optional(),
    details: z.string().min(5),
    file_url: z.string().optional(),
}).refine(
    (data) => data.product_id || (data.custom_product_name && data.custom_image_url),
    {
        message: 'Either product_id or (custom_product_name and custom_image_url) must be provided',
        path: ['product_id'],
    }
)
