import * as userRepo from './user.repository.js'

/**
 * GET /api/users/me/saved-products
 * Returns all saved products for the authenticated user.
 */
export const getMySavedProducts = async (req, res, next) => {
    try {
        const { userId } = req.user
        const saved = await userRepo.getSavedProducts(userId)
        // Return just the product objects with the saved_at timestamp
        const products = saved.map(({ product, saved_at }) => ({ ...product, saved_at }))
        res.json(products)
    } catch (err) {
        next(err)
    }
}

/**
 * POST /api/users/me/saved-products/:productId
 * Saves a product to the authenticated user's favourites.
 */
export const saveProduct = async (req, res, next) => {
    try {
        const { userId } = req.user
        const { productId } = req.params
        const record = await userRepo.saveProduct(userId, productId)
        res.status(201).json({ message: 'Product saved.', saved_at: record.saved_at })
    } catch (err) {
        // Unique constraint violation — already saved
        if (err?.code === 'P2002') {
            return res.status(409).json({ message: 'Product already saved.' })
        }
        next(err)
    }
}

/**
 * DELETE /api/users/me/saved-products/:productId
 * Removes a product from the authenticated user's favourites.
 */
export const unsaveProduct = async (req, res, next) => {
    try {
        const { userId } = req.user
        const { productId } = req.params
        await userRepo.unsaveProduct(userId, productId)
        res.json({ message: 'Product removed from saved.' })
    } catch (err) {
        // Record not found
        if (err?.code === 'P2025') {
            return res.status(404).json({ message: 'Saved product not found.' })
        }
        next(err)
    }
}

/**
 * GET /api/users/me/saved-products/:productId/check
 * Returns { saved: true/false } for a specific product.
 */
export const checkSaved = async (req, res, next) => {
    try {
        const { userId } = req.user
        const { productId } = req.params
        const record = await userRepo.isProductSaved(userId, productId)
        res.json({ saved: Boolean(record), saved_at: record?.saved_at ?? null })
    } catch (err) {
        next(err)
    }
}
