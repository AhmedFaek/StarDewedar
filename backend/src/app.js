const express = require('express')
const cors = require('cors')

const app = express()

// Middlewares
app.use(cors())
app.use(express.json())

// Test route
app.get('/', (req, res) => {
    res.send('API is running...')
})

module.exports = app