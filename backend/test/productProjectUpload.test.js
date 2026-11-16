import assert from 'node:assert/strict'
import express from 'express'
import sharp from 'sharp'
import { mock, test } from 'node:test'

mock.module(new URL('../src/middleware/auth.middleware.js', import.meta.url).href, {
    exports: {
        default: (req, res, next) => {
            req.user = {
                userId: req.get('x-user-id') || 'upload-route-test-user',
                role: 'super_admin',
            }
            next()
        },
        optionalAuth: (req, res, next) => next(),
    },
})
mock.module(new URL('../src/middleware/roles.middleware.js', import.meta.url).href, {
    exports: {
        requirePermission: () => (req, res, next) => next(),
        requireRole: () => (req, res, next) => next(),
    },
})

const [{
    default: app,
    resolveErrorStatus,
}, productRouteModule, projectRouteModule, uploadMiddleware, uploadValidation, uploadFieldValidation] = await Promise.all([
    import('../src/app.js'),
    import('../src/modules/products/product.routes.js'),
    import('../src/modules/projects/project.routes.js'),
    import('../src/middleware/upload.middleware.js'),
    import('../src/utils/uploadValidation.js'),
    import('../src/utils/productProjectUploadValidation.js'),
])

const { default: auth } = await import('../src/middleware/auth.middleware.js')
const { default: productRoutes, productWriteLimiter } = productRouteModule
const { default: projectRoutes, projectWriteLimiter } = projectRouteModule
const {
    ADMIN_UPLOAD_MAX_FILE_BYTES,
    PRODUCT_MAX_AGGREGATE_FILE_BYTES,
    PRODUCT_MAX_REQUEST_BYTES,
    PROJECT_MAX_AGGREGATE_FILE_BYTES,
    PROJECT_MAX_REQUEST_BYTES,
    productFileUpload,
    projectFileUpload,
} = uploadMiddleware
const { UploadValidationError } = uploadValidation
const { validateProductUploadFiles, validateProjectUploadFiles } = uploadFieldValidation

const startServer = async (t, route, middleware) => {
    const app = express()
    app.post(route, middleware, (req, res) => res.sendStatus(204))
    app.use((error, req, res, next) => {
        const status = resolveErrorStatus(error)
        const message = error.code === 'IMAGE_DIMENSIONS_TOO_LARGE'
            ? error.message
            : status === 413
            ? 'Uploaded request exceeds the maximum allowed size.'
            : error.code === 'INVALID_UPLOAD'
                ? 'Invalid file type or content.'
                : 'Invalid upload request.'
        res.status(status).json({ message, code: error.code })
    })
    const server = app.listen(0, '127.0.0.1')
    await new Promise((resolve, reject) => {
        server.once('listening', resolve)
        server.once('error', reject)
    })
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
    }))
    return `http://127.0.0.1:${server.address().port}${route}`
}

const startAppServer = async (t) => {
    const server = app.listen(0, '127.0.0.1')
    await new Promise((resolve, reject) => {
        server.once('listening', resolve)
        server.once('error', reject)
    })
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
    }))
    return `http://127.0.0.1:${server.address().port}`
}

const uploadFile = async (url, field, filename, mimeType, contents) => {
    const form = new FormData()
    form.append(field, new Blob([contents], { type: mimeType }), filename)
    return fetch(url, { method: 'POST', body: form })
}

const getRouteMiddleware = (router, method, path) => {
    const route = router.stack.find((layer) => layer.route?.path === path && layer.route.methods[method])
    assert.ok(route, `${method.toUpperCase()} ${path} route exists`)
    return route.route.stack.map(({ handle }) => handle)
}

test('product and project routes authenticate and authorize before limiter and multipart parser', () => {
    const productHandlers = getRouteMiddleware(productRoutes, 'post', '/')
    assert.equal(productHandlers[0], auth)
    assert.notEqual(productHandlers[1], productWriteLimiter)
    assert.equal(productHandlers[2], productWriteLimiter)
    assert.equal(productHandlers[3], productFileUpload)

    const projectHandlers = getRouteMiddleware(projectRoutes, 'post', '/')
    assert.equal(projectHandlers[0], auth)
    assert.notEqual(projectHandlers[1], projectWriteLimiter)
    assert.equal(projectHandlers[2], projectWriteLimiter)
    assert.equal(projectHandlers[3], projectFileUpload)
})

