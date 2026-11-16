import cloudinary from '../../../../config/storage.js'
import * as repo from './catalog.repository.js'
import {
    persistWithCloudinaryCleanup,
    settleCloudinaryUploads,
} from '../../../../utils/cloudinaryCleanup.js'

const uploadPDF = (file) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { 
                resource_type: 'auto'
            },
            (error, result) => {
                if (error) return reject(error)
                resolve(result)
            }
        )

        stream.end(file.buffer)
    })
}

export const uploadCatalog = async (productId, file, data = {}) => {
    const { results: [result] } = await settleCloudinaryUploads(
        [uploadPDF(file)],
        [],
        'PRODUCT_CATALOG'
    )

    return persistWithCloudinaryCleanup([result], 'PRODUCT_CATALOG', async () => {
        await repo.createCatalog({
            product_id: productId,
            title_en: data.title_en || null,
            title_ar: data.title_ar || null,
            file_url: result.secure_url,
        })
        return result
    })
}

export const getCatalogsByProductId = (productId) => {
    return repo.getAllCatalogsByProductId(productId)
}