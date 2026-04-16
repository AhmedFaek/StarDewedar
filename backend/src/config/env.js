require('dotenv').config()

const requiredEnv = [
    'PORT',
]

// Validate required variables
requiredEnv.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`❌ Missing environment variable: ${key}`)
    }
})

module.exports = {
    port: process.env.PORT,
}