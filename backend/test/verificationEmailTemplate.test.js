import assert from 'node:assert/strict'
import { test } from 'node:test'

Object.assign(process.env, {
    PORT: '0',
    DATABASE_URL: 'postgresql://localhost:5432/test',
    JWT_SECRET: 'test-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    CLOUDINARY_NAME: 'test-cloud',
    CLOUDINARY_KEY: 'test-key',
    CLOUDINARY_SECRET: 'test-secret',
    YAHOO_EMAIL: 'test@example.invalid',
    YAHOO_PASSWORD: 'test-password',
    FRONTEND_URL: 'http://localhost:3000',
    TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
})

const { verificationEmailTemplate } = await import('../src/utils/verificationEmail.template.js')

test('verification email escapes a hostile name in both greeting and registered-as line', () => {
    const name = '<b>x</b> & "quoted" \'single\''
    const html = verificationEmailTemplate({ code: '123456', name })

    assert.match(html, /Hello <span dir="auto" style="unicode-bidi:isolate">&lt;b&gt;x&lt;\/b&gt; &amp; &quot;quoted&quot; &#039;single&#039;<\/span>,/u)
    assert.match(html, /Registered as <span dir="auto" style="unicode-bidi:isolate">&lt;b&gt;x&lt;\/b&gt; &amp; &quot;quoted&quot; &#039;single&#039;<\/span>\./u)
    assert.doesNotMatch(html, /Hello <b>x<\/b>/)
    assert.doesNotMatch(html, /Registered as <span[^>]*><b>x<\/b>/u)
})

test('verification email strips control characters and collapses whitespace in names', () => {
    const html = verificationEmailTemplate({ code: '123456', name: 'Jane\r\n\tDoe\u0000\u0085 Smith' })

    assert.match(html, /Registered as <span dir="auto" style="unicode-bidi:isolate">JaneDoe Smith<\/span>\./u)
    assert.doesNotMatch(html, /Jane[\r\n\t\u0000\u0085]/u)
})

test('verification email removes bidi and zero-width controls from names', () => {
    const html = verificationEmailTemplate({ code: '123456', name: 'Li\u202E\u200Bar' })

    assert.match(html, /Registered as <span dir="auto" style="unicode-bidi:isolate">Liar<\/span>\./u)
    assert.doesNotMatch(html, /\u202E|\u200B/u)
})

test('verification email truncates long names to 40 characters including the ellipsis', () => {
    const html = verificationEmailTemplate({ code: '123456', name: 'A'.repeat(45) })

    assert.match(html, new RegExp(`Registered as <span dir="auto" style="unicode-bidi:isolate">${'A'.repeat(39)}…<\\/span>\\.`,'u'))
    assert.doesNotMatch(html, new RegExp(`Registered as <span dir="auto" style="unicode-bidi:isolate">${'A'.repeat(40)}`,'u'))
})

test('verification email isolates English, Arabic, and mixed-direction names', () => {
    const cases = [
        ['Jane Doe', 'Jane Doe'],
        ['ليلى أحمد', 'ليلى أحمد'],
        ['ليلى Smith', 'ليلى Smith'],
    ]

    for (const [name, expected] of cases) {
        const html = verificationEmailTemplate({ code: '123456', name })
        assert.match(
            html,
            new RegExp(`Registered as <span dir="auto" style="unicode-bidi:isolate">${expected}<\\/span>\\.`,'u')
        )
    }
})

test('verification email states who registered and how to disregard an unwanted registration', () => {
    const html = verificationEmailTemplate({ code: '123456', name: 'Alex' })

    assert.match(html, /Registered as <span dir="auto" style="unicode-bidi:isolate">Alex<\/span>\./u)
    assert.match(html, /If you didn't create this account, you can safely ignore this email\./u)
})

test('verification email includes bilingual latest-code and spam-folder hints', () => {
    const html = verificationEmailTemplate({ code: '123456' })

    assert.match(html, /Use the most recent code we sent you\./u)
    assert.match(html, /Can't find it\? Check your spam folder\./u)
    assert.match(
        html,
        /dir="rtl" lang="ar"[^>]*>[\s\S]*تم إنشاء الحساب باسم <span dir="auto" style="unicode-bidi:isolate">Customer<\/span>\.[\s\S]*إذا لم تنشئ هذا الحساب، يمكنك تجاهل هذه الرسالة بأمان\.[\s\S]*استخدم أحدث رمز أرسلناه إليك\.[\s\S]*لم تجده؟ تحقّق من مجلد البريد العشوائي\./u
    )
})

test('verification email has no plain-text body to update', () => {
    const html = verificationEmailTemplate({ code: '123456', name: 'Alex' })

    assert.match(html, /Registered as <span dir="auto" style="unicode-bidi:isolate">Alex<\/span>\./u)
    assert.match(html, /If you didn't create this account, you can safely ignore this email\./u)
})

test('verification email handles missing or blank names with a generic greeting and Customer fallback', () => {
    for (const name of [undefined, null, '', '   \t\r\n  ']) {
        const html = verificationEmailTemplate({ code: '654321', name })
        assert.match(html, /Hello,/u)
        assert.doesNotMatch(html, /Hello <span/u)
        assert.match(html, /Registered as <span dir="auto" style="unicode-bidi:isolate">Customer<\/span>\./u)
    }
})

test('verification email uses the new SDC corporate branding, monogram CID, and removes legacy gold/gradient styles', () => {
    const html = verificationEmailTemplate({ code: '987654', name: 'Alex', expiresInMinutes: 20 })

    assert.match(html, /src="cid:sdc-monogram@stardewedar\.com"/u)
    assert.match(html, /alt="SDC — STAR DEWEDAR Company"/u)
    assert.match(html, /STAR DEWEDAR Company/u)
    assert.match(html, /General Contracting &amp; Engineering/u)
    assert.match(html, /Verify Your Email Address/u)
    assert.match(html, /987654/u)
    assert.match(html, /This code will expire in <strong>20 minutes<\/strong>\./u)
    assert.match(html, /Never share this code with anyone\./u)
    assert.match(html, /This is an automated security verification\. Please do not reply\./u)
    assert.match(html, /#1B75BA/u)
    assert.match(html, /#102A43/u)
    assert.match(html, /#F3F6F9/u)
    assert.match(html, /#EAF3FA/u)
    assert.match(html, /#526579/u)
    assert.match(html, /#E5EBF0/u)
    assert.doesNotMatch(html, /linear-gradient|#e8b540|#fff8e1|#795500|#1a1a2e|#16213e|#f9e454|logo_z7m4wy/iu)
})

test('verification email safely escapes code and expiration values', () => {
    const html = verificationEmailTemplate({
        code: '<script>123456</script>',
        name: 'Alex',
        expiresInMinutes: '<b>15</b>',
    })

    assert.match(html, /&lt;script&gt;123456&lt;\/script&gt;/u)
    assert.match(html, /<strong>&lt;b&gt;15&lt;\/b&gt; minutes<\/strong>/u)
    assert.doesNotMatch(html, /<script>123456<\/script>/u)
})
