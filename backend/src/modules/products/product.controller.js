import * as service from './product.service.js'

export const createProduct = async (req, res, next) => {
    try {
        // Parse specifications if provided
        if (req.body.specifications) {
            try {
                req.body.specifications = JSON.parse(req.body.specifications)
            } catch (err) {
                console.error('Failed to parse specifications:', err.message)
                // Keep as string if JSON parse fails
            }
        }

        const product = await service.createProduct(req.body, req.files)
        res.status(201).json(product)
    } catch (err) {
        next(err)
    }
}

export const getAllProducts = async (req, res) => {
    const data = await service.getAllProducts()
    res.json(data)
}

export const getProductById = async (req, res) => {
    const data = await service.getProductById(req.params.id)
    res.json(data)
}

export const updateProduct = async (req, res) => {
    const data = await service.updateProduct(req.params.id, req.body)
    res.json(data)
}

export const deleteProduct = async (req, res) => {
    await service.deleteProduct(req.params.id)
    res.json({ message: 'Deleted successfully' })
}