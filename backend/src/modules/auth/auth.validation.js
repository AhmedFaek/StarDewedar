import { z } from 'zod'
import { ROLES } from '../../utils/constants.js'

/* ─── Shared: strong password rule ───────────────────────────────────────── */

const strongPassword = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')

/* ── Customer self-registration ─────────────────────────────────────────── */
export const registerSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email().max(254),
    password: strongPassword,
    whatsapp_number: z.string().max(30).optional(),
    phone_number: z.string().max(30).optional(),
    company_name: z.string().max(150).optional(),
})

/* ── Admin: create any user with explicit role ──────────────────────────── */
export const createUserSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email().max(254),
    password: strongPassword,
    whatsapp_number: z.string().max(30).optional(),
    phone_number: z.string().max(30).optional(),
    company_name: z.string().max(150).optional(),
    role: z.enum([ROLES.ADMIN, ROLES.CUSTOMER]),
})

/* ── Login ──────────────────────────────────────────────────────────────── */
export const loginSchema = z.object({
    email: z.string().email().max(254),
    password: z.string().min(6).max(128),
})

/* ── Refresh ────────────────────────────────────────────────────────────── */
export const refreshSchema = z.object({
    refreshToken: z.string().max(1000),
})

/* ── Forgot Password ───────────────────────────────────────────────────── */
export const forgotPasswordSchema = z.object({
    email: z.string().email('Please provide a valid email address').max(254),
})

/* ── Reset Password ────────────────────────────────────────────────────── */
export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required').max(500),
    newPassword: strongPassword,
})

/* ── Change Password (authenticated) ───────────────────────────────────── */
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required').max(128),
    newPassword: strongPassword,
})