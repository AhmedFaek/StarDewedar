import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
    createDnsResolver,
    createEmailValidator,
} from '../src/utils/emailValidation.service.js'

const dnsError = (code) => Object.assign(new Error(code), { code })

const createResolver = (overrides = {}) => ({
    resolveMx: async () => [{ exchange: 'mx.example.invalid' }],
    resolve4: async () => [],
    resolve6: async () => [],
    ...overrides,
})

test('email format validation enforces address, local-part, and total lengths', async () => {
    const validator = createEmailValidator({ resolver: createResolver() })
    const cases = [
        'missing-at.example',
        '@example.invalid',
        'person@',
        'one@@example.invalid',
        `${'l'.repeat(65)}@example.invalid`,
        `${'l'.repeat(64)}@${'d'.repeat(190)}.invalid`,
    ]

    for (const email of cases) {
        const result = await validator.validateCustomerEmail(email)
        assert.equal(result.isValid, false, email)
        assert.equal(result.code, 'INVALID_EMAIL_FORMAT', email)
    }

    assert.deepEqual(await validator.validateCustomerEmail('  Person@Example.Invalid  '), {
        isValid: true,
        normalizedEmail: 'person@example.invalid',
    })
})

test('default resolver factory is lazy and invoked once on first lookup', async () => {
    let resolverFactoryCalls = 0
    const validator = createEmailValidator({
        resolverFactory: () => {
            resolverFactoryCalls += 1
            return createResolver()
        },
    })

    assert.equal(resolverFactoryCalls, 0)
    assert.deepEqual(await validator.checkEmailDomainMX('example.invalid'), { valid: true })
    assert.equal(resolverFactoryCalls, 1)
    assert.deepEqual(await validator.checkEmailDomainMX('other.example.invalid'), { valid: true })
    assert.equal(resolverFactoryCalls, 1)
})

test('malformed domains are rejected before resolver creation with INVALID_EMAIL_DOMAIN', async () => {
    let resolverFactoryCalls = 0
    const validator = createEmailValidator({
        resolverFactory: () => {
            resolverFactoryCalls += 1
            return createResolver()
        },
    })
    const domains = [
        '.com',
        'a..com',
        `${'a'.repeat(64)}.com`,
        '-a.com',
        'a-.com',
        'a b.com',
        'localhost',
        `${'a'.repeat(63)}.${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(63)}`,
    ]

    for (const domain of domains) {
        const result = await validator.validateCustomerEmail(`person@${domain}`)
        assert.equal(result.isValid, false, domain)
        assert.equal(result.code, 'INVALID_EMAIL_DOMAIN', domain)
        assert.equal(result.error,
            'The email domain does not appear to exist or cannot receive emails. Please check your email address.',
            domain)
    }

    assert.equal(resolverFactoryCalls, 0)
})

test('valid punycode domains pass syntax validation and reach DNS', async () => {
    let calls = 0
    const validator = createEmailValidator({
        resolver: createResolver({
            resolveMx: async () => {
                calls += 1
                return [{ exchange: 'mx.example.invalid' }]
            },
        }),
    })

    assert.deepEqual(
        await validator.validateCustomerEmail('person@xn--bcher-kva.example'),
        { isValid: true, normalizedEmail: 'person@xn--bcher-kva.example' }
    )
    assert.equal(calls, 1)
})

test('email validation rejects explicit RFC 7505 null MX without address fallback', async () => {
    for (const exchange of ['', '.']) {
        let addressLookups = 0
        const validator = createEmailValidator({
            resolver: createResolver({
                resolveMx: async () => [{ exchange }],
                resolve4: async () => { addressLookups += 1; return ['192.0.2.1'] },
                resolve6: async () => { addressLookups += 1; return ['2001:db8::1'] },
            }),
        })

        assert.deepEqual(await validator.checkEmailDomainMX('example.invalid'), {
            valid: false,
            reason: 'NULL_MX',
        })
        assert.equal(addressLookups, 0)
    }
})

test('EBADNAME is a definitive invalid domain result', async () => {
    let addressLookups = 0
    const validator = createEmailValidator({
        resolver: createResolver({
            resolveMx: async () => { throw dnsError('EBADNAME') },
            resolve4: async () => { addressLookups += 1; return [] },
            resolve6: async () => { addressLookups += 1; return [] },
        }),
    })

    assert.deepEqual(await validator.validateCustomerEmail('person@example.invalid'), {
        isValid: false,
        normalizedEmail: 'person@example.invalid',
        code: 'INVALID_EMAIL_DOMAIN',
        error: 'The email domain does not appear to exist or cannot receive emails. Please check your email address.',
    })
    assert.equal(addressLookups, 0)
})

