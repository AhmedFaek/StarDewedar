// dashboard.controller.js
import * as service from './dashboard.service.js'

export const getStats = async (req, res, next) => {
    try {
        const stats = await service.getStats()
        res.json(stats)
    } catch (err) {
        next(err)
    }
}