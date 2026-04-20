export default (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body)
        next()
    } catch (err) {
        return res.status(400).json({
            message: 'Validation Error',
            errors: err.errors,
        })
    }
}