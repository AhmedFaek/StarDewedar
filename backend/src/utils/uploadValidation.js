import path from 'node:path'
import CFB from 'cfb'
import sharp from 'sharp'
import yauzl from 'yauzl'

const MiB = 1024 * 1024
const MAX_IMAGE_PIXELS = 40_000_000
const MAX_XLSX_ENTRIES = 1000
const MAX_XLSX_EXPANDED_BYTES = 100 * MiB
const IMAGE_SIGNATURES = {
    jpeg: Buffer.from([0xff, 0xd8, 0xff]),
    png: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
}
const CFB_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
const PDF_MIME_TYPES = ['application/pdf']
const IMAGE_MIME_TYPES = {
    '.jpg': ['image/jpeg'],
    '.jpeg': ['image/jpeg'],
    '.png': ['image/png'],
}
const BOQ_MIME_TYPES = {
    '.pdf': PDF_MIME_TYPES,
    '.xls': ['application/vnd.ms-excel'],
    '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    '.csv': ['text/csv', 'application/csv'],
}
const REQUIRED_XLSX_ENTRIES = new Set([
    '[Content_Types].xml',
    'xl/workbook.xml',
    'xl/_rels/workbook.xml.rels',
])
const CRC32_TABLE = Uint32Array.from({ length: 256 }, (_, value) => {
    let crc = value
    for (let bit = 0; bit < 8; bit += 1) {
        crc = (crc & 1) ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
    }
    return crc >>> 0
})

export class UploadValidationError extends Error {
    constructor(message = 'Uploaded file content is invalid.') {
        super(message)
        this.name = 'UploadValidationError'
        this.code = 'INVALID_UPLOAD'
        this.status = 400
    }
}

const invalidUpload = () => {
    throw new UploadValidationError()
}

// Check for a PDF header and an end-of-file marker near the end of the buffer.
const hasPdfStructure = (buffer) => buffer.length >= 12 &&
    buffer.subarray(0, 5).toString('ascii') === '%PDF-' &&
    buffer.subarray(Math.max(0, buffer.length - 1024)).includes(Buffer.from('%%EOF'))

// Reject APNG files without parsing the rest of the PNG structure.
const isAnimatedPng = (buffer) => {
    let offset = IMAGE_SIGNATURES.png.length
    while (offset + 12 <= buffer.length) {
        const chunkLength = buffer.readUInt32BE(offset)
        const chunkType = buffer.toString('ascii', offset + 4, offset + 8)
        if (chunkType === 'acTL') return true
        if (chunkLength > buffer.length - offset - 12) return false
        offset += chunkLength + 12
        if (chunkType === 'IEND') return false
    }
    return false
}

/*
 * Check the expected JPEG/PNG signature before Sharp sees the bytes, reject
 * APNGs, and ask Sharp to decode a single image under the pixel limit.
 */
export const hasImageStructure = async (buffer, expectedFormat, imageFactory = sharp) => {
    if (!Buffer.isBuffer(buffer)) return false
    const signature = IMAGE_SIGNATURES[expectedFormat]
    if (
        !signature ||
        buffer.length < signature.length ||
        !buffer.subarray(0, signature.length).equals(signature) ||
        (expectedFormat === 'png' && isAnimatedPng(buffer))
    ) {
        return false
    }

    try {
        const image = imageFactory(buffer, {
            failOn: 'warning',
            limitInputPixels: MAX_IMAGE_PIXELS,
            pages: 1,
            sequentialRead: true,
        })
        const metadata = await image.metadata()
        if (
            metadata.format !== expectedFormat ||
            !Number.isSafeInteger(metadata.width) ||
            !Number.isSafeInteger(metadata.height) ||
            metadata.width < 1 ||
            metadata.height < 1 ||
            metadata.width * metadata.height > MAX_IMAGE_PIXELS ||
            (metadata.pages || 1) > 1
        ) {
            return false
        }

        await image.stats()
        return true
    } catch {
        return false
    }
}

/*
 * Require a valid CFB container and a non-empty Workbook/Book stream.
 * This identifies a plausible legacy Excel container, not a verified BIFF
 * workbook; uploaded spreadsheets are stored but never parsed by the app.
 */
const hasXlsStructure = (buffer) => {
    if (buffer.length < 512 || !buffer.subarray(0, CFB_SIGNATURE.length).equals(CFB_SIGNATURE)) {
        return false
    }

    try {
        const container = CFB.read(buffer, { type: 'buffer' })
        const workbook = CFB.find(container, 'Workbook') || CFB.find(container, 'Book')
        return Boolean(workbook?.content?.length)
    } catch {
        return false
    }
}

const openZipBuffer = (buffer) => new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, {
        autoClose: false,
        lazyEntries: true,
        strictFileNames: false,
        validateEntrySizes: true,
    }, (error, zipFile) => error ? reject(error) : resolve(zipFile))
})

