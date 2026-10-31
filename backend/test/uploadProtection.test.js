import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import http from 'node:http'
import { Readable } from 'node:stream'
import { deflateRawSync } from 'node:zlib'
import express from 'express'
import multer from 'multer'
import CFB from 'cfb'
import sharp from 'sharp'
import cloudinary from '../src/config/storage.js'
import { createBOQ } from '../src/modules/boqRequests/boq.controller.js'
import {
    createLimitedMemoryStorage,
    limitRequestBodyBytes,
} from '../src/middleware/upload.middleware.js'
import {
    UploadValidationError,
    hasImageStructure,
    validateUploadedFile,
    validateXlsxStructure,
} from '../src/utils/uploadValidation.js'
import { resolveErrorStatus } from '../src/app.js'

const makeFile = (name, mimetype, buffer) => ({
    originalname: name,
    mimetype,
    buffer,
})

const crc32 = (buffer) => {
    let crc = 0xffffffff
    for (const byte of buffer) {
        crc ^= byte
        for (let bit = 0; bit < 8; bit += 1) {
            crc = (crc & 1) ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
        }
    }
    return (crc ^ 0xffffffff) >>> 0
}

const makeZip = (files) => {
    const localRecords = []
    const centralRecords = []
    let localOffset = 0

    for (const [name, content] of files) {
        const fileName = Buffer.from(name)
        const uncompressed = Buffer.from(content)
        const data = deflateRawSync(uncompressed)
        const checksum = crc32(uncompressed)
        const local = Buffer.alloc(30 + fileName.length + data.length)
        local.writeUInt32LE(0x04034b50, 0)
        local.writeUInt16LE(20, 4)
        local.writeUInt16LE(0, 6)
        local.writeUInt16LE(8, 8)
        local.writeUInt32LE(checksum, 14)
        local.writeUInt32LE(data.length, 18)
        local.writeUInt32LE(uncompressed.length, 22)
        local.writeUInt16LE(fileName.length, 26)
        local.writeUInt16LE(0, 28)
        fileName.copy(local, 30)
        data.copy(local, 30 + fileName.length)
        localRecords.push(local)

        const central = Buffer.alloc(46 + fileName.length)
        central.writeUInt32LE(0x02014b50, 0)
        central.writeUInt16LE(20, 4)
        central.writeUInt16LE(20, 6)
        central.writeUInt16LE(0, 8)
        central.writeUInt16LE(8, 10)
        central.writeUInt32LE(checksum, 16)
        central.writeUInt32LE(data.length, 20)
        central.writeUInt32LE(uncompressed.length, 24)
        central.writeUInt16LE(fileName.length, 28)
        central.writeUInt16LE(0, 30)
        central.writeUInt16LE(0, 32)
        central.writeUInt16LE(0, 34)
        central.writeUInt32LE(localOffset, 42)
        fileName.copy(central, 46)
        centralRecords.push(central)
        localOffset += local.length
    }

    const centralDirectory = Buffer.concat(centralRecords)
    const end = Buffer.alloc(22)
    end.writeUInt32LE(0x06054b50, 0)
    end.writeUInt16LE(files.length, 8)
    end.writeUInt16LE(files.length, 10)
    end.writeUInt32LE(centralDirectory.length, 12)
    end.writeUInt32LE(localOffset, 16)
    return Buffer.concat([...localRecords, centralDirectory, end])
}

const makeXlsx = (extraEntries = []) => makeZip([
    ['[Content_Types].xml', '<Types/>'],
    ['xl/workbook.xml', '<workbook/>'],
    ['xl/_rels/workbook.xml.rels', '<Relationships/>'],
    ...extraEntries,
])

