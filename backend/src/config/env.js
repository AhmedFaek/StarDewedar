import dotenv from 'dotenv'

dotenv.config()

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
const usesNonProductionPepperFallback = nodeEnv === 'development' || nodeEnv === 'test'
const fallbackVerificationCodePepper = 'star-dewedar-verification-code-test-fallback'

// Validate required variables
requiredEnv.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`❌ Missing environment variable: ${key}`)
    }
})

if (configuredVerificationCodePepper && configuredVerificationCodePepper.length < 32) {
    throw new Error('❌ VERIFICATION_CODE_PEPPER must be at least 32 characters')
}

if (!configuredVerificationCodePepper && !usesNonProductionPepperFallback) {
    throw new Error('❌ Missing environment variable: VERIFICATION_CODE_PEPPER')
}

if (!configuredVerificationCodePepper) {
    console.warn('⚠️ VERIFICATION_CODE_PEPPER is unset; using a fixed non-secret development/test fallback')
}

export default {
    port: process.env.PORT,
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    cloudinaryName: process.env.CLOUDINARY_NAME,
    cloudinaryKey: process.env.CLOUDINARY_KEY,
    cloudinarySecret: process.env.CLOUDINARY_SECRET,
    yahooEmail: process.env.YAHOO_EMAIL,
    yahooPassword: process.env.YAHOO_PASSWORD,
    frontendUrl: process.env.FRONTEND_URL,
    apiPublicUrl: process.env.API_PUBLIC_URL || '',
    nodeEnv,
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
    verificationCodePepper: configuredVerificationCodePepper || fallbackVerificationCodePepper,
    adminUrl: process.env.ADMIN_URL || 'http://localhost:3001',
    logoUrl: process.env.LOGO_URL || 'https://res.cloudinary.com/dqilswvel/image/upload/v1789837369/logo_z7m4wy.png',
}