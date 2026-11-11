import express from 'express'
import prisma from '../utils/prisma.js'

const router = express.Router()
const READINESS_TIMEOUT_MS = 2_000

router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' })
})

router.get('/ready', async (req, res) => {
    if (req.app.locals.isShuttingDown) {
        return res.status(503).json({ status: 'unavailable' })
    }

    let timeout
    try {
        await Promise.race([
            prisma.$queryRaw`SELECT 1`,
            new Promise((_, reject) => {
                timeout = setTimeout(() => reject(new Error('Readiness database check timed out')), READINESS_TIMEOUT_MS)
            }),
        ])
        return res.status(200).json({ status: 'ready' })
    } catch (error) {
        console.error('Readiness check failed', {
            reason: error?.message === 'Readiness database check timed out' ? 'timeout' : 'database_error',
            errorName: typeof error?.name === 'string' ? error.name : 'UnknownError',
        })
        return res.status(503).json({ status: 'unavailable' })
    } finally {
        clearTimeout(timeout)
    }
})

export default router