const corruptZipCrc = (zip, fileName) => {
    const name = Buffer.from(fileName)
    let cursor = 0
    while ((cursor = zip.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]), cursor)) >= 0) {
        const fileNameLength = zip.readUInt16LE(cursor + 28)
        if (zip.subarray(cursor + 46, cursor + 46 + fileNameLength).equals(name)) {
            zip.writeUInt32LE((zip.readUInt32LE(cursor + 16) ^ 1) >>> 0, cursor + 16)
            return zip
        }
        cursor += 4
    }
    throw new Error(`ZIP entry not found: ${fileName}`)
}

const markZipEntryEncrypted = (zip, fileName) => {
    const name = Buffer.from(fileName)
    let foundLocal = false
    let foundCentral = false
    let cursor = 0

    while ((cursor = zip.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]), cursor)) >= 0) {
        const fileNameLength = zip.readUInt16LE(cursor + 26)
        const extraLength = zip.readUInt16LE(cursor + 28)
        if (zip.subarray(cursor + 30, cursor + 30 + fileNameLength).equals(name)) {
            zip.writeUInt16LE(zip.readUInt16LE(cursor + 6) | 1, cursor + 6)
            foundLocal = true
        }
        cursor += 30 + fileNameLength + extraLength
    }

    cursor = 0
    while ((cursor = zip.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]), cursor)) >= 0) {
        const fileNameLength = zip.readUInt16LE(cursor + 28)
        const extraLength = zip.readUInt16LE(cursor + 30)
        const commentLength = zip.readUInt16LE(cursor + 32)
        if (zip.subarray(cursor + 46, cursor + 46 + fileNameLength).equals(name)) {
            zip.writeUInt16LE(zip.readUInt16LE(cursor + 8) | 1, cursor + 8)
            foundCentral = true
        }
        cursor += 46 + fileNameLength + extraLength + commentLength
    }

    if (!foundLocal || !foundCentral) throw new Error(`ZIP entry not found: ${fileName}`)
    return zip
}

const makeXlsContainer = (streamName, streamContent) => {
    const container = CFB.utils.cfb_new()
    if (streamName) CFB.utils.cfb_add(container, streamName, streamContent)
    return CFB.write(container, { type: 'buffer' })
}

const makePngChunk = (name, data) => {
    const type = Buffer.from(name)
    const chunk = Buffer.alloc(12 + data.length)
    chunk.writeUInt32BE(data.length, 0)
    type.copy(chunk, 4)
    data.copy(chunk, 8)
    chunk.writeUInt32BE(crc32(chunk.subarray(4, 8 + data.length)), 8 + data.length)
    return chunk
}

const makeAnimatedPng = (staticPng) => {
    const chunks = []
    let offset = 8
    while (offset + 12 <= staticPng.length) {
        const length = staticPng.readUInt32BE(offset)
        const type = staticPng.toString('ascii', offset + 4, offset + 8)
        chunks.push({
            type,
            data: staticPng.subarray(offset + 8, offset + 8 + length),
        })
        offset += length + 12
        if (type === 'IEND') break
    }

    const ihdr = chunks.find((chunk) => chunk.type === 'IHDR')?.data
    const imageData = chunks.find((chunk) => chunk.type === 'IDAT')?.data
    assert.ok(ihdr)
    assert.ok(imageData)
    const width = ihdr.readUInt32BE(0)
    const height = ihdr.readUInt32BE(4)
    const frameControl = (sequence) => {
        const data = Buffer.alloc(26)
        data.writeUInt32BE(sequence, 0)
        data.writeUInt32BE(width, 4)
        data.writeUInt32BE(height, 8)
        data.writeUInt16BE(1, 20)
        data.writeUInt16BE(10, 22)
        return data
    }
    const animationControl = Buffer.alloc(8)
    animationControl.writeUInt32BE(2, 0)

    return Buffer.concat([
        staticPng.subarray(0, 8),
        makePngChunk('IHDR', ihdr),
        makePngChunk('acTL', animationControl),
        makePngChunk('fcTL', frameControl(0)),
        makePngChunk('IDAT', imageData),
        makePngChunk('fcTL', frameControl(1)),
        makePngChunk('fdAT', Buffer.concat([Buffer.from([0, 0, 0, 2]), imageData])),
        makePngChunk('IEND', Buffer.alloc(0)),
    ])
}

