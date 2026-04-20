import cloudinary from '../../../config/storage.js'
import * as repo from './image.repository.js'

export const uploadImages = async (productId, files) => {
    const uploads = files.map(async (file) => {
        const result = await cloudinary.uploader.upload_stream(
            { resource_type: 'image' },
            async (error, result) => {
                if (error) throw error

                await repo.createImage({
                    product_id: productId,
                    image_url: result.secure_url,
                })
            }
        )

        uploads.end(file.buffer)
    })

    await Promise.all(uploads)
}