import * as service from './auth.service.js'

/* POST /api/auth/register  — public, creates a customer account */
export const register = async (req, res, next) => {
    try {
        const result = await service.register(req.body)
        res.status(201).json(result)
    } catch (err) {
        next(err)
    }
}

/* POST /api/auth/create-user  — admin only, creates any role */
export const createUser = async (req, res, next) => {
    try {
        const user = await service.createUser(req.body)
        res.status(201).json(user)
    } catch (err) {
        next(err)
    }
}

/* POST /api/auth/login */
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body
        const result = await service.login(email, password)
        res.json(result)
    } catch (err) {
        next(err)
    }
}

/* POST /api/auth/refresh */
export const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body
        const data = await service.refreshToken(refreshToken)
        res.json(data)
    } catch (err) {
        next(err)
    }
}

/* POST /api/auth/logout  — requires valid access token */
export const logout = async (req, res, next) => {
    try {
        const { userId } = req.user
        const result = await service.logout(userId)
        res.json(result)
    } catch (err) {
        next(err)
    }
}