test('limits memory storage aggregate bytes while reading file streams', async () => {
    const storage = createLimitedMemoryStorage(5)
    const req = { uploadedFileBytes: 0 }

    const first = await new Promise((resolve, reject) => {
        storage._handleFile(req, { stream: Readable.from([Buffer.from('abc')]) }, (error, info) => {
            if (error) return reject(error)
            resolve(info)
        })
    })
    assert.equal(first.buffer.toString(), 'abc')
    assert.equal(req.uploadedFileBytes, 3)

    const exactBoundary = await new Promise((resolve, reject) => {
        storage._handleFile(req, { stream: Readable.from([Buffer.from('de')]) }, (error, info) => {
            if (error) return reject(error)
            resolve(info)
        })
    })
    assert.equal(exactBoundary.size, 2)
    assert.equal(req.uploadedFileBytes, 5)

    req.uploadedFileBytes = 3
    const failure = await new Promise((resolve) => {
        storage._handleFile(req, { stream: Readable.from([Buffer.from('def')]) }, resolve)
    })
    assert.equal(failure.code, 'LIMIT_AGGREGATE_FILE_SIZE')
    assert.equal(failure.status, 413)
    assert.equal(req.uploadedFileBytes, 3)
})

test('enforces request-wide bytes for chunked multipart streams', async () => {
    const request = Readable.from([Buffer.from('123'), Buffer.from('456')])
    request.headers = { 'content-type': 'multipart/form-data; boundary=test' }

    const parseBody = (req, res, next) => {
        req.on('error', next)
        req.on('data', () => {})
        req.on('end', () => next())
    }

    const result = await new Promise((resolve) => {
        limitRequestBodyBytes(parseBody, 5)(request, {}, resolve)
    })
    assert.equal(result.code, 'LIMIT_REQUEST_SIZE')
    assert.equal(result.status, 413)
})

test('returns HTTP 413 for a chunked multipart request over its byte limit', async (t) => {
    const app = express()
    const parser = multer({
        storage: createLimitedMemoryStorage(1024),
        limits: { fileSize: 1024, files: 1 },
    }).single('file')
    app.post('/upload', limitRequestBodyBytes(parser, 200), (req, res) => {
        res.sendStatus(201)
    })
    app.use((error, req, res, next) => {
        res.status(error.status || 500).end()
    })

    const server = app.listen(0)
    await new Promise((resolve) => server.once('listening', resolve))
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
    }))

    const boundary = 'upload-protection-test'
    const body = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="sample.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
        Buffer.alloc(512, 0x61),
        Buffer.from(`\r\n--${boundary}--\r\n`),
    ])
    const responseStatus = await new Promise((resolve, reject) => {
        const request = http.request({
            method: 'POST',
            port: server.address().port,
            path: '/upload',
            headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
        }, (response) => {
            response.resume()
            response.on('end', () => resolve(response.statusCode))
        })
        request.on('error', reject)
        request.write(body.subarray(0, 100))
        request.write(body.subarray(100, 300))
        request.end(body.subarray(300))
    })

    assert.equal(responseStatus, 413)
})

