import express from 'express'
import cors from 'cors'
import authRoutes from './modules/auth/auth.routes.js'
import categoryRoutes from './modules/categories/category.routes.js'
import productRoutes from './modules/products/product.routes.js'
import projectRoutes from './modules/projects/project.routes.js'
import contactRoutes from './modules/contactMessages/contact.routes.js'
import quoteRoutes from './modules/quoteRequests/quote.routes.js'
import visitRoutes from './modules/visitRequests/visit.routes.js'

const app = express()

// Middlewares
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/products', productRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/quotes', quoteRoutes)
app.use('/api/visits', visitRoutes)

// Test route
app.get('/', (req, res) => {
    res.send('API is running...')
})

export default app