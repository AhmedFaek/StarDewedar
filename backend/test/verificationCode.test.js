import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hashVerificationCode } from '../src/modules/auth/verificationCode.js'

test('verification code HMAC is deterministic and does not expose the raw code', () => {
    const rawCode = '123456'
    const hash = hashVerificationCode(rawCode, 'first-test-pepper-with-at-least-32-chars')

    assert.equal(hashVerificationCode(rawCode, 'first-test-pepper-with-at-least-32-chars'), hash)
    assert.notEqual(hash, rawCode)
    assert.match(hash, /^[a-f0-9]{64}$/u)
})

test('verification code HMAC changes when the pepper changes', () => {
    const rawCode = '123456'

    assert.notEqual(
        hashVerificationCode(rawCode, 'first-test-pepper-with-at-least-32-chars'),
        hashVerificationCode(rawCode, 'second-test-pepper-with-at-least-32-chars')
    )
})