test('returns 413 when request-size overflow occurs after file bytes are buffered', async (t) => {
    let fileStreamStarted
    const streamStarted = new Promise((resolve) => {
        fileStreamStarted = resolve
    })
    let controllerCalled = false
    let fileStreamClosed = false
    let storageCallbacks = 0
    const boundary = 'partial-file-overflow-test'
    const prefix = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="sample.pdf"\r\nContent-Type: application/pdf\r\n\r\n`
    )
    const requestBodyLimit = prefix.length + 30
    const storage = createLimitedMemoryStorage(1024)
    const parser = multer({
        storage: {
            ...storage,
            _handleFile(req, file, callback) {
                file.stream.once('data', fileStreamStarted)
                file.stream.once('close', () => {
                    fileStreamClosed = true
                })
                storage._handleFile(req, file, (...args) => {
                    storageCallbacks += 1
                    callback(...args)
                })
            },
        },
        limits: { fileSize: 1024, files: 1 },
    }).single('file')
    const app = express()
    app.post('/upload', limitRequestBodyBytes(parser, requestBodyLimit), (req, res) => {
        controllerCalled = true
        res.sendStatus(201)
    })
    app.use((error, req, res, next) => {
        res.status(error.status || 500).end()
    })

    const server = app.listen(0)
    await new Promise((resolve) => server.once('listening', resolve))
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
    }))

    const request = http.request({
        method: 'POST',
        port: server.address().port,
        path: '/upload',
        headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    })
    request.on('error', () => {})
    let responseTimeout
    const responseStatus = new Promise((resolve, reject) => {
        request.on('response', (response) => {
            response.resume()
            response.on('end', () => resolve(response.statusCode))
        })
        responseTimeout = setTimeout(
            () => reject(new Error('Request-size overflow did not return a response')),
            2000
        )
    })

    request.write(Buffer.concat([prefix, Buffer.alloc(20, 0x61)]))
    await streamStarted
    request.write(Buffer.alloc(100, 0x62))
    request.end(Buffer.from(`\r\n--${boundary}--\r\n`))

    try {
        assert.equal(await responseStatus, 413)
    } finally {
        clearTimeout(responseTimeout)
    }
    assert.equal(controllerCalled, false)
    assert.equal(fileStreamClosed, true)
    assert.equal(storageCallbacks, 0)
    request.destroy()
})

test('returns HTTP 413 when a file exceeds Multer per-file limit', async (t) => {
    const app = express()
    const parser = multer({
        storage: createLimitedMemoryStorage(16),
        limits: { fileSize: 6, files: 1 },
    }).single('file')
    app.post('/upload', limitRequestBodyBytes(parser, 1024), (req, res) => {
        res.sendStatus(201)
    })
    app.use((error, req, res, next) => {
        res.status(error.status || 500).end()
    })

    const server = app.listen(0)
    await new Promise((resolve) => server.once('listening', resolve))
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
    }))

    const boundary = 'file-size-boundary-test'
    const send = (fileBytes) => new Promise((resolve, reject) => {
        const body = Buffer.concat([
            Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="sample.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
            Buffer.alloc(fileBytes, 0x61),
            Buffer.from(`\r\n--${boundary}--\r\n`),
        ])
        const request = http.request({
            method: 'POST',
            port: server.address().port,
            path: '/upload',
            headers: {
                'content-type': `multipart/form-data; boundary=${boundary}`,
                'content-length': body.length,
            },
        }, (response) => {
            response.resume()
            response.on('end', () => resolve(response.statusCode))
        })
        request.on('error', reject)
        request.end(body)
    })

    assert.equal(await send(5), 201)
    assert.equal(await send(6), 413)
})

test('accepts a chunked multipart body exactly at the request-byte limit', async (t) => {
    const app = express()
    const boundary = 'exact-request-limit-test'
    const body = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="note"\r\n\r\nok\r\n--${boundary}--\r\n`
    )
    const parser = multer({ storage: createLimitedMemoryStorage(1024) }).none()
    app.post('/upload', limitRequestBodyBytes(parser, body.length), (req, res) => {
        res.sendStatus(201)
    })
    app.use((error, req, res, next) => {
        res.status(error.status || 500).end()
    })

    const server = app.listen(0)
    await new Promise((resolve) => server.once('listening', resolve))
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
    }))

    const responseStatus = await new Promise((resolve, reject) => {
        const request = http.request({
            method: 'POST',
            port: server.address().port,
            path: '/upload',
            headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
        }, (response) => {
            response.resume()
            response.on('end', () => resolve(response.statusCode))
        })
        request.on('error', reject)
        request.write(body.subarray(0, 7))
        request.end(body.subarray(7))
    })

    assert.equal(responseStatus, 201)
})

