import assert from 'node:assert/strict'
import { test } from 'node:test'
import { safeErrorDetails, safeStack } from '../src/utils/safeError.js'

test('safe error details omit multi-line messages and preserve stack frames', () => {
    const error = new Error(
        'Invalid customer alice@example.com\nPrisma validation failed:\nemail: alice@example.com',
    )
    error.stack = [
        `${error.name}: ${error.message}`,
        '    at firstFrame (file:///app/first.js:1:1)',
        '    at secondFrame (file:///app/second.js:2:2)',
    ].join('\n')
    error.code = 'P2002'

    const details = safeErrorDetails(error)
    const serialized = JSON.stringify(details)

    assert.deepEqual(details, {
        errorName: 'Error',
        errorCode: 'P2002',
        frames: [
            'at firstFrame (file:///app/first.js:1:1)',
            'at secondFrame (file:///app/second.js:2:2)',
        ],
    })
    assert.doesNotMatch(serialized, /alice@example\.com|Prisma validation failed|Invalid customer/u)
})

test('safeStack keeps at most 15 frames and tolerates an error without a stack', () => {
    const error = new Error('private message')
    error.stack = ['Error: private message', ...Array.from(
        { length: 20 },
        (_, index) => `    at frame${index} (file:///app/index.js:${index + 1}:1)`,
    )].join('\n')

    assert.equal(safeStack(error).length, 15)
    assert.deepEqual(safeErrorDetails({ name: 'Error' }), {
        errorName: 'Error',
        frames: [],
    })
})
