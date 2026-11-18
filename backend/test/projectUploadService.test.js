import assert from 'node:assert/strict'
import sharp from 'sharp'
import { mock, test } from 'node:test'

const state = { uploadedFiles: null }
mock.module(new URL('../src/modules/projects/project.repository.js', import.meta.url).href, {
    exports: {
        create: async () => ({ id: 'project-id' }),
        findAll: async () => [],
        findById: async () => null,
        update: async () => null,
        remove: async () => {},
    },
})
mock.module(new URL('../src/modules/projects/submodules/images/image.service.js', import.meta.url).href, {
    exports: {
        uploadImages: async (projectId, files) => {
            state.uploadedFiles = files
        },
    },
})

const { createProject } = await import('../src/modules/projects/project.service.js')

test('project service passes validated image arrays from the bounded multipart fields parser', async () => {
    const image = await sharp({
        create: { width: 1, height: 1, channels: 3, background: '#fff' },
    }).png().toBuffer()
    const file = {
        originalname: 'project.png',
        mimetype: 'image/png',
        buffer: image,
    }

    await createProject({ title_en: 'Project', title_ar: 'Project' }, { images: [file] })

    assert.deepEqual(state.uploadedFiles, [file])
})
