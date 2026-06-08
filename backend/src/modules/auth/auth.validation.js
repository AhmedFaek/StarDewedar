import { z } from 'zod'
import { ROLES } from '../../utils/constants.js'

/* ─── Shared: strong password rule ───────────────────────────────────────── */

const strongPassword = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')

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

/* ── Forgot Password ───────────────────────────────────────────────────── */
export const forgotPasswordSchema = z.object({
    email: z.string().email('Please provide a valid email address'),
})

/* ── Reset Password ────────────────────────────────────────────────────── */
export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    newPassword: strongPassword,
})

/* ── Change Password (authenticated) ───────────────────────────────────── */
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: strongPassword,
})