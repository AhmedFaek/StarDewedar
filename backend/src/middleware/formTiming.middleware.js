const FORM_TIMING_MINIMUM_MS = 2000
const FORM_TIMING_HEADER_PATTERN = /^[0-9]{1,9}(?![\s\S])/

export const validateFormTiming = (req, res, next) => {
    const elapsedMs = req.headers?.['x-form-elapsed-ms']

    if (typeof elapsedMs !== 'string' || !FORM_TIMING_HEADER_PATTERN.test(elapsedMs)) {
        return res.status(400).json({
            success: false,
            code: 'FORM_TIMING_MISSING',
            message: 'Please keep the form open for at least 2 seconds before submitting.',
        })
    }

    if (Number(elapsedMs) < FORM_TIMING_MINIMUM_MS) {
        return res.status(400).json({
            success: false,
            code: 'FORM_TOO_FAST',
            message: 'Please keep the form open for at least 2 seconds before submitting.',
        })
    }

    return next()
}