// Update a streaming CRC32 checksum for decompressed ZIP entry data.
const updateCrc32 = (crc, chunk) => {
    let value = crc
    for (const byte of chunk) {
        value = CRC32_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8)
    }
    return value >>> 0
}

/*
 * Check ZIP structure by streaming each entry through yauzl without writing
 * files to disk. Enforce archive-wide limits, verify decompressed entry CRCs,
 * and require core XLSX part names; this does not parse workbook XML.
 */
export const validateXlsxStructure = async (buffer, {
    maxExpandedBytes = MAX_XLSX_EXPANDED_BYTES,
    maxEntries = MAX_XLSX_ENTRIES,
} = {}) => {
    if (
        !Number.isSafeInteger(maxExpandedBytes) ||
        maxExpandedBytes < 1 ||
        !Number.isSafeInteger(maxEntries) ||
        maxEntries < REQUIRED_XLSX_ENTRIES.size
    ) {
        return false
    }

    let zipFile
    try {
        zipFile = await openZipBuffer(buffer)
        if (
            !Number.isInteger(zipFile.entryCount) ||
            zipFile.entryCount < REQUIRED_XLSX_ENTRIES.size ||
            zipFile.entryCount > maxEntries
        ) {
            return false
        }

        const seenNames = new Set()
        const requiredEntries = new Set()
        let expandedBytes = 0
        let entriesRead = 0

        for await (const entry of zipFile.eachEntry()) {
            entriesRead += 1
            if (
                entriesRead > maxEntries ||
                entry.isEncrypted() ||
                (entry.diskNumberStart !== undefined && entry.diskNumberStart !== 0) ||
                !Number.isSafeInteger(entry.uncompressedSize) ||
                entry.uncompressedSize < 0 ||
                !Number.isSafeInteger(entry.compressedSize) ||
                entry.compressedSize < 0 ||
                (entry.compressionMethod !== 0 && entry.compressionMethod !== 8) ||
                entry.uncompressedSize > maxExpandedBytes ||
                expandedBytes + entry.uncompressedSize > maxExpandedBytes ||
                seenNames.has(entry.fileName)
            ) {
                return false
            }
            seenNames.add(entry.fileName)

            let entryBytes = 0
            let entryCrc = 0xffffffff
            const stream = await zipFile.openReadStreamPromise(entry)
            for await (const chunk of stream) {
                entryBytes += chunk.length
                expandedBytes += chunk.length
                entryCrc = updateCrc32(entryCrc, chunk)
                if (
                    entryBytes > entry.uncompressedSize ||
                    expandedBytes > maxExpandedBytes
                ) {
                    return false
                }
            }
            if (
                entryBytes !== entry.uncompressedSize ||
                ((entryCrc ^ 0xffffffff) >>> 0) !== entry.crc32
            ) {
                return false
            }

            if (REQUIRED_XLSX_ENTRIES.has(entry.fileName) && entryBytes > 0) {
                requiredEntries.add(entry.fileName)
            }
        }

        return entriesRead === zipFile.entryCount &&
            requiredEntries.size === REQUIRED_XLSX_ENTRIES.size
    } catch {
        return false
    } finally {
        if (zipFile?.isOpen) zipFile.close()
    }
}

// Accept non-empty UTF-8 CSV text while rejecting binary/control bytes.
const hasCsvText = (buffer) => {
    if (buffer.includes(0)) return false
    try {
        const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer)
        const content = text.replace(/^\uFEFF/, '')
        return content.trim().length > 0 &&
            !/[\u0001-\u0008\u000b\u000c\u000e-\u001f]/.test(content)
    } catch {
        return false
    }
}

// Return the MIME values permitted for a recognized extension and request type.
const getAllowedMimeTypes = (extension, boq) => {
    if (boq) return BOQ_MIME_TYPES[extension] || []
    return IMAGE_MIME_TYPES[extension] || (extension === '.pdf' ? PDF_MIME_TYPES : [])
}

/**
 * Validate the file's declared format and lightweight byte-level structure.
 */
export const validateUploadedFile = async (file, { boq = false } = {}) => {
    if (!file?.buffer || !Buffer.isBuffer(file.buffer)) invalidUpload()

    const extension = path.extname(file.originalname || '').toLowerCase()
    const allowedMimeTypes = getAllowedMimeTypes(extension, boq)
    if (allowedMimeTypes.length === 0) invalidUpload()
    if (!allowedMimeTypes.includes(file.mimetype)) invalidUpload()

    const buffer = file.buffer
    let valid = false
    if (extension === '.pdf') valid = hasPdfStructure(buffer)
    else if (extension === '.jpg' || extension === '.jpeg') valid = await hasImageStructure(buffer, 'jpeg')
    else if (extension === '.png') valid = await hasImageStructure(buffer, 'png')
    else if (extension === '.xls') valid = hasXlsStructure(buffer)
    else if (extension === '.xlsx') valid = await validateXlsxStructure(buffer)
    else if (extension === '.csv') valid = hasCsvText(buffer)

    if (!valid) invalidUpload()
    return true
}
