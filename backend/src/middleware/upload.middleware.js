import multer from 'multer'
import path from 'path'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

// ── Standard upload (Visit / Quote) ──────────────────────────────────────────
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

// ── BOQ upload — additionally allows spreadsheet formats ─────────────────────
const BOQ_MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB
const BOQ_ALLOWED_EXTENSIONS = ['.pdf', '.xls', '.xlsx', '.csv']
const BOQ_ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/csv',
]

const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
    // 1. Extension validation
    const ext = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new Error(`Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`), false)
    }

    // 2. MIME type validation
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`), false)
    }

    cb(null, true)
}

const boqFileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!BOQ_ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new Error(`Invalid file extension. Allowed for BOQ: ${BOQ_ALLOWED_EXTENSIONS.join(', ')}`), false)
    }

    if (file.mimetype && !BOQ_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error(`Invalid file type. Allowed for BOQ: ${BOQ_ALLOWED_EXTENSIONS.join(', ')}`), false)
    }

    cb(null, true)
}

const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter,
})

/**
 * BOQ-specific multer instance.
 * Accepts two fields:
 *   - boq_file: 1 required file (PDF / XLS / XLSX / CSV, max 20 MB)
 *   - supporting_docs: up to 5 optional files (same allowed types)
 */
export const boqUpload = multer({
    storage,
    limits: { fileSize: BOQ_MAX_FILE_SIZE },
    fileFilter: boqFileFilter,
}).fields([
    { name: 'boq_file', maxCount: 1 },
    { name: 'supporting_docs', maxCount: 5 },
])

export { BOQ_ALLOWED_EXTENSIONS, BOQ_ALLOWED_MIME_TYPES, BOQ_MAX_FILE_SIZE }
export { ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, MAX_FILE_SIZE }

export default upload