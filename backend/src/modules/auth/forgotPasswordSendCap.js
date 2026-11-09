import crypto from 'node:crypto'
import { normalizeEmail } from '../../utils/emailValidation.service.js'

const SEND_CAP = 5
const WINDOW_MS = 24 * 60 * 60 * 1000
const MAX_EMAIL_KEYS = 10_000
let emailWindows = new Map()
let reservationKeys = new WeakMap()

const emailKey = (email) => crypto
    .createHash('sha256')
    .update(normalizeEmail(email))
    .digest('hex')

const prune = (key, now) => {
    const reservations = emailWindows.get(key)
    if (!reservations) return []

    const active = reservations.filter(({ createdAt }) => now - createdAt < WINDOW_MS)
    if (active.length === 0) {
        emailWindows.delete(key)
        return []
    }

    emailWindows.delete(key)
    emailWindows.set(key, active)
    return active
}

const evictOldestKey = () => {
    const oldestKey = emailWindows.keys().next().value
    if (oldestKey !== undefined) emailWindows.delete(oldestKey)
}

export const reserveForgotPasswordSend = (email, now = Date.now()) => {
    const key = emailKey(email)
    const reservations = prune(key, now)

    if (reservations.length >= SEND_CAP) return null

    if (!emailWindows.has(key) && emailWindows.size >= MAX_EMAIL_KEYS) {
        evictOldestKey()
    }

    const reservation = { createdAt: now }
    reservationKeys.set(reservation, key)
    emailWindows.set(key, [...reservations, reservation])
    return reservation
}

export const releaseForgotPasswordSend = (reservation, now = Date.now()) => {
    const key = reservationKeys.get(reservation)
    if (!key) return

    reservationKeys.delete(reservation)
    const reservations = prune(key, now).filter((entry) => entry !== reservation)
    if (reservations.length === 0) {
        emailWindows.delete(key)
    } else {
        emailWindows.set(key, reservations)
    }
}

export const clearForgotPasswordSendCapForTests = () => {
    emailWindows = new Map()
    reservationKeys = new WeakMap()
}
