import cloudinary from '../config/storage.js'

// Ensures a successful upload includes the URL and identifiers needed to persist and later delete the asset.
export const validateCloudinaryUploadResult = (result) => {
    if (
        !result ||
        typeof result.public_id !== 'string' ||
        result.public_id.trim() === '' ||
        typeof result.resource_type !== 'string' ||
        result.resource_type.trim() === '' ||
        typeof result.secure_url !== 'string' ||
        result.secure_url.trim() === ''
    ) {
        const error = new Error('Cloudinary upload returned incomplete asset metadata')
        error.code = 'CLOUDINARY_INVALID_UPLOAD_RESPONSE'
        throw error
    }

    return result
}

// Logs a cleanup failure without exposing customer data or letting logging errors escape.
const logCleanupFailure = (requestType, asset, error, result) => {
    try {
        console.error('Cloudinary asset cleanup failed', {
            event: 'cloudinary_asset_cleanup_failed',
            requestType,
            publicId: asset?.public_id,
            resourceType: asset?.resource_type,
            errorCode: error?.code ?? result?.error?.code ?? result?.result,
            errorName: error?.name ?? result?.error?.name,
        })
    } catch {
        // Logging must not interfere with the request's original failure.
    }
}

// Deletes valid assets by public ID and resource type, returning each asset's cleanup outcome.
export const cleanupCloudinaryAssets = async (assets, requestType) => {
    try {
        const validAssets = Array.isArray(assets)
            ? assets.filter((asset) =>
                typeof asset?.public_id === 'string' &&
                asset.public_id.trim() !== '' &&
                typeof asset?.resource_type === 'string' &&
                asset.resource_type.trim() !== ''
            )
            : []

        if (Array.isArray(assets)) {
            for (const asset of assets) {
                if (!validAssets.includes(asset)) {
                    logCleanupFailure(requestType, asset, {
                        code: 'CLOUDINARY_INVALID_ASSET_METADATA',
                        name: 'CloudinaryCleanupError',
                    })
                }
            }
        } else if (assets != null) {
            logCleanupFailure(requestType, null, {
                code: 'CLOUDINARY_INVALID_ASSET_LIST',
                name: 'CloudinaryCleanupError',
            })
        }

        return await Promise.all(validAssets.map(async (asset) => {
            try {
                const response = await cloudinary.uploader.destroy(asset.public_id, {
                    resource_type: asset.resource_type,
                })

                if (response?.result === 'ok') {
                    return { asset, status: 'deleted' }
                }

                if (response?.result === 'not found') {
                    return { asset, status: 'already_missing' }
                }

                logCleanupFailure(requestType, asset, null, response)
                return { asset, status: 'failed' }
            } catch (error) {
                logCleanupFailure(requestType, asset, error)
                return { asset, status: 'failed' }
            }
        }))
    } catch (error) {
        logCleanupFailure(requestType, null, error)
        return []
    }
}

// Runs persistence and, on failure, best-effort deletes uploaded assets before rethrowing the original error.
export const persistWithCloudinaryCleanup = async (assets, requestType, persist) => {
    try {
        return await persist()
    } catch (error) {
        try {
            await cleanupCloudinaryAssets(assets, requestType)
        } catch {
            // Cleanup is best-effort; preserve the persistence error.
        }
        throw error
    }
}

// Waits for every upload to settle; cleans confirmed assets and rethrows if any upload fails or returns invalid metadata.
export const settleCloudinaryUploads = async (uploads, existingAssets, requestType) => {
    const results = await Promise.allSettled(uploads)
    const successfulResults = []
    const validationErrors = []

    for (const result of results) {
        if (result.status !== 'fulfilled') continue

        try {
            successfulResults.push(validateCloudinaryUploadResult(result.value))
        } catch (error) {
            validationErrors.push(error)
        }
    }

    const assets = [...existingAssets, ...successfulResults]
    const failedResult = results.find((result) => result.status === 'rejected')
    const uploadError = failedResult?.reason || validationErrors[0]

    if (uploadError) {
        try {
            await cleanupCloudinaryAssets(assets, requestType)
        } catch {
            // Cleanup is best-effort; preserve the upload error.
        }
        throw uploadError
    }

    return { results: successfulResults, assets }
}
