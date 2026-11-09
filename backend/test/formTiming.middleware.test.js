import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateFormTiming } from '../src/middleware/formTiming.middleware.js'

const invoke = (elapsedMs) => {
    let nextCalls = 0
    const res = {
        statusCode: null,
        body: null,
        status(statusCode) {
            this.statusCode = statusCode
            return this
        },
        json(body) {
            this.body = body
            return this
        },
    }

    validateFormTiming(
        { headers: elapsedMs === undefined ? {} : { 'x-form-elapsed-ms': elapsedMs } },
        res,
        () => { nextCalls += 1 }
    )
    return { res, nextCalls }
}

test('form timing rejects missing or malformed elapsed-time headers before continuing', () => {
    for (const value of [
        undefined,
        '',
        '1.5',
        '-2000',
        '2000ms',
        '1234567890',
        '2000\n',
        '2000\r\n',
        '٢٠٠٠',
    ]) {
        const { res, nextCalls } = invoke(value)
        assert.equal(res.statusCode, 400, String(value))
        assert.deepEqual(res.body, {
            success: false,
            code: 'FORM_TIMING_MISSING',
            message: 'Please keep the form open for at least 2 seconds before submitting.',
        }, String(value))
        assert.equal(nextCalls, 0, String(value))
    }
})

test('form timing rejects elapsed values under 2000 milliseconds', () => {
    for (const value of ['0', '1', '1999']) {
        const { res, nextCalls } = invoke(value)
        assert.equal(res.statusCode, 400, value)
        assert.deepEqual(res.body, {
            success: false,
            code: 'FORM_TOO_FAST',
            message: 'Please keep the form open for at least 2 seconds before submitting.',
        }, value)
        assert.equal(nextCalls, 0, value)
    }
})

test('form timing accepts 2000 milliseconds and the largest nine-digit value', () => {
    for (const value of ['2000', '999999999']) {
        const { res, nextCalls } = invoke(value)
        assert.equal(res.statusCode, null, value)
        assert.equal(res.body, null, value)
        assert.equal(nextCalls, 1, value)
    }
})
