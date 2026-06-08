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
]

// Validate required variables
requiredEnv.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`❌ Missing environment variable: ${key}`)
    }
})

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
}