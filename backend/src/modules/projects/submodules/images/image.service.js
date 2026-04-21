import cloudinary from '../../../../config/storage.js'
import * as repo from './image.repository.js'

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
    const uploads = files.map(async (file) => {
        const result = await uploadToCloudinary(file)

        return repo.createMany({
            project_id: projectId,
            image_url: result.secure_url,
        })
    })

    await Promise.all(uploads)
}