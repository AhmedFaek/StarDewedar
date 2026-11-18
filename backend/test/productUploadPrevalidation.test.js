import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

const state = {
    productCreates: 0,
    imageUploads: 0,
    catalogUploads: 0,
}

mock.module(new URL('../src/modules/products/product.repository.js', import.meta.url).href, {
    exports: {
        createProduct: async () => {
            state.productCreates += 1
            return { id: 'product-id' }
        },
        deleteProduct: async () => {},
        getAllProducts: async () => [],
        getProductById: async () => null,
        updateProduct: async () => null,
    },
})
mock.module(new URL('../src/modules/products/submodules/images/image.service.js', import.meta.url).href, {
    exports: {
        uploadImages: async () => {
            state.imageUploads += 1
            return []
        },
    },
})
mock.module(new URL('../src/modules/products/submodules/catalogs/catalog.service.js', import.meta.url).href, {
    exports: {
        uploadCatalog: async () => {
            state.catalogUploads += 1
        },
        getCatalogsByProductId: async () => [],
    },
})
mock.module(new URL('../src/utils/cloudinaryCleanup.js', import.meta.url).href, {
    exports: { cleanupCloudinaryAssets: async () => [] },
})

const { createProduct } = await import('../src/modules/products/product.service.js')

test('invalid file content is rejected before product creation or any Cloudinary upload', async () => {
    await assert.rejects(
        createProduct({}, {
            images: [{
                originalname: 'not-an-image.png',
                mimetype: 'image/png',
                buffer: Buffer.from('%PDF-1.7\nexample\n%%EOF'),
            }],
        }),
        { code: 'INVALID_UPLOAD', status: 400 }
    )
    assert.deepEqual(state, {
        productCreates: 0,
        imageUploads: 0,
        catalogUploads: 0,
    })
})
