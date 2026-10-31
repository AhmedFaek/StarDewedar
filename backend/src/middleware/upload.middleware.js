import multer from 'multer'
import path from 'path'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_STANDARD_FILE_BYTES = MAX_FILE_SIZE
const MAX_STANDARD_REQUEST_BYTES = 11 * 1024 * 1024
const MAX_STANDARD_FIELDS = 20

// ── Standard upload (Visit / Quote) ──────────────────────────────────────────
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

// ── BOQ upload — additionally allows spreadsheet formats ─────────────────────
const BOQ_MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB
const BOQ_MAX_FILES = 6
const BOQ_MAX_AGGREGATE_FILE_BYTES = 120 * 1024 * 1024
const BOQ_MAX_REQUEST_BYTES = 125 * 1024 * 1024
const MAX_MULTIPART_FIELD_BYTES = 64 * 1024
const BOQ_MAX_FIELDS = 20
const BOQ_ALLOWED_EXTENSIONS = ['.pdf', '.xls', '.xlsx', '.csv']
const BOQ_ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/csv',
]

/*
 * Create a size-limit error with a stable code and HTTP status.
 * The application error handler uses these values to return a generic 413
 * response without exposing stream, parser, or request details to the client.
 */
const makeLimitError = (code, message) => {
    const error = new Error(message)
    error.code = code
    error.status = 413
    return error
}

/*
 * Create a Multer memory-storage engine with an aggregate file-byte ceiling.
 * Each file's stream is counted as it is consumed, before chunks are retained,
 * so a multi-file request cannot buffer more than the configured aggregate.
 * Multer receives the completed Buffer only after that file's stream ends.
 */
export const createLimitedMemoryStorage = (maxAggregateBytes) => ({
    /*
     * Consume one uploaded file stream, incrementing the request's shared
     * aggregate byte count for every chunk. On overflow, discard this file's
     * buffered chunks, report a 413-compatible error once, and drain the
     * remaining stream so Multer can finish aborting the multipart request.
     */
    _handleFile(req, file, callback) {
        const chunks = []
        let fileBytes = 0
        let failed = false
        let completed = false

        file.stream.on('data', (chunk) => {
            if (failed) return

            const aggregateBytes = (req.uploadedFileBytes || 0) + chunk.length
            if (aggregateBytes > maxAggregateBytes) {
                failed = true
                chunks.length = 0
                callback(makeLimitError(
                    'LIMIT_AGGREGATE_FILE_SIZE',
                    'Uploaded files exceed the maximum combined size.'
                ))
                file.stream.resume()
                return
            }

            req.uploadedFileBytes = aggregateBytes
            fileBytes += chunk.length
            chunks.push(chunk)
        })

        file.stream.on('end', () => {
            if (failed) return
            completed = true
            callback(null, { buffer: Buffer.concat(chunks, fileBytes), size: fileBytes })
        })

        file.stream.on('error', () => {
            if (failed) return
            failed = true
            chunks.length = 0
            // Multer's own stream listener decrements its pending-write counter
            // and aborts parsing, so invoking the storage callback here would
            // make Multer account for the same failed write twice.
        })

        file.stream.on('close', () => {
            if (completed || failed) return
            failed = true
            chunks.length = 0
        })
    },

    /*
     * Release a file Buffer if Multer is rolling back a partially parsed
     * request. This is Multer's storage cleanup hook, not Cloudinary cleanup.
     */
    _removeFile(req, file, callback) {
        delete file.buffer
        callback(null)
    },
})

/*
 * Construct the configured memory-storage adapter used by a particular
 * upload endpoint. Keeping this wrapper centralizes the storage selection.
 */
const createUploadStorage = (maxAggregateBytes) => createLimitedMemoryStorage(maxAggregateBytes)

/*
 * Apply the public Visit/Quote filename-extension and declared-MIME allowlists.
 * This is an early filter to avoid buffering obviously unsupported uploads;
 * the controller later performs byte-content validation before Cloudinary.
 */
const fileFilter = (req, file, cb) => {
    // 1. Extension validation
    const ext = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        const error = new Error('Invalid file type. Please use an accepted format.')
        error.code = 'INVALID_UPLOAD'
        error.status = 400
        return cb(error, false)
    }

    // 2. MIME type validation
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        const error = new Error('Invalid file type. Please use an accepted format.')
        error.code = 'INVALID_UPLOAD'
        error.status = 400
        return cb(error, false)
    }

    cb(null, true)
}

/*
 * Apply BOQ's broader extension and declared-MIME allowlists, which include
 * spreadsheet formats. A missing MIME value is permitted here because browser
 * clients may omit it; the later content validator still checks file bytes.
 */
const boqFileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!BOQ_ALLOWED_EXTENSIONS.includes(ext)) {
        const error = new Error('Invalid file type. Please use an accepted format.')
        error.code = 'INVALID_UPLOAD'
        error.status = 400
        return cb(error, false)
    }

    if (file.mimetype && !BOQ_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        const error = new Error('Invalid file type. Please use an accepted format.')
        error.code = 'INVALID_UPLOAD'
        error.status = 400
        return cb(error, false)
    }

    cb(null, true)
}