test('ENODATA and successful empty MX check both A and AAAA records', async () => {
    for (const mxBehavior of [
        async () => { throw dnsError('ENODATA') },
        async () => [],
    ]) {
        const lookups = []
        const validator = createEmailValidator({
            resolver: createResolver({
                resolveMx: mxBehavior,
                resolve4: async () => { lookups.push('A'); return [] },
                resolve6: async () => { lookups.push('AAAA'); return ['2001:db8::1'] },
            }),
        })

        assert.deepEqual(await validator.checkEmailDomainMX('example.invalid'), { valid: true })
        assert.deepEqual(lookups.sort(), ['A', 'AAAA'])
    }
})

test('either an A or AAAA address record validates an MX-less domain', async () => {
    for (const [resolve4, resolve6] of [
        [async () => ['192.0.2.1'], async () => { throw dnsError('ENODATA') }],
        [async () => { throw dnsError('ENODATA') }, async () => ['2001:db8::1']],
    ]) {
        const validator = createEmailValidator({
            resolver: createResolver({
                resolveMx: async () => [],
                resolve4,
                resolve6,
            }),
        })

        assert.deepEqual(await validator.checkEmailDomainMX('example.invalid'), { valid: true })
    }
})

test('ENODATA with no A or AAAA records is invalid', async () => {
    const validator = createEmailValidator({
        resolver: createResolver({
            resolveMx: async () => { throw dnsError('ENODATA') },
            resolve4: async () => { throw dnsError('ENODATA') },
            resolve6: async () => { throw dnsError('ENOTFOUND') },
        }),
    })

    assert.deepEqual(await validator.checkEmailDomainMX('example.invalid'), {
        valid: false,
        reason: 'DOMAIN_NOT_FOUND',
    })
})

test('ENOTFOUND and NXDOMAIN reject without address fallback', async () => {
    for (const code of ['ENOTFOUND', 'NXDOMAIN']) {
        let addressLookups = 0
        const validator = createEmailValidator({
            resolver: createResolver({
                resolveMx: async () => { throw dnsError(code) },
                resolve4: async () => { addressLookups += 1; return [] },
                resolve6: async () => { addressLookups += 1; return [] },
            }),
        })

        assert.equal((await validator.checkEmailDomainMX('example.invalid')).valid, false)
        assert.equal(addressLookups, 0)
    }
})

test('SERVFAIL and transient MX errors fail open without address fallback or caching', async () => {
    for (const code of ['SERVFAIL', 'ECONNREFUSED']) {
        let mxCalls = 0
        let addressLookups = 0
        const validator = createEmailValidator({
            resolver: createResolver({
                resolveMx: async () => {
                    mxCalls += 1
                    if (mxCalls === 1) throw dnsError(code)
                    return [{ exchange: 'mx.example.invalid' }]
                },
                resolve4: async () => { addressLookups += 1; return [] },
                resolve6: async () => { addressLookups += 1; return [] },
            }),
        })

        assert.deepEqual(await validator.checkEmailDomainMX('example.invalid'), {
            valid: true,
            warning: 'DNS_CHECK_SKIPPED',
        })
        assert.deepEqual(await validator.checkEmailDomainMX('example.invalid'), { valid: true })
        assert.equal(mxCalls, 2)
        assert.equal(addressLookups, 0)
        assert.deepEqual(validator.getStats(), { timeout: 0, transient: 1 })
    }
})

test('failed transient lookup is removed from in-flight state and can be retried', async () => {
    let calls = 0
    const validator = createEmailValidator({
        resolver: createResolver({
            resolveMx: async () => {
                calls += 1
                if (calls === 1) throw dnsError('ECONNREFUSED')
                return [{ exchange: 'mx.example.invalid' }]
            },
        }),
    })

    assert.equal((await validator.checkEmailDomainMX('retry.example.invalid')).warning, 'DNS_CHECK_SKIPPED')
    assert.deepEqual(await validator.checkEmailDomainMX('retry.example.invalid'), { valid: true })
    assert.equal(calls, 2)
})

test('timed out checks fail open, increment stats, and are not cached', async () => {
    let calls = 0
    const validator = createEmailValidator({
        timeoutMs: 5,
        resolver: createResolver({
            resolveMx: async () => {
                calls += 1
                if (calls === 1) return new Promise(() => {})
                return [{ exchange: 'mx.example.invalid' }]
            },
        }),
    })

    assert.deepEqual(await validator.checkEmailDomainMX('timeout.example.invalid'), {
        valid: true,
        warning: 'DNS_TIMEOUT_SKIPPED',
    })
    assert.deepEqual(await validator.checkEmailDomainMX('timeout.example.invalid'), { valid: true })
    assert.equal(calls, 2)
    assert.deepEqual(validator.getStats(), { timeout: 1, transient: 0 })
})

