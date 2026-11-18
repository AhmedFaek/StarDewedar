import dotenv from 'dotenv'

dotenv.config()

export const isProductionNodeEnv = (nodeEnv = process.env.NODE_ENV) =>
    nodeEnv !== 'development' && nodeEnv !== 'test'

const getSharedProductionValue = ({
    name,
    rawValue,
    defaultValue,
    validate,
    invalidMessage,
}) => {
    const normalized = typeof rawValue === 'string' ? rawValue.trim() : rawValue

    if (normalized === undefined || normalized === null || normalized === '') {
        if (isProductionNodeEnv()) {
            throw new Error(`❌ Missing environment variable: ${name}`)
        }
        return defaultValue
    }

    if (validate && !validate(normalized)) {
        throw new Error(invalidMessage || `❌ Invalid environment variable: ${name}`)
    }

    return normalized
}

const requiredEnv = [
    'PORT',
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'CLOUDINARY_NAME',
    'CLOUDINARY_KEY',
    'CLOUDINARY_SECRET',
    'YAHOO_EMAIL',
    'YAHOO_PASSWORD',
    'FRONTEND_URL',
    'TURNSTILE_SECRET_KEY'
]

const nodeEnv = process.env.NODE_ENV
const configuredVerificationCodePepper = process.env.VERIFICATION_CODE_PEPPER
const fallbackVerificationCodePepper = 'star-dewedar-verification-code-test-fallback'
const defaultLocalSiteUrl = 'http://localhost:5173'
const defaultCorsOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:4173',
].join(',')

const normalizeCorsOrigins = (value) => value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => new URL(origin).origin)

// Validate required variables
requiredEnv.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`❌ Missing environment variable: ${key}`)
    }
})

const clientIpSource = getSharedProductionValue({
    name: 'CLIENT_IP_SOURCE',
    rawValue: process.env.CLIENT_IP_SOURCE,
    defaultValue: 'socket',
    validate: (value) => ['socket', 'x-real-ip'].includes(value),
    invalidMessage: '❌ CLIENT_IP_SOURCE must be either "socket" or "x-real-ip"',
})

const corsOrigins = getSharedProductionValue({
    name: 'CORS_ORIGINS',
    rawValue: process.env.CORS_ORIGINS,
    defaultValue: defaultCorsOrigins,
    validate: (value) => {
        const origins = value.split(',').map((origin) => origin.trim()).filter(Boolean)
        return origins.length > 0 && origins.every((origin) => {
            if (origin.includes('*')) return false
            try {
                const parsed = new URL(origin)
                return ['http:', 'https:'].includes(parsed.protocol) && Boolean(parsed.origin)
            } catch {
                return false
            }
        })
    },
    invalidMessage: '❌ CORS_ORIGINS must be a comma-separated list of exact http(s) origins without wildcards',
})

const siteUrl = getSharedProductionValue({
    name: 'SITE_URL',
    rawValue: process.env.SITE_URL,
    defaultValue: process.env.FRONTEND_URL || defaultLocalSiteUrl,
    validate: (value) => {
        try {
            const parsed = new URL(value)
            return !isProductionNodeEnv() || parsed.protocol === 'https:'
        } catch {
            return false
        }
    },
    invalidMessage: '❌ SITE_URL must be a valid http(s) URL; production requires https',
})

const verificationCodePepper = getSharedProductionValue({
    name: 'VERIFICATION_CODE_PEPPER',
    rawValue: configuredVerificationCodePepper,
    defaultValue: undefined,
    validate: (value) => value.length >= 32,
    invalidMessage: '❌ VERIFICATION_CODE_PEPPER must be at least 32 characters',
})

const jwtSecret = getSharedProductionValue({
    name: 'JWT_SECRET',
    rawValue: process.env.JWT_SECRET,
    defaultValue: undefined,
    validate: (value) => !isProductionNodeEnv() || value.length >= 32,
    invalidMessage: '❌ JWT_SECRET must be at least 32 characters in production',
})

const jwtRefreshSecret = getSharedProductionValue({
    name: 'JWT_REFRESH_SECRET',
    rawValue: process.env.JWT_REFRESH_SECRET,
    defaultValue: undefined,
    validate: (value) => !isProductionNodeEnv() || (
        value.length >= 32 && value !== jwtSecret
    ),
    invalidMessage: '❌ JWT_REFRESH_SECRET must be at least 32 characters and differ from JWT_SECRET in production',
})

if (isProductionNodeEnv() && clientIpSource === 'socket') {
    console.warn('🚨 WARNING: CLIENT_IP_SOURCE=socket in production may rate-limit all Railway users as one IP.')
}

if (!configuredVerificationCodePepper && !isProductionNodeEnv()) {
    console.warn('⚠️ VERIFICATION_CODE_PEPPER is unset; using a fixed non-secret development/test fallback')
}

export default {
    port: process.env.PORT,
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret,
    jwtRefreshSecret,
    cloudinaryName: process.env.CLOUDINARY_NAME,
    cloudinaryKey: process.env.CLOUDINARY_KEY,
    cloudinarySecret: process.env.CLOUDINARY_SECRET,
    yahooEmail: process.env.YAHOO_EMAIL,
    yahooPassword: process.env.YAHOO_PASSWORD,
    frontendUrl: process.env.FRONTEND_URL,
    apiPublicUrl: process.env.API_PUBLIC_URL || '',
    siteUrl,
    corsOrigins: normalizeCorsOrigins(corsOrigins),
    clientIpSource,
    nodeEnv,
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
    verificationCodePepper: verificationCodePepper || fallbackVerificationCodePepper,
    adminUrl: process.env.ADMIN_URL || 'http://localhost:3001',
    logoUrl: process.env.LOGO_URL || 'https://res.cloudinary.com/dqilswvel/image/upload/v1789837369/logo_z7m4wy.png',
}