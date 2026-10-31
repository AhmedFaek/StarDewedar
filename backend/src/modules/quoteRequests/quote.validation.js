import { z } from 'zod';
import { egyptianPhoneSchema } from '../../utils/egyptianPhone.validation.js'

export const createQuoteRequestSchema = z.object({
    first_name: z.string().trim().min(2).max(100),
    last_name: z.string().trim().min(2).max(100),

    phone: egyptianPhoneSchema,

    email: z.string().email().max(254),

    product_id: z.string().trim().max(100).optional(),

    custom_product_name: z.string().trim().max(200).optional(),
    custom_image_url: z.never().optional(),

    details: z.string().trim().min(5).max(10000),

    file_url: z.never().optional(),
})
    .refine(
        (data) => {
            const hasProduct = !!data.product_id;
            const hasCustom = !!data.custom_product_name;

            return hasProduct || hasCustom;
        },
        {
            message: 'You must provide either product_id OR custom product (name + image)',
    }
    );

export const updateQuoteRequestSchema = z.object({
    status: z.enum(['pending', 'contacted', 'closed', 'in_progress', 'completed', 'rejected']).optional(),
    details: z.string().trim().min(5).max(10000).optional(),
    first_name: z.string().trim().min(2).max(100).optional(),
    last_name: z.string().trim().min(2).max(100).optional(),
    phone: egyptianPhoneSchema.optional(),
    email: z.string().email().max(254).optional(),
})