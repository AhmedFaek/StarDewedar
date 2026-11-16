import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

let databaseWrites = 0
mock.module(new URL('../src/modules/products/submodules/images/image.repository.js', import.meta.url).href, {
    exports: {
        createImage: async () => {
            databaseWrites += 1
        },
    },
})

const [{ default: cloudinary }, { uploadImages }] = await Promise.all([
    import('../src/config/storage.js'),
    import('../src/modules/products/submodules/images/image.service.js'),
])

test('partial product image upload failure cleans successful Cloudinary uploads before rejecting', async (t) => {
    const deleted = []
    databaseWrites = 0
    t.mock.method(cloudinary.uploader, 'upload_stream', (options, callback) => ({
        end(buffer) {
            if (buffer.toString() === 'fail') {
                callback(new Error('upload failed'))
                return
            }
            callback(null, {
                public_id: 'products/image-success',
                resource_type: 'image',
                secure_url: 'https://res.cloudinary.com/test/image/upload/image-success.png',
            })
        },
    }))
    t.mock.method(cloudinary.uploader, 'destroy', async (publicId) => {
        deleted.push(publicId)
        return { result: 'ok' }
    })
    await assert.rejects(
        uploadImages('product-id', [
            { buffer: Buffer.from('success') },
            { buffer: Buffer.from('fail') },
        ]),
        /upload failed/u
    )

    assert.deepEqual(deleted, ['products/image-success'])
    assert.equal(databaseWrites, 0)
})