test('concurrent checks for one domain share one DNS lookup', async () => {
    let calls = 0
    let releaseLookup
    const validator = createEmailValidator({
        resolver: createResolver({
            resolveMx: async () => {
                calls += 1
                await new Promise((resolve) => { releaseLookup = resolve })
                return [{ exchange: 'mx.example.invalid' }]
            },
        }),
    })

    const first = validator.checkEmailDomainMX('shared.example.invalid')
    const second = validator.checkEmailDomainMX('shared.example.invalid')
    await new Promise((resolve) => setImmediate(resolve))
    releaseLookup()

    assert.deepEqual(await Promise.all([first, second]), [{ valid: true }, { valid: true }])
    assert.equal(calls, 1)
})

test('definitive DNS results are cached for ten minutes and cache evicts beyond 1000 domains', async () => {
    let timestamp = 0
    let calls = 0
    const validator = createEmailValidator({
        now: () => timestamp,
        resolver: createResolver({
            resolveMx: async () => {
                calls += 1
                return [{ exchange: 'mx.example.invalid' }]
            },
        }),
    })

    await validator.checkEmailDomainMX('cached.example.invalid')
    await validator.checkEmailDomainMX('cached.example.invalid')
    assert.equal(calls, 1)

    timestamp = 10 * 60 * 1000
    await validator.checkEmailDomainMX('cached.example.invalid')
    assert.equal(calls, 2)

    for (let index = 0; index < 1000; index += 1) {
        await validator.checkEmailDomainMX(`domain-${index}.example.invalid`)
    }
    await validator.checkEmailDomainMX('cached.example.invalid')
    assert.equal(calls, 1003)
})

test('skipped DNS summary logs at most once per minute and never includes domains', async () => {
    let timestamp = 0
    const logs = []
    const validator = createEmailValidator({
        now: () => timestamp,
        logger: { warn: (...args) => logs.push(args) },
        resolver: createResolver({
            resolveMx: async () => { throw dnsError('SERVFAIL') },
        }),
    })

    await validator.checkEmailDomainMX('private-one.example.invalid')
    await validator.checkEmailDomainMX('private-two.example.invalid')
    timestamp += 60 * 1000
    await validator.checkEmailDomainMX('private-three.example.invalid')

    assert.equal(logs.length, 2)
    assert.deepEqual(logs[0][1], {
        event: 'email_dns_checks_skipped',
        timeoutCount: 0,
        transientCount: 1,
    })
    assert.doesNotMatch(JSON.stringify(logs), /private-one|private-two|private-three/)
})

test('DNS server environment parsing accepts IPs and falls back to system resolver', () => {
    const calls = []
    const logs = []
    const createResolver = () => ({
        setServers: (servers) => calls.push(servers),
    })

    const configured = createDnsResolver({
        servers: '1.1.1.1,not-an-ip,2001:4860:4860::8888',
        resolverFactory: createResolver,
        logger: { warn: (...args) => logs.push(args) },
    })
    assert.ok(configured)
    assert.deepEqual(calls, [['1.1.1.1', '2001:4860:4860::8888']])
    assert.equal(logs.length, 1)
    assert.deepEqual(logs[0][1], {
        event: 'email_dns_servers_invalid',
        invalidCount: 1,
    })

    calls.length = 0
    createDnsResolver({
        servers: 'bad,also-bad',
        resolverFactory: createResolver,
        logger: { warn: (...args) => logs.push(args) },
    })
    assert.deepEqual(calls, [])

    createDnsResolver({
        servers: '1.1.1.1',
        resolverFactory: () => ({
            setServers: () => { throw new Error('unsupported nameserver configuration') },
        }),
        logger: { warn: (...args) => logs.push(args) },
    })
    assert.equal(logs.length, 3)
    assert.deepEqual(logs[2][1], {
        event: 'email_dns_servers_unavailable',
    })
})

test('validator test reset clears its isolated cache and skipped-check stats', async () => {
    let calls = 0
    const validator = createEmailValidator({
        resolver: createResolver({
            resolveMx: async () => {
                calls += 1
                if (calls === 1) throw dnsError('SERVFAIL')
                return [{ exchange: 'mx.example.invalid' }]
            },
        }),
    })

    await validator.checkEmailDomainMX('reset.example.invalid')
    assert.deepEqual(validator.getStats(), { timeout: 0, transient: 1 })
    validator.resetForTests()
    assert.deepEqual(validator.getStats(), { timeout: 0, transient: 0 })
    assert.deepEqual(await validator.checkEmailDomainMX('reset.example.invalid'), { valid: true })
    assert.equal(calls, 2)
})