test('returns HTTP 413 when multiple file streams exceed the aggregate file limit', async (t) => {
    const app = express()
    const parser = multer({
        storage: createLimitedMemoryStorage(5),
        limits: { fileSize: 10, files: 2 },
    }).fields([
        { name: 'boq_file', maxCount: 1 },
        { name: 'supporting_docs', maxCount: 1 },
    ])
    let controllerCalled = false
    app.post('/upload', limitRequestBodyBytes(parser, 1024), (req, res) => {
        controllerCalled = true
        res.sendStatus(201)
    })
    app.use((error, req, res, next) => {
        res.status(error.status || 500).end()
    })

    const server = app.listen(0)
    await new Promise((resolve) => server.once('listening', resolve))
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
    }))

    const boundary = 'aggregate-upload-test'
    const part = (field, filename) => Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${field}"; filename="${filename}"\r\nContent-Type: application/pdf\r\n\r\nabc\r\n`
    )
    const body = Buffer.concat([
        part('boq_file', 'main.pdf'),
        part('supporting_docs', 'support.pdf'),
        Buffer.from(`--${boundary}--\r\n`),
    ])
    const responseStatus = await new Promise((resolve, reject) => {
        const request = http.request({
            method: 'POST',
            port: server.address().port,
            path: '/upload',
            headers: {
                'content-type': `multipart/form-data; boundary=${boundary}`,
                'content-length': body.length,
            },
        }, (response) => {
            response.resume()
            response.on('end', () => resolve(response.statusCode))
        })
        request.on('error', reject)
        request.end(body)
    })

    assert.equal(responseStatus, 413)
    assert.equal(controllerCalled, false)
})

test('aborted file streams release partial storage without duplicate callbacks', async (t) => {
    let fileStreamStarted
    const streamStarted = new Promise((resolve) => {
        fileStreamStarted = resolve
    })
    let storageCallbacks = 0
    let errorCount = 0
    let controllerCalled = false
    const baseStorage = createLimitedMemoryStorage(1024 * 1024)
    const storage = {
        _handleFile(req, file, callback) {
            file.stream.once('data', fileStreamStarted)
            baseStorage._handleFile(req, file, (...args) => {
                storageCallbacks += 1
                callback(...args)
            })
        },
        _removeFile(req, file, callback) {
            baseStorage._removeFile(req, file, callback)
        },
    }
    const parser = multer({ storage, limits: { fileSize: 1024 * 1024 } }).single('file')
    const app = express()
    app.post('/upload', limitRequestBodyBytes(parser, 2 * 1024 * 1024), (req, res) => {
        controllerCalled = true
        res.sendStatus(201)
    })
    const errorHandled = new Promise((resolve) => {
        app.use((error, req, res, next) => {
            errorCount += 1
            res.status(400).end()
            resolve()
        })
    })

    const server = app.listen(0)
    await new Promise((resolve) => server.once('listening', resolve))
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
    }))

    const boundary = 'interrupted-upload-test'
    const request = http.request({
        method: 'POST',
        port: server.address().port,
        path: '/upload',
        headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    })
    request.on('error', () => {})
    request.write(Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="sample.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
        Buffer.alloc(64 * 1024, 0x61),
    ]))
    await streamStarted
    request.destroy()

    let timeout
    try {
        await Promise.race([
            errorHandled,
            new Promise((_, reject) => {
                timeout = setTimeout(() => reject(new Error('Interrupted upload did not finish')), 2000)
            }),
        ])
    } finally {
        clearTimeout(timeout)
    }
    assert.equal(errorCount, 1)
    assert.equal(controllerCalled, false)
    assert.equal(storageCallbacks, 0)
})