test('product and project upload byte limits match the requested per-file, aggregate, and request caps', () => {
    assert.equal(ADMIN_UPLOAD_MAX_FILE_BYTES, 10 * 1024 * 1024)
    assert.equal(PRODUCT_MAX_AGGREGATE_FILE_BYTES, 60 * 1024 * 1024)
    assert.equal(PRODUCT_MAX_REQUEST_BYTES, 61 * 1024 * 1024)
    assert.equal(PROJECT_MAX_AGGREGATE_FILE_BYTES, 80 * 1024 * 1024)
    assert.equal(PROJECT_MAX_REQUEST_BYTES, 81 * 1024 * 1024)
})

test('product parser rejects PDFs in image fields, images in catalog fields, and unexpected fields with 400', async (t) => {
    const url = await startServer(t, '/product', productFileUpload)
    const pdf = Buffer.from('%PDF-1.7\nexample\n%%EOF')
    const image = await sharp({ create: { width: 1, height: 1, channels: 3, background: '#fff' } })
        .png()
        .toBuffer()

    for (const [field, filename, type, contents] of [
        ['images', 'catalog.pdf', 'application/pdf', pdf],
        ['catalog', 'image.png', 'image/png', image],
        ['extra', 'image.png', 'image/png', image],
    ]) {
        const response = await uploadFile(url, field, filename, type, contents)
        assert.equal(response.status, 400, `${field} field`)
        assert.match((await response.json()).message, /Invalid/u)
    }
})

test('project parser rejects unsupported file fields with a clean 400', async (t) => {
    const url = await startServer(t, '/project', projectFileUpload)
    const response = await uploadFile(
        url,
        'catalog',
        'catalog.pdf',
        'application/pdf',
        Buffer.from('%PDF-1.7\n%%EOF')
    )
    assert.equal(response.status, 400)
    assert.match((await response.json()).message, /Invalid/u)
})

test('product and project parsers reject file counts above their existing limits with 400', async (t) => {
    const productUrl = await startServer(t, '/product', productFileUpload)
    const projectUrl = await startServer(t, '/project', projectFileUpload)
    const tinyPng = Buffer.from('tiny')

    for (const [url, count] of [
        [productUrl, 6],
        [projectUrl, 11],
    ]) {
        const form = new FormData()
        for (let index = 0; index < count; index += 1) {
            form.append('images', new Blob([tinyPng], { type: 'image/png' }), `image-${index}.png`)
        }
        const response = await fetch(url, { method: 'POST', body: form })
        assert.equal(response.status, 400)
        assert.match((await response.json()).message, /Invalid/u)
    }
})

test('upload parsers return 413 when one file exceeds 10 MiB', async (t) => {
    const productUrl = await startServer(t, '/product', productFileUpload)
    const projectUrl = await startServer(t, '/project', projectFileUpload)
    const oversizedImage = Buffer.alloc(ADMIN_UPLOAD_MAX_FILE_BYTES + 1)

    for (const [url, filename] of [
        [productUrl, 'large.png'],
        [projectUrl, 'large.png'],
    ]) {
        const response = await uploadFile(url, 'images', filename, 'image/png', oversizedImage)
        assert.equal(response.status, 413)
        assert.match((await response.json()).message, /maximum allowed size/u)
    }
})

test('service validators require content to match the image or catalog field before upload', async () => {
    const png = await sharp({ create: { width: 1, height: 1, channels: 3, background: '#fff' } })
        .png()
        .toBuffer()
    const pdf = Buffer.from('%PDF-1.7\nexample\n%%EOF')

    assert.equal(await validateProductUploadFiles({
        images: [{ originalname: 'product.png', mimetype: 'image/png', buffer: png }],
        catalog: [{ originalname: 'catalog.pdf', mimetype: 'application/pdf', buffer: pdf }],
    }), true)
    assert.equal(await validateProjectUploadFiles({
        images: [{ originalname: 'project.png', mimetype: 'image/png', buffer: png }],
    }), true)

    await assert.rejects(
        validateProductUploadFiles({
            images: [{ originalname: 'catalog.pdf', mimetype: 'application/pdf', buffer: pdf }],
        }),
        UploadValidationError
    )
    await assert.rejects(
        validateProductUploadFiles({
            catalog: [{ originalname: 'image.png', mimetype: 'image/png', buffer: png }],
        }),
        UploadValidationError
    )
    await assert.rejects(
        validateProductUploadFiles({
            images: [{ originalname: 'image.png', mimetype: 'image/jpeg', buffer: png }],
        }),
        UploadValidationError
    )
    await assert.rejects(
        validateProjectUploadFiles({
            images: [{ originalname: 'fake.png', mimetype: 'image/png', buffer: pdf }],
        }),
        UploadValidationError
    )
})

