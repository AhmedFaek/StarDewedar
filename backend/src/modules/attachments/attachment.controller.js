import * as service from './attachment.service.js'

const handleError = (error, res, next) => {
    if (error?.code === 'ATTACHMENT_FORBIDDEN') {
        return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    return next(error)
}

export const getAttachment = async (req, res, next) => {
    try {
        const attachment = await service.getAttachmentMetadata(
            req.params.id,
            req.user
        )

        if (!attachment) {
            return res.status(404).json({
                success: false,
                message: 'Attachment not found',
            })
        }

        res.set('Cache-Control', 'no-store')
        res.status(200).json({ success: true, data: attachment })
    } catch (error) {
        handleError(error, res, next)
    }
}

export const downloadAttachment = async (req, res, next) => {
    try {
        const signedUrl = await service.createAttachmentDownloadUrl(
            req.params.id,
            req.user
        )

        if (!signedUrl) {
            return res.status(404).json({
                success: false,
                message: 'Attachment not found',
            })
        }

        res.set('Cache-Control', 'no-store')
        res.set('Referrer-Policy', 'no-referrer')
        res.redirect(302, signedUrl)
    } catch (error) {
        handleError(error, res, next)
    }
}