test('rejects request bodies over the declared length limit before parsing', async () => {
    const request = Readable.from([])
    request.headers = {
        'content-type': 'multipart/form-data; boundary=test',
        'content-length': '6',
    }
    let parserCalled = false
    const result = await new Promise((resolve) => {
        limitRequestBodyBytes(() => {
            parserCalled = true
        }, 5)(request, {}, resolve)
    })
    assert.equal(parserCalled, false)
    assert.equal(result.status, 413)
})

test('maps file and multipart field-value size errors to HTTP 413', () => {
    assert.equal(resolveErrorStatus({ code: 'LIMIT_FILE_SIZE' }), 413)
    assert.equal(resolveErrorStatus({ code: 'LIMIT_FIELD_VALUE' }), 413)
    assert.equal(resolveErrorStatus({ code: 'LIMIT_REQUEST_SIZE' }), 413)
    assert.equal(resolveErrorStatus({ code: 'LIMIT_FIELD_COUNT' }), 400)
    assert.equal(resolveErrorStatus({ code: 'LIMIT_UNEXPECTED_FILE' }), 400)
})

test('normalizes malformed multipart parser errors without exposing parser details', async () => {
    const request = new EventEmitter()
    request.headers = { 'content-type': 'multipart/form-data; boundary=test' }
    const result = await new Promise((resolve) => {
        limitRequestBodyBytes((req, res, next) => {
            next(new Error('Unexpected end of form at byte 3'))
        }, 1024)(request, {}, resolve)
    })

    assert.equal(result.code, 'INVALID_MULTIPART')
    assert.equal(result.status, 400)
    assert.equal(result.message, 'Invalid multipart upload request.')
    assert.equal(resolveErrorStatus(result), 400)
})

test('maps per-file size errors to HTTP 413 on protected request routes', async () => {
    const request = new EventEmitter()
    request.headers = { 'content-type': 'multipart/form-data; boundary=test' }
    const error = Object.assign(new Error('File too large'), { code: 'LIMIT_FILE_SIZE' })
    const result = await new Promise((resolve) => {
        limitRequestBodyBytes((req, res, next) => next(error), 1024)(request, {}, resolve)
    })
    assert.equal(result.status, 413)
})

test('validates PDF, decoded JPEG/PNG, and non-empty UTF-8 CSV content', async () => {
    const pdf = Buffer.from('%PDF-1.7\nexample\n%%EOF')
    const image = sharp({
        create: {
            width: 1,
            height: 1,
            channels: 3,
            background: { r: 10, g: 20, b: 30 },
        },
    })
    const jpeg = await image.clone().jpeg().toBuffer()
    const png = await image.clone().png().toBuffer()

    assert.equal(await validateUploadedFile(makeFile('quote.pdf', 'application/pdf', pdf)), true)
    assert.equal(await validateUploadedFile(makeFile('visit.jpg', 'image/jpeg', jpeg)), true)
    assert.equal(await validateUploadedFile(makeFile('visit.png', 'image/png', png)), true)
    assert.equal(await validateUploadedFile(
        makeFile('boq.csv', 'text/csv', Buffer.from('\ufeffa,b\n1,2')),
        { boq: true }
    ), true)
})

test('rejects malformed JPEG/PNG and empty or whitespace-only CSV', async () => {
    await assert.rejects(
        validateUploadedFile(makeFile(
            'broken.jpg',
            'image/jpeg',
            Buffer.from([0xff, 0xd8, 0xff, 0x00, 0xff, 0xd9])
        )),
        UploadValidationError
    )
    await assert.rejects(
        validateUploadedFile(makeFile(
            'broken.png',
            'image/png',
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
        )),
        UploadValidationError
    )
    await assert.rejects(
        validateUploadedFile(makeFile('empty.csv', 'text/csv', Buffer.alloc(0)), { boq: true }),
        UploadValidationError
    )
    await assert.rejects(
        validateUploadedFile(makeFile('blank.csv', 'text/csv', Buffer.from(' \r\n\t')), { boq: true }),
        UploadValidationError
    )
    await assert.rejects(
        validateUploadedFile(makeFile('table.csv', 'text/csv', Buffer.from([0xff, 0x00])), { boq: true }),
        UploadValidationError
    )
})

