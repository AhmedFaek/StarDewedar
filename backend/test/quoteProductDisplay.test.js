import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getQuoteProductName } from '../../admin/src/utils/quoteProductName.js'

Object.assign(process.env, {
    PORT: '0',
    DATABASE_URL: '******localhost:5432/test',
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

const response = () => ({
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
})

test('quote display prefers the related product current localized name', () => {
    assert.equal(getQuoteProductName({
        product: { name_en: 'Current Product', name_ar: 'المنتج الحالي' },
        product_name_en_snapshot: 'Original Product',
        product_name_ar_snapshot: 'المنتج الأصلي',
    }, { isArabic: false, generalInquiry: 'GENERAL INQUIRY' }), 'Current Product')

    assert.equal(getQuoteProductName({
        product: { name_en: 'Current Product', name_ar: 'المنتج الحالي' },
        product_name_en_snapshot: 'Original Product',
        product_name_ar_snapshot: 'المنتج الأصلي',
    }, { isArabic: true, generalInquiry: 'استفسار عام' }), 'المنتج الحالي')
})

test('quote display uses the saved localized snapshot when the related product was deleted', () => {
    const deletedProductQuote = {
        product: null,
        product_id: null,
        product_name_en_snapshot: 'Original Product',
        product_name_ar_snapshot: 'المنتج الأصلي',
    }

    assert.equal(getQuoteProductName(deletedProductQuote, {
        isArabic: false,
        generalInquiry: 'GENERAL INQUIRY',
    }), 'Original Product')
    assert.equal(getQuoteProductName(deletedProductQuote, {
        isArabic: true,
        generalInquiry: 'استفسار عام',
    }), 'المنتج الأصلي')
})

test('quote display falls back to custom name and then GENERAL INQUIRY only when no catalog name exists', () => {
    assert.equal(getQuoteProductName({
        product: null,
        product_name_en_snapshot: null,
        product_name_ar_snapshot: null,
        custom_product_name: null,
    }, { isArabic: false, generalInquiry: 'GENERAL INQUIRY' }), 'GENERAL INQUIRY')

    assert.equal(getQuoteProductName({
        product: null,
        product_name_en_snapshot: null,
        product_name_ar_snapshot: null,
        custom_product_name: 'Requested Custom Product',
    }, { isArabic: false, generalInquiry: 'GENERAL INQUIRY' }), 'Requested Custom Product')
})

test('admin quote API response includes snapshots when product relation is null', async (t) => {
    const { default: prisma } = await import('../src/utils/prisma.js')
    const { getQuotes } = await import('../src/modules/quoteRequests/quote.controller.js')
    const quoteWithDeletedProduct = {
        id: 'quote-deleted-product',
        product_id: null,
        product: null,
        product_name_en_snapshot: 'Original Product',
        product_name_ar_snapshot: 'المنتج الأصلي',
    }
    let query
    const originalFindMany = prisma.quoteRequest.findMany
    prisma.quoteRequest.findMany = async (args) => {
        query = args
        return [quoteWithDeletedProduct]
    }
    t.after(() => {
        prisma.quoteRequest.findMany = originalFindMany
    })

    const res = response()
    await getQuotes({ query: {} }, res)

    assert.equal(res.statusCode, 200)
    assert.deepEqual(query.include, { product: true })
    assert.equal(res.body.data[0].product, null)
    assert.equal(res.body.data[0].product_name_en_snapshot, 'Original Product')
    assert.equal(res.body.data[0].product_name_ar_snapshot, 'المنتج الأصلي')
})
