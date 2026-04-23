import { z } from 'zod';

export const createQuoteRequestSchema = z.object({
    first_name: z.string().trim().min(2),
    last_name: z.string().trim().min(2),

    phone: z.string().trim().min(10),

    email: z.string().email(),

    product_id: z.string().trim().optional(),

    custom_product_name: z.string().trim().optional(),
    custom_image_url: z.string().url().optional(),

    details: z.string().trim().min(5),

    file_url: z.string().url().optional(),
})
    .refine(
        (data) => {
            const hasProduct = !!data.product_id;
            const hasCustom = !!data.custom_product_name;

            return hasProduct || hasCustom;
        },
        {
            message: 'You must provide either product_id OR custom product (name + image)',
            path: ['product_id'],
        }
    );