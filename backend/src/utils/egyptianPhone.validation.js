import { z } from 'zod'
import { isValidEgyptianPhoneNumber } from '../../../shared/egyptianPhone.js'

export const egyptianPhoneSchema = z.string().refine(
    isValidEgyptianPhoneNumber,
    'Phone number must be 11 digits starting with 01 or +20 followed by 10 digits.'
)

export const optionalEgyptianPhoneSchema = z.union([
    z.literal(''),
    egyptianPhoneSchema,
]).optional()
