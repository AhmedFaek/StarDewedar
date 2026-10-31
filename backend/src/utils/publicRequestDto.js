export const toPublicRequest = (request) => {
    if (!request || typeof request !== 'object') return request
    return Object.fromEntries(
        Object.entries(request).filter(([key]) =>
            key !== 'assets' && !key.startsWith('notification_')
        )
    )
}

export const toAdminRequest = (request) => {
    if (!request || typeof request !== 'object') return request
    const { notification_lease_token, ...safeRequest } = request
    return safeRequest
}
