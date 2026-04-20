import * as service from './product.service.js'

export const createProduct = async (req, res, next) => {
    try {
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