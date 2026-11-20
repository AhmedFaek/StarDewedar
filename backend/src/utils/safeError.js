export const safeStack = (error) => {
    if (typeof error?.stack !== 'string') return []

    return error.stack
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter((line) => line.startsWith('at '))
        .slice(0, 15)
}

export const safeErrorDetails = (error) => ({
    errorName: typeof error?.name === 'string' ? error.name : 'UnknownError',
    ...(typeof error?.code === 'string' && error.code.length <= 64
        ? { errorCode: error.code }
        : {}),
    frames: safeStack(error),
})

export const safeRequestErrorDetails = (req, error, status) => {
    const baseUrl = typeof req?.baseUrl === 'string' ? req.baseUrl : ''
    const routePath = typeof req?.route?.path === 'string' ? req.route.path : ''

    return {
        method: typeof req?.method === 'string' ? req.method : 'UNKNOWN',
        route: `${baseUrl}${routePath}` || baseUrl,
        status,
        ...safeErrorDetails(error),
    }
}
