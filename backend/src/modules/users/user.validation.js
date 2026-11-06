import { z } from 'zod'
import { registerSchema } from '../auth/auth.validation.js'

const nullableTrimmedField = (schema) => z.preprocess(
    (value) => typeof value === 'string' ? value.trim() : value,
    schema.nullable().optional()
).transform((value) => value === '' || value === null ? null : value)

export const updateProfileSchema = z.object({
    name: registerSchema.shape.name.trim(),
    phone_number: nullableTrimmedField(registerSchema.shape.phone_number.unwrap()),
    whatsapp_number: nullableTrimmedField(registerSchema.shape.whatsapp_number.unwrap()),
    company_name: nullableTrimmedField(registerSchema.shape.company_name.unwrap()),
}).strict().refine(
    (profile) => Object.keys(profile).length > 0,
    { message: 'At least one profile field is required.' }
)
