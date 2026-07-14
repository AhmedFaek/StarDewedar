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
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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

    const status = resolveErrorStatus(err)
    const message = err?.message || 'Something went wrong'
    const payload = { message }

    if (Array.isArray(err?.errors) && err.errors.length > 0) {
        payload.errors = err.errors
    }

    res.status(status).json(payload)
})

export default app