/*
 * Preserve the original filter semantics for non-request upload routes that
 * use the module's default Multer export (for example catalog/project uploads).
 */
const legacyFileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new Error(`Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`), false)
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`), false)
    }

    cb(null, true)
}

const requestUpload = multer({
    storage: createUploadStorage(MAX_STANDARD_FILE_BYTES),
    limits: {
        fileSize: MAX_FILE_SIZE + 1,
        files: 1,
        fields: MAX_STANDARD_FIELDS,
        parts: MAX_STANDARD_FIELDS + 1,
        fieldSize: MAX_MULTIPART_FIELD_BYTES,
    },
    fileFilter,
})

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: legacyFileFilter,
})

/*
 * Wrap a Multer middleware with a limit on the complete multipart request.
 * The Content-Length fast check rejects oversized declared bodies immediately;
 * the stream counter is still required for chunked requests and counts file
 * bytes, text fields, boundaries, and part headers as they arrive.
 */
export const limitRequestBodyBytes = (uploadMiddleware, maxRequestBytes) => (req, res, next) => {
    const contentType = req.headers['content-type'] || ''
    if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
        return uploadMiddleware(req, res, next)
    }

    const declaredLength = Number(req.headers['content-length'])
    if (Number.isFinite(declaredLength) && declaredLength > maxRequestBytes) {
        req.resume()
        return next(makeLimitError(
            'LIMIT_REQUEST_SIZE',
            'Uploaded request exceeds the maximum allowed size.'
        ))
    }

    req.uploadedFileBytes = 0
    let receivedBytes = 0
    let limitExceeded = false
    /*
     * Count each raw HTTP body chunk. If the total crosses the cap, stop
     * further reading and emit a coded request error for Multer's error path.
     */
    const countRequestBytes = (chunk) => {
        if (limitExceeded) return
        receivedBytes += chunk.length
        if (receivedBytes > maxRequestBytes) {
            limitExceeded = true
            req.pause()
            req.emit('error', makeLimitError(
                'LIMIT_REQUEST_SIZE',
                'Uploaded request exceeds the maximum allowed size.'
            ))
        }
    }

    req.on('data', countRequestBytes)
    /*
     * Delegate multipart parsing to Multer, then detach our listener and
     * normalize per-file size errors before passing control to Express.
     */
    uploadMiddleware(req, res, (error) => {
        req.removeListener('data', countRequestBytes)
        if (error?.code === 'LIMIT_FILE_SIZE' && error.status === undefined) {
            error.status = 413
        }
        if (error && !String(error.code || '').startsWith('LIMIT_') &&
            error.code !== 'INVALID_UPLOAD' && error.code !== 'INVALID_MULTIPART') {
            error = new Error('Invalid multipart upload request.')
            error.code = 'INVALID_MULTIPART'
            error.status = 400
        }
        next(error)
    })
}

/*
 * Visit/Quote upload entry point: one optional file, with endpoint-specific
 * file, multipart field, part-count, aggregate, and total-body limits.
 */
export const singleFileUpload = limitRequestBodyBytes(requestUpload.single('file'), MAX_STANDARD_REQUEST_BYTES)

/*
 * Parse the BOQ multipart fields. Multer enforces the per-file and field/count
 * limits, while the storage engine enforces aggregate file bytes during stream
 * consumption. The controller separately requires boq_file and validates the
 * content of every file before any service upload starts.
 */
const boqUploadParser = multer({
    storage: createUploadStorage(BOQ_MAX_AGGREGATE_FILE_BYTES),
    limits: {
        fileSize: BOQ_MAX_FILE_SIZE + 1,
        files: BOQ_MAX_FILES,
        fields: BOQ_MAX_FIELDS,
        parts: BOQ_MAX_FILES + BOQ_MAX_FIELDS,
        fieldSize: MAX_MULTIPART_FIELD_BYTES,
    },
    fileFilter: boqFileFilter,
}).fields([
    { name: 'boq_file', maxCount: 1 },
    { name: 'supporting_docs', maxCount: 5 },
])

/*
 * Export BOQ parsing with its additional total-body cap, including multipart
 * overhead for both Content-Length and chunked request bodies.
 */
const limitedBoqUpload = limitRequestBodyBytes(boqUploadParser, BOQ_MAX_REQUEST_BYTES)

export {
    ALLOWED_EXTENSIONS,
    ALLOWED_MIME_TYPES,
    BOQ_ALLOWED_EXTENSIONS,
    BOQ_ALLOWED_MIME_TYPES,
    BOQ_MAX_AGGREGATE_FILE_BYTES,
    BOQ_MAX_FILE_SIZE,
    BOQ_MAX_FILES,
    BOQ_MAX_REQUEST_BYTES,
    MAX_FILE_SIZE,
    MAX_STANDARD_REQUEST_BYTES,
}

export { limitedBoqUpload as boqUpload }
export default upload