/**
 * Client-side file validation for UX only.
 * Backend MUST enforce its own file size, MIME, and extension checks.
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
]

// ── BOQ-specific constraints ─────────────────────────────────────────────────

const BOQ_MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB
const BOQ_ALLOWED_EXTENSIONS = ['.pdf', '.xls', '.xlsx', '.csv']
const BOQ_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
]

/**
 * Validate a File object before upload (Visit / Quote forms).
 *
 * @param {File} file
 * @param {function} t — i18next translation function
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateUploadFile(file, t) {
  if (!file) {
    return { valid: true }
  }

  // Size check
  if (file.size > MAX_FILE_SIZE) {
    const maxMB = MAX_FILE_SIZE / (1024 * 1024)
    return {
      valid: false,
      error: typeof t === 'function'
        ? t('fileValidation.tooLarge', { max: `${maxMB}MB` })
        : `File is too large. Maximum size is ${maxMB}MB.`,
    }
  }

  // Extension check
  const fileName = file.name || ''
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: typeof t === 'function'
        ? t('fileValidation.invalidType', { types: ALLOWED_EXTENSIONS.join(', ') })
        : `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}.`,
    }
  }

  // MIME check (browsers may not always populate this)
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: typeof t === 'function'
        ? t('fileValidation.invalidType', { types: ALLOWED_EXTENSIONS.join(', ') })
        : `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}.`,
    }
  }

  return { valid: true }
}

/**
 * Validate a File object for BOQ uploads.
 * Accepts PDF, XLS, XLSX, CSV up to 20 MB.
 *
 * @param {File} file
 * @param {function} t — i18next translation function
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateBOQFile(file, t) {
  if (!file) {
    return { valid: true }
  }

  if (file.size > BOQ_MAX_FILE_SIZE) {
    const maxMB = BOQ_MAX_FILE_SIZE / (1024 * 1024)
    return {
      valid: false,
      error: typeof t === 'function'
        ? t('fileValidation.tooLarge', { max: `${maxMB}MB` })
        : `File is too large. Maximum size is ${maxMB}MB.`,
    }
  }

  const fileName = file.name || ''
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase()
  if (!BOQ_ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: typeof t === 'function'
        ? t('fileValidation.boqInvalidType', { types: BOQ_ALLOWED_EXTENSIONS.join(', ') })
        : `Invalid file type. Allowed for BOQ: ${BOQ_ALLOWED_EXTENSIONS.join(', ')}.`,
    }
  }

  if (file.type && !BOQ_ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: typeof t === 'function'
        ? t('fileValidation.boqInvalidType', { types: BOQ_ALLOWED_EXTENSIONS.join(', ') })
        : `Invalid file type. Allowed for BOQ: ${BOQ_ALLOWED_EXTENSIONS.join(', ')}.`,
    }
  }

  return { valid: true }
}

export { MAX_FILE_SIZE, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES }
export { BOQ_MAX_FILE_SIZE, BOQ_ALLOWED_EXTENSIONS, BOQ_ALLOWED_MIME_TYPES }

