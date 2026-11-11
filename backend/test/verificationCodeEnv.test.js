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
    SITE_URL: 'https://example.com',
    CLIENT_IP_SOURCE: 'x-real-ip',
    CORS_ORIGINS: 'http://localhost:5173,http://localhost:3000',
    VERIFICATION_CODE_PEPPER: '0123456789abcdef0123456789abcdef',
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

const loadConfigValue = (environment, expression) => spawnSync(
    process.execPath,
    ['--input-type=module', '-e', `const config = await import(${JSON.stringify(envModule)}); console.log(JSON.stringify(${expression}))`],
    {
        cwd: tmpdir(),
        encoding: 'utf8',
        env: { ...baseEnv, ...environment },
    }
)

test('production requires CLIENT_IP_SOURCE when NODE_ENV is unset', () => {
    const { status, stderr } = loadConfig({ NODE_ENV: undefined, CLIENT_IP_SOURCE: undefined })

    assert.notEqual(status, 0)
    assert.match(stderr, /Missing environment variable: CLIENT_IP_SOURCE/u)
})

test('production requires CORS_ORIGINS when NODE_ENV is unset', () => {
    const { status, stderr } = loadConfig({ NODE_ENV: undefined, CORS_ORIGINS: undefined })

    assert.notEqual(status, 0)
    assert.match(stderr, /Missing environment variable: CORS_ORIGINS/u)
})

test('production requires SITE_URL when NODE_ENV is unset', () => {
    const { status, stderr } = loadConfig({ NODE_ENV: undefined, SITE_URL: undefined })

    assert.notEqual(status, 0)
    assert.match(stderr, /Missing environment variable: SITE_URL/u)
})

test('production requires VERIFICATION_CODE_PEPPER when NODE_ENV is unset', () => {
    const { status, stderr } = loadConfig({ NODE_ENV: undefined, VERIFICATION_CODE_PEPPER: undefined })

    assert.notEqual(status, 0)
    assert.match(stderr, /Missing environment variable: VERIFICATION_CODE_PEPPER/u)
})

test('development defaults CLIENT_IP_SOURCE to socket when unset', () => {
    const { status, stderr } = loadConfig({ NODE_ENV: 'development', CLIENT_IP_SOURCE: undefined })

    assert.equal(status, 0, stderr)
})

test('development defaults SITE_URL to the local frontend when unset', () => {
    const { status, stderr } = loadConfig({ NODE_ENV: 'development', SITE_URL: undefined })

    assert.equal(status, 0, stderr)
})

test('production rejects a non-https SITE_URL', () => {
    const { status, stderr } = loadConfig({
        NODE_ENV: 'production',
        SITE_URL: 'http://example.com',
    })

    assert.notEqual(status, 0)
    assert.match(stderr, /SITE_URL must be a valid http\(s\) URL; production requires https/u)
})

test('production rejects an invalid CLIENT_IP_SOURCE', () => {
    const { status, stderr } = loadConfig({
        NODE_ENV: 'production',
        CLIENT_IP_SOURCE: 'x-forwarded-for',
    })

    assert.notEqual(status, 0)
    assert.match(stderr, /CLIENT_IP_SOURCE must be either "socket" or "x-real-ip"/u)
})

test('production warns loudly when CLIENT_IP_SOURCE is socket', () => {
    const { status, stderr } = loadConfig({
        NODE_ENV: 'production',
        CLIENT_IP_SOURCE: 'socket',
    })

    assert.equal(status, 0, stderr)
    assert.match(stderr, /WARNING: CLIENT_IP_SOURCE=socket in production/u)
})

test('CORS_ORIGINS are normalized to URL origins and include the admin dev server by default', () => {
    const normalized = loadConfigValue({
        NODE_ENV: 'development',
        CORS_ORIGINS: ' https://example.com/ , http://localhost:3001/ ',
    }, 'config.default.corsOrigins')
    const defaults = loadConfigValue({
        NODE_ENV: 'development',
        CORS_ORIGINS: undefined,
    }, 'config.default.corsOrigins')

    assert.equal(normalized.status, 0, normalized.stderr)
    const normalizedOutput = normalized.stdout.trim().split(/\r?\n/u).at(-1)
    const defaultsOutput = defaults.stdout.trim().split(/\r?\n/u).at(-1)
    assert.deepEqual(JSON.parse(normalizedOutput), ['https://example.com', 'http://localhost:3001'])
    assert.equal(defaults.status, 0, defaults.stderr)
    assert.ok(JSON.parse(defaultsOutput).includes('http://localhost:3001'))
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
