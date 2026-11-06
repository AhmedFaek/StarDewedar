import crypto from 'node:crypto'
import env from '../../config/env.js'

export const hashVerificationCode = (rawCode, pepper = env.verificationCodePepper) => (
    crypto.createHmac('sha256', pepper).update(rawCode).digest('hex')
)
