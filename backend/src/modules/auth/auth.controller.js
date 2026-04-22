import * as service from './auth.service.js'

export const createUser = async (req, res, next) => {
    try {
        const user = await service.createUser(req.body)
        res.status(201).json(user)
    } catch (err) {
        next(err)
    }
}

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body
        const tokens = await service.login(email, password)
        res.json(tokens)
    } catch (err) {
        next(err)
    }
}

export const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body
        const data = service.refreshToken(refreshToken)
        res.json(data)
    } catch (err) {
        next(err)
    }
}

export const logout = async (req, res, next) => {
    try {
        const { userId } = req.user // From auth middleware
        const result = await service.logout(userId)
        res.json(result)
    } catch (err) {
        next(err)
    }
}