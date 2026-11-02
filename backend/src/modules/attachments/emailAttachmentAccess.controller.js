import * as service from './emailAttachmentAccess.service.js'

export const downloadEmailAttachment = async (req, res, next) => {
    try {
        const signedUrl = await service.createEmailAttachmentDownloadUrl(
            req.params.token
        )

        if (!signedUrl) {
            return res.status(404).json({
                success: false,
                message: 'Attachment link is invalid or unavailable',
            })
        }

        res.set('Cache-Control', 'no-store')
        res.set('Referrer-Policy', 'no-referrer')
        return res.redirect(302, signedUrl)
    } catch (error) {
        return next(error)
    }
}
