import cloudinary from '../../../../config/storage.js'
import * as repo from './image.repository.js'
import {
    persistWithCloudinaryCleanup,
    settleCloudinaryUploads,
} from '../../../../utils/cloudinaryCleanup.js'

const uploadToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'image' },
            (error, result) => {
                if (error) return reject(error)
                resolve(result)
            }
        )

        stream.end(file.buffer) // ✅ correct place
    })
}

export const uploadImages = async (productId, files) => {
    const { results } = await settleCloudinaryUploads(
        files.map(uploadToCloudinary),
        [],
        'PRODUCT_IMAGES'
    )

    return persistWithCloudinaryCleanup(results, 'PRODUCT_IMAGES', async () => {
        await Promise.all(results.map((result) => repo.createImage({
            product_id: productId,
            image_url: result.secure_url,
        })))
        return results
    })
}