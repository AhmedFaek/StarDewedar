import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { test } from 'node:test'

const envModule = new URL('../src/config/env.js', import.meta.url).href
const baseEnv = {
    PATH: process.env.PATH,
    PORT: '5000',
    DATABASE_URL: 'postgresql://localhost:5432/test',
    JWT_SECRET: 'test-jwt-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    CLOUDINARY_NAME: 'test-cloud',
    CLOUDINARY_KEY: 'test-key',
    CLOUDINARY_SECRET: 'test-secret',
    YAHOO_EMAIL: 'test@example.invalid',
    YAHOO_PASSWORD: 'test-password',
    FRONTEND_URL: 'http://localhost:5173',
    TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
}

const loadConfig = (environment) => spawnSync(
    process.execPath,
    ['--input-type=module', '-e', `await import(${JSON.stringify(envModule)})`],
    {
        cwd: tmpdir(),
        encoding: 'utf8',
        env: { ...baseEnv, ...environment },
    }
)

test('production requires VERIFICATION_CODE_PEPPER when NODE_ENV is unset', () => {
    const { status, stderr } = loadConfig({ NODE_ENV: undefined, VERIFICATION_CODE_PEPPER: undefined })

    assert.notEqual(status, 0)
    assert.match(stderr, /Missing environment variable: VERIFICATION_CODE_PEPPER/u)
})

test('production rejects a short VERIFICATION_CODE_PEPPER', () => {
    const { status, stderr } = loadConfig({
        NODE_ENV: 'production',
        VERIFICATION_CODE_PEPPER: 'short',
    })

    assert.notEqual(status, 0)
    assert.match(stderr, /VERIFICATION_CODE_PEPPER must be at least 32 characters/u)
})

test('explicit development uses the non-secret fallback when no pepper is configured', () => {
    const { status, stdout, stderr } = loadConfig({
        NODE_ENV: 'development',
        VERIFICATION_CODE_PEPPER: undefined,
    })

    assert.equal(status, 0, stderr)
    assert.match(stderr, /fixed non-secret development\/test fallback/u)
    assert.doesNotMatch(stdout, /VERIFICATION_CODE_PEPPER/u)
})

test('explicit test uses the non-secret fallback when no pepper is configured', () => {
    const { status, stderr } = loadConfig({
        NODE_ENV: 'test',
        VERIFICATION_CODE_PEPPER: undefined,
    })

    assert.equal(status, 0, stderr)
    assert.match(stderr, /fixed non-secret development\/test fallback/u)
})
