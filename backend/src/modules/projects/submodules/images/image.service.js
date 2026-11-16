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

export const uploadImages = async (projectId, files) => {
    if (!Array.isArray(files) || files.length === 0) return []

    const { results } = await settleCloudinaryUploads(
        files.map(uploadToCloudinary),
        [],
        'PROJECT_IMAGES'
    )

    return persistWithCloudinaryCleanup(results, 'PROJECT_IMAGES', async () => {
        await repo.createMany(results.map((result) => ({
            project_id: projectId,
            image_url: result.secure_url,
        })))
        return results
    })
}