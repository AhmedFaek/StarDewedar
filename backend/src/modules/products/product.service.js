import * as repo from './product.repository.js'
import * as imageService from './submodules/images/image.service.js'
import * as catalogService from './submodules/catalogs/catalog.service.js'

const normalizeProductData = (data = {}) => ({
    name_en: data.name_en,
    name_ar: data.name_ar,
    description_en: data.description_en || null,
    description_ar: data.description_ar || null,
    price: data.price || null,
    category_id: data.category_id,
})

export const createProduct = async (data, files) => {
    console.log('Creating product with data:', data)
    const productData = normalizeProductData(data)
    const product = await repo.createProduct(productData)
    const productId = product.id

    // Upload images
    if (files?.images) {
        await imageService.uploadImages(productId, files.images)
    }

    // Upload catalog
    if (files?.catalog) {
        await catalogService.uploadCatalog(productId, files.catalog[0])
    }

    return product
}

export const getAllProducts = (options) => repo.getAllProducts(options)

export const getProductById = async (id) => {
    const product = await repo.getProductById(id)
    if (!product) throw new Error('Product not found')
    return product
}

export const updateProduct = (id, data) => {
    const payload = {}
    if (data.name_en !== undefined) payload.name_en = data.name_en
    if (data.name_ar !== undefined) payload.name_ar = data.name_ar
    if (data.description_en !== undefined) payload.description_en = data.description_en
    if (data.description_ar !== undefined) payload.description_ar = data.description_ar
    if (data.price !== undefined) payload.price = data.price
    if (data.category_id !== undefined) payload.category_id = data.category_id

    return repo.updateProduct(id, payload)
}

export const deleteProduct = (id) =>
    repo.deleteProduct(id)
