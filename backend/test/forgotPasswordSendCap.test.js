import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { test } from 'node:test'
import {
    clearForgotPasswordSendCapForTests,
    releaseForgotPasswordSend,
    reserveForgotPasswordSend,
} from '../src/modules/auth/forgotPasswordSendCap.js'

test('reserves at most five sends per rolling 24-hour window and expires old sends', (t) => {
    clearForgotPasswordSendCapForTests()
    t.after(clearForgotPasswordSendCapForTests)
    const now = Date.now()
    const email = `rolling-cap-${crypto.randomUUID()}@example.com`
    const hits = Array.from({ length: 5 }, () => reserveForgotPasswordSend(email, now))
    assert.ok(hits.every(Boolean))
    assert.equal(reserveForgotPasswordSend(email, now + 1), null)
    assert.ok(reserveForgotPasswordSend(email, now + 24 * 60 * 60 * 1000))
})

test('releasing a reservation returns its capacity', (t) => {
    clearForgotPasswordSendCapForTests()
    t.after(clearForgotPasswordSendCapForTests)
    const email = `release-${crypto.randomUUID()}@example.com`
    const now = Date.now()
    const reservations = Array.from({ length: 5 }, () => reserveForgotPasswordSend(email, now))
    assert.equal(reserveForgotPasswordSend(email, now), null)

    releaseForgotPasswordSend(reservations[0], now)

    assert.ok(reserveForgotPasswordSend(email, now))
})

test('caps the number of tracked email keys and evicts the oldest key', (t) => {
    clearForgotPasswordSendCapForTests()
    t.after(clearForgotPasswordSendCapForTests)
    const now = Date.now()
    const oldestEmail = `oldest-${crypto.randomUUID()}@example.com`
    assert.ok(reserveForgotPasswordSend(oldestEmail, now))

    for (let index = 1; index < 10_000; index += 1) {
        assert.ok(reserveForgotPasswordSend(`bounded-${index}-${crypto.randomUUID()}@example.com`, now))
    }

    assert.ok(reserveForgotPasswordSend(`last-${crypto.randomUUID()}@example.com`, now))
    assert.ok(reserveForgotPasswordSend(oldestEmail, now))
})

test('test clear function resets cap state without changing the route API', (t) => {
    clearForgotPasswordSendCapForTests()
    t.after(clearForgotPasswordSendCapForTests)
    const email = `clear-${crypto.randomUUID()}@example.com`
    const now = Date.now()
    for (let index = 0; index < 5; index += 1) {
        assert.ok(reserveForgotPasswordSend(email, now))
    }
    assert.equal(reserveForgotPasswordSend(email, now), null)

    clearForgotPasswordSendCapForTests()

    assert.ok(reserveForgotPasswordSend(email, now))
})
