import * as repo from './product.repository.js'
import * as imageService from './submodules/images/image.service.js'
import * as catalogService from './submodules/catalogs/catalog.service.js'
import * as specService from './submodules/specifications/spec.service.js'

export const createProduct = async (data, files) => {
    const { specifications, ...productData } = data

    // 1. Create product
    const product = await repo.createProduct(productData)

    const productId = product.id

    // 2. Upload images
    if (files.images) {
        await imageService.uploadImages(productId, files.images)
    }

    // 3. Upload catalog
    if (files.catalog) {
        await catalogService.uploadCatalog(productId, files.catalog[0])
    }

    // 4. Save specs
    if (specifications) {
        await specService.createSpecs(productId, specifications)
    }

    return product
}

export const getAllProducts = () => repo.getAllProducts()

export const getProductById = async (id) => {
    const product = await repo.getProductById(id)
    if (!product) throw new Error('Product not found')
    return product
}

export const updateProduct = (id, data) => repo.updateProduct(id, data)

export const deleteProduct = (id) => repo.deleteProduct(id)