test('multi-file validators keep image validation concurrency at one', async () => {
    const makeFiles = (count) => Array.from({ length: count }, (_, index) => ({
        originalname: `image-${index}.png`,
        mimetype: 'image/png',
        buffer: Buffer.from('content'),
    }))
    const measureConcurrency = async (validate, files) => {
        let active = 0
        let maximum = 0
        const validateFile = async () => {
            active += 1
            maximum = Math.max(maximum, active)
            await new Promise((resolve) => setTimeout(resolve, 2))
            active -= 1
        }
        await validate(files, { validateFile })
        return maximum
    }

    assert.equal(
        await measureConcurrency(validateProductUploadFiles, { images: makeFiles(5) }),
        1
    )
    assert.equal(
        await measureConcurrency(validateProjectUploadFiles, { images: makeFiles(10) }),
        1
    )
})

const makeOversizedPngHeader = () => {
    const header = Buffer.alloc(24)
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(header)
    header.writeUInt32BE(13, 8)
    header.write('IHDR', 12, 'ascii')
    header.writeUInt32BE(8000, 16)
    header.writeUInt32BE(5001, 20)
    return header
}

test('oversized PNG headers return IMAGE_DIMENSIONS_TOO_LARGE through product and project HTTP routes', async (t) => {
    t.mock.method(console, 'error', () => {})
    const baseUrl = await startAppServer(t)
    const oversizedPng = makeOversizedPngHeader()

    for (const [path, fields] of [
        ['/api/products', {
            name_en: 'Product',
            name_ar: 'Product',
            category_id: 'category-id',
        }],
        ['/api/projects', {
            title_en: 'Project',
            title_ar: 'Project',
            description_en: 'Project description',
            description_ar: 'Project description',
        }],
    ]) {
        const form = new FormData()
        for (const [field, value] of Object.entries(fields)) form.append(field, value)
        form.append('images', new Blob([oversizedPng], { type: 'image/png' }), 'oversized.png')
        const response = await fetch(`${baseUrl}${path}`, {
            method: 'POST',
            headers: { 'x-user-id': `dimension-test-${path}` },
            body: form,
        })
        const payload = await response.json()

        assert.equal(response.status, 400, path)
        assert.equal(payload.code, 'IMAGE_DIMENSIONS_TOO_LARGE', path)
        assert.match(payload.message, /under 40 megapixels/u)
    }
})

test('product write limiter allows 60 writes per user, rejects the 61st, and isolates users', async (t) => {
    const app = express()
    app.post('/write', (req, res, next) => {
        req.user = { userId: req.get('x-user-id') }
        next()
    }, productWriteLimiter, (req, res) => res.sendStatus(204))
    const server = app.listen(0, '127.0.0.1')
    await new Promise((resolve, reject) => {
        server.once('listening', resolve)
        server.once('error', reject)
    })
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
    }))
    const url = `http://127.0.0.1:${server.address().port}/write`
    const send = (userId) => fetch(url, { method: 'POST', headers: { 'x-user-id': userId } })

    for (let attempt = 0; attempt < 60; attempt += 1) {
        assert.equal((await send('upload-test-user-a')).status, 204)
    }
    const limited = await send('upload-test-user-a')
    assert.equal(limited.status, 429)
    assert.match((await limited.json()).message, /Too many product updates/u)
    assert.equal((await send('upload-test-user-b')).status, 204)

    const sendByIp = () => fetch(url, { method: 'POST' })
    for (let attempt = 0; attempt < 60; attempt += 1) {
        assert.equal((await sendByIp()).status, 204)
    }
    assert.equal((await sendByIp()).status, 429)
})
