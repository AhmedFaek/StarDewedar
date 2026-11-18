import { z } from 'zod'
import { ROLES, ADMIN_ROLES } from '../../utils/constants.js'
import { optionalEgyptianPhoneSchema } from '../../utils/egyptianPhone.validation.js'
import { strongPasswordSchema } from '../../utils/passwordPolicy.js'

/* ── Customer self-registration ─────────────────────────────────────────── */
export const registerSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email().max(254),
    password: strongPasswordSchema,
    whatsapp_number: optionalEgyptianPhoneSchema,
    phone_number: optionalEgyptianPhoneSchema,
    company_name: z.string().max(150).optional(),
})

/* ── Admin: create any user with explicit role ──────────────────────────── */
export const createUserSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email().max(254),
    password: strongPasswordSchema,
    whatsapp_number: optionalEgyptianPhoneSchema,
    phone_number: optionalEgyptianPhoneSchema,
    company_name: z.string().max(150).optional(),
    role: z.enum([...ADMIN_ROLES, ROLES.CUSTOMER]),
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
    newPassword: strongPasswordSchema,
})

/* ── Change Password (authenticated) ───────────────────────────────────── */
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required').max(128),
    newPassword: strongPasswordSchema,
})

/* ── Verify Email ──────────────────────────────────────────────────────── */
export const verifyEmailSchema = z.object({
    email: z.string().email('Please provide a valid email address').max(254),
    code: z.string().regex(/^\d{6}$/, 'Verification code must be 6 digits'),
})

/* ── Resend Verification Code ──────────────────────────────────────────── */
export const resendVerificationSchema = z.object({
    email: z.string().email('Please provide a valid email address').max(254),
})