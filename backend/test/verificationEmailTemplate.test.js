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

test('verification email escapes user-controlled name in the greeting', () => {
    const name = '<b>x</b> & "quoted" \'single\''
    const html = verificationEmailTemplate({ code: '123456', name })

    assert.match(html, /Hello &lt;b&gt;x&lt;\/b&gt; &amp; &quot;quoted&quot; &#039;single&#039;,/)
    assert.doesNotMatch(html, /Hello <b>x<\/b>/)
})

test('verification email includes bilingual latest-code and spam-folder hints', () => {
    const html = verificationEmailTemplate({ code: '123456' })

    assert.match(html, /Use the most recent code we sent you\./u)
    assert.match(html, /Can't find it\? Check your spam folder\./u)
    assert.match(html, /dir="rtl" lang="ar"[^>]*>[\s\S]*استخدم أحدث رمز أرسلناه إليك\.[\s\S]*لم تجده؟ تحقّق من مجلد البريد العشوائي\./u)
})
