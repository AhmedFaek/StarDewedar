const express = require('express')
const cors = require('cors')
const authRoutes = require('./modules/auth/auth.routes.js')

const app = express()

// Middlewares
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)

// Test route
app.get('/', (req, res) => {
    res.send('API is running...')
})

module.exports = app