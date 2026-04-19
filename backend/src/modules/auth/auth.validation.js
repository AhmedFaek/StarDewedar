const { z } = require('zod')
const { ROLES } = require('../../utils/constants')

const createUserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    whatsapp_number: z.string().optional(),
    role: z.enum([
        ROLES.CO_FOUNDER,
        ROLES.PROJECT_MANAGER,
        ROLES.ACCOUNT_MANAGER,
    ]),
})

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

const refreshSchema = z.object({
    refreshToken: z.string(),
})

module.exports = { createUserSchema, loginSchema, refreshSchema }