test('rejects disguised unsupported image formats before invoking Sharp', async () => {
    let sharpCalls = 0
    const sharpSpy = () => {
        sharpCalls += 1
        throw new Error('Sharp should not receive unsupported content')
    }

    assert.equal(await hasImageStructure(
        Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>'),
        'png',
        sharpSpy
    ), false)
    assert.equal(await hasImageStructure(
        Buffer.from('00000018ftypheic'),
        'jpeg',
        sharpSpy
    ), false)
    assert.equal(sharpCalls, 0)
})

test('rejects animated PNGs and enforces the image pixel limit boundary', async () => {
    const staticPng = await sharp({
        create: {
            width: 1,
            height: 1,
            channels: 3,
            background: { r: 10, g: 20, b: 30 },
        },
    }).png().toBuffer()
    const animatedPng = makeAnimatedPng(staticPng)
    let animatedDecoderCalls = 0
    const animatedDecoder = () => {
        animatedDecoderCalls += 1
        throw new Error('Animated images must not reach Sharp')
    }
    assert.equal(await hasImageStructure(animatedPng, 'png', animatedDecoder), false)
    assert.equal(animatedDecoderCalls, 0)

    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff])
    let statsCalls = 0
    const createImageFactory = (width, height) => (buffer, options) => ({
        options,
        metadata: async () => ({ format: 'jpeg', width, height, pages: 1 }),
        stats: async () => {
            statsCalls += 1
            return {}
        },
    })
    let pixelOptions
    assert.equal(await hasImageStructure(
        jpegHeader,
        'jpeg',
        (buffer, options) => {
            pixelOptions = options
            return createImageFactory(8000, 5000)(buffer, options)
        }
    ), true)
    assert.equal(pixelOptions.limitInputPixels, 40_000_000)
    assert.equal(pixelOptions.pages, 1)

    let overLimitStatsCalls = 0
    assert.equal(await hasImageStructure(
        jpegHeader,
        'jpeg',
        () => ({
            metadata: async () => ({ format: 'jpeg', width: 8000, height: 5001, pages: 1 }),
            stats: async () => {
                overLimitStatsCalls += 1
            },
        })
    ), false)
    assert.equal(statsCalls, 1)
    assert.equal(overLimitStatsCalls, 0)
})

test('invalid BOQ supporting content prevents all Cloudinary upload calls', async (t) => {
    let uploadCalls = 0
    t.mock.method(cloudinary.uploader, 'upload_stream', () => {
        uploadCalls += 1
        throw new Error('Cloudinary must not be called for invalid content')
    })
    t.mock.method(console, 'error', () => {})

    const response = {
        status(statusCode) {
            this.statusCode = statusCode
            return this
        },
        json(body) {
            this.body = body
            return this
        },
    }
    await createBOQ({
        body: {
            name: 'Example User',
            company_name: 'Example Company',
            email: 'example@example.com',
            phone: '+201287879794',
            project_name: 'Example Project',
            project_location: 'Example Location',
            project_type: 'commercial',
        },
        files: {
            boq_file: [makeFile('main.pdf', 'application/pdf', Buffer.from('%PDF-1.7\n%%EOF'))],
            supporting_docs: [makeFile('invalid.csv', 'text/csv', Buffer.from(' \t\n'))],
        },
    }, response)

    assert.equal(response.statusCode, 400)
    assert.equal(uploadCalls, 0)
})

