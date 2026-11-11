import net from 'node:net'
import env from '../config/env.js'

const socketClientIp = (req) => {
    const socketAddress = req.socket?.remoteAddress
    return typeof socketAddress === 'string' && net.isIP(socketAddress)
        ? socketAddress
        : '127.0.0.1'
}

export const getClientIp = (req) => {
    if (env.clientIpSource === 'x-real-ip') {
        const headerValue = req.headers?.['x-real-ip']

        if (typeof headerValue === 'string') {
            const firstValidValue = headerValue
                .split(',')
                .map((value) => value.trim())
                .find((value) => net.isIP(value))
            if (firstValidValue) return firstValidValue
        }
        return socketClientIp(req)
    }

    return socketClientIp(req)
}
