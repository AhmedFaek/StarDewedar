require('dotenv').config()

const requiredEnv = [
    'PORT',
    'DATABASE_URL',
]

// Validate required variables
requiredEnv.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`❌ Missing environment variable: ${key}`)
    }
})

module.exports = {
    port: process.env.PORT,
    databaseUrl: process.env.DATABASE_URL,
}