test('validates XLSX ZIP structure, required components, duplicates, and size limits', async () => {
    const workbook = readFileSync(new URL('./fixtures/minimal-valid.xlsx', import.meta.url))
    const arbitraryZip = makeZip([['readme.txt', 'not a workbook']])
    const duplicateCoreEntry = makeZip([
        ['[Content_Types].xml', '<Types/>'],
        ['[Content_Types].xml', '<Types/>'],
        ['xl/workbook.xml', '<workbook/>'],
        ['xl/_rels/workbook.xml.rels', '<Relationships/>'],
    ])
    const invalidCrc = corruptZipCrc(makeXlsx(), '[Content_Types].xml')
    const encryptedEntry = markZipEntryEncrypted(makeXlsx(), '[Content_Types].xml')
    const corruptDeflate = Buffer.from(makeXlsx())
    const localHeader = corruptDeflate.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
    const firstNameLength = corruptDeflate.readUInt16LE(localHeader + 26)
    const firstExtraLength = corruptDeflate.readUInt16LE(localHeader + 28)
    corruptDeflate[localHeader + 30 + firstNameLength + firstExtraLength] ^= 0xff

    assert.equal(await validateXlsxStructure(workbook), true)
    assert.equal(await validateUploadedFile(makeFile(
        'estimate.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        workbook
    ), { boq: true }), true)
    await assert.rejects(
        validateUploadedFile(makeFile(
            'estimate.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            arbitraryZip
        ), { boq: true }),
        UploadValidationError
    )
    for (const invalidArchive of [invalidCrc, encryptedEntry, corruptDeflate]) {
        assert.equal(await validateXlsxStructure(invalidArchive), false)
    }
    await assert.rejects(
        validateUploadedFile(makeFile(
            'estimate.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            duplicateCoreEntry
        ), { boq: true }),
        UploadValidationError
    )
    await assert.rejects(
        validateUploadedFile(makeFile(
            'estimate.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            makeXlsx([['xl/workbook.xml', '<workbook/>']])
        ), { boq: true }),
        UploadValidationError
    )
    await assert.rejects(
        validateUploadedFile(makeFile(
            'estimate.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            workbook.subarray(0, workbook.length - 10)
        ), { boq: true }),
        UploadValidationError
    )
    assert.equal(await validateXlsxStructure(workbook, { maxExpandedBytes: 32 }), false)
    assert.equal(await validateXlsxStructure(workbook, { maxEntries: 2 }), false)
})

test('checks XLS CFB signature and named stream without interpreting BIFF contents', async () => {
    const plausibleXls = makeXlsContainer('Workbook', Buffer.from('legacy Excel workbook data'))
    const bookStreamXls = makeXlsContainer('Book', Buffer.from('legacy Excel workbook data'))
    const missingWorkbookStream = makeXlsContainer('DocumentSummaryInformation', Buffer.from('metadata'))
    const invalidCfbSignature = Buffer.from(plausibleXls)
    invalidCfbSignature[0] = 0

    for (const validXls of [plausibleXls, bookStreamXls]) {
        assert.equal(await validateUploadedFile(makeFile(
            'estimate.xls',
            'application/vnd.ms-excel',
            validXls
        ), { boq: true }), true)
    }
    for (const invalidXls of [missingWorkbookStream, invalidCfbSignature]) {
        await assert.rejects(
            validateUploadedFile(makeFile(
                'estimate.xls',
                'application/vnd.ms-excel',
                invalidXls
            ), { boq: true }),
            UploadValidationError
        )
    }
})

test('rejects misleading file extensions, MIME types, and signatures', async () => {
    await assert.rejects(
        validateUploadedFile(makeFile(
            'statement.pdf',
            'application/pdf',
            Buffer.from('not a PDF')
        )),
        UploadValidationError
    )
    await assert.rejects(
        validateUploadedFile(makeFile(
            'photo.jpg',
            'image/png',
            Buffer.from([0xff, 0xd8, 0xff, 0xd9])
        )),
        UploadValidationError
    )
    await assert.rejects(
        validateUploadedFile(makeFile(
            'photo.png',
            'image/png',
            Buffer.from('<svg/>')
        )),
        UploadValidationError
    )
})
