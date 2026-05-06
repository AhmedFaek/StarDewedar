import { z } from 'zod'
import { ROLES } from '../../utils/constants.js'

/* ── Customer self-registration ─────────────────────────────────────────── */
export const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    whatsapp_number: z.string().optional(),
    phone_number: z.string().optional(),
    company_name: z.string().optional(),
})

/* ── Admin: create any user with explicit role ──────────────────────────── */
export const createUserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    whatsapp_number: z.string().optional(),
    phone_number: z.string().optional(),
    company_name: z.string().optional(),
    role: z.enum([ROLES.ADMIN, ROLES.CUSTOMER]),
})

/* ── Login ──────────────────────────────────────────────────────────────── */
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

/* ── Refresh ────────────────────────────────────────────────────────────── */
export const refreshSchema = z.object({
    refreshToken: z.string(),
})