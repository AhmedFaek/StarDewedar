import express from 'express'
import cors from 'cors'
import authRoutes from './modules/auth/auth.routes.js'
import categoryRoutes from './modules/categories/category.routes.js'
import productRoutes from './modules/products/product.routes.js'
import projectRoutes from './modules/projects/project.routes.js'
import contactRoutes from './modules/contactMessages/contact.routes.js'
import quoteRoutes from './modules/quoteRequests/quote.routes.js'
import visitRoutes from './modules/visitRequests/visit.routes.js'
import dashboardRoutes from './modules/dashboard/dashboard.routes.js'
import userRoutes from './modules/users/user.routes.js'

const app = express()

const resolveErrorStatus = (err) => {
    if (typeof err?.status === 'number') return err.status
    if (typeof err?.statusCode === 'number') return err.statusCode
    if (typeof err?.code === 'number' && err.code >= 400 && err.code < 600) return err.code

    const message = String(err?.message || '').toLowerCase()
    const code = String(err?.code || '').toUpperCase()

    if (
        code.startsWith('LIMIT_') ||
        message.includes('file too large') ||
        message.includes('invalid file') ||
        message.includes('file extension')
    ) {
        return 400
    }

    if (
        message.includes('invalid credentials') ||
        message.includes('invalid token') ||
        message.includes('invalid refresh token') ||
        message.includes('unauthorized')
    ) {
        return 401
    }

    if (message.includes('forbidden')) return 403
    if (message.includes('not found')) return 404
    if (message.includes('validation')) return 400
    if (message.includes('already exists') || message.includes('conflict')) return 409

    return 500
}

// Middlewares
app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/products', productRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/quotes', quoteRoutes)
app.use('/api/visits', visitRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/users', userRoutes)

// Test route
app.get('/', (req, res) => {
    res.send('API is running...')
})

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err)
    }

    // Always log detailed error server-side for debugging
    console.error('❌ Server Error:', err)

    const status = resolveErrorStatus(err)
    const isProduction = process.env.NODE_ENV === 'production'

    // Operational/Client errors (< 500) keep user-friendly error details
    if (status < 500) {
        const payload = { message: err?.message || 'Bad Request' }
        if (Array.isArray(err?.errors) && err.errors.length > 0) {
            payload.errors = err.errors
        }
        return res.status(status).json(payload)
    }

    // 500 Internal Server Errors: Sanitize sensitive details in production
    if (isProduction) {
        return res.status(500).json({
            message: 'Internal Server Error'
        })
    }

    // Return detailed error details only in development
    return res.status(500).json({
        message: err?.message || 'Internal Server Error',
        stack: err?.stack,
        ...(err?.errors ? { errors: err.errors } : {})
    })
})

export default app
