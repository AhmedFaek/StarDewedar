export const configureServerTimeouts = (server) => {
    // Keep idle sockets above a typical 60-second proxy timeout to avoid intermittent 502s.
    server.keepAliveTimeout = 65_000
    server.headersTimeout = 66_000
    server.requestTimeout = 600_000
}

export const createGracefulShutdown = ({
    server,
    prisma,
    app,
    logger = console,
    timeoutMs = 10_000,
    schedule = setTimeout,
    cancel = clearTimeout,
    scheduleInterval = setInterval,
    cancelInterval = clearInterval,
    forceExit = (code) => process.exit(code),
}) => {
    let shuttingDown = false
    let exitCalled = false
    let idleCloseInterval

    const exitOnce = (code) => {
        if (exitCalled) return
        exitCalled = true
        cancelInterval(idleCloseInterval)
        forceExit(code)
    }

    return (signal, exitCode = 0) => {
        if (shuttingDown) return
        shuttingDown = true
        app.locals.isShuttingDown = true
        logger.info(`Received ${signal}; beginning graceful shutdown`)

        const forceTimer = schedule(() => {
            if (exitCalled) return
            logger.error('Graceful shutdown timed out; closing remaining connections')
            server.closeAllConnections?.()
            prisma.$disconnect().catch((error) => {
                logger.error('Prisma disconnect failed during forced shutdown', {
                    errorName: typeof error?.name === 'string' ? error.name : 'UnknownError',
                })
            })
            exitOnce(1)
        }, timeoutMs)

        idleCloseInterval = scheduleInterval(() => {
            server.closeIdleConnections?.()
        }, 250)
        idleCloseInterval.unref?.()

        server.close(async (error) => {
            if (exitCalled) return
            let finalExitCode = exitCode
            if (error) {
                logger.error('HTTP server close failed', {
                    errorName: typeof error.name === 'string' ? error.name : 'UnknownError',
                })
                finalExitCode = 1
            }

            try {
                await prisma.$disconnect()
            } catch (disconnectError) {
                logger.error('Prisma disconnect failed', {
                    errorName: typeof disconnectError?.name === 'string'
                        ? disconnectError.name
                        : 'UnknownError',
                })
                finalExitCode = 1
            }

            cancel(forceTimer)
            exitOnce(finalExitCode)
        })

        server.closeIdleConnections?.()
    }
}
