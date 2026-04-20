import cloudinary from '../../../config/storage.js'
import * as repo from './catalog.repository.js'

export const uploadCatalog = async (productId, file) => {
    const result = await cloudinary.uploader.upload_stream(
        { resource_type: 'raw' },
        async (error, result) => {
            if (error) throw error

            await repo.createCatalog({
                product_id: productId,
                file_url: result.secure_url,
            })
        }
    )

    result.end(file.buffer)
}