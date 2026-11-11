import app from './app.js'
import env from './config/env.js'
import prisma from './utils/prisma.js'
import {
    configureServerTimeouts,
    createGracefulShutdown,
} from './utils/serverLifecycle.js'
import { safeErrorDetails } from './utils/safeError.js'

const server = app.listen(env.port, () => {
    console.log(`🚀 Server running on port ${env.port}`)
})

configureServerTimeouts(server)

const shutdown = createGracefulShutdown({ server, prisma, app })

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception', safeErrorDetails(error))
    shutdown('uncaughtException', 1)
})
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection', safeErrorDetails(reason))
})