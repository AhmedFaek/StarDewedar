import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

const state = {
  accessToken: 'access-token',
  refreshToken: 'refreshed-token',
  refreshCount: 0,
  clearCount: 0,
  responses: [],
  calls: [],
}

globalThis.window = {
  location: { origin: 'http://localhost:3000' },
  setTimeout,
  clearTimeout,
}

mock.module('./auth.js', {
  exports: {
    getValidAccessToken: async () => state.accessToken,
    refreshAccessToken: async () => {
      state.refreshCount += 1
      return state.refreshToken
    },
    saveTokens: () => {},
    saveUser: () => {},
    clearAuth: () => {
      state.clearCount += 1
    },
  },
})

globalThis.fetch = async (url, options) => {
  state.calls.push({ url, options })
  const response = state.responses.shift()
  if (!response) throw new Error('Unexpected mocked fetch call')
  if (response instanceof Error) throw response
  return response
}

const { api } = await import('./api.js')

const response = (body, status) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' },
})

const reset = () => {
  state.accessToken = 'access-token'
  state.refreshToken = 'refreshed-token'
  state.refreshCount = 0
  state.clearCount = 0
  state.responses = []
  state.calls = []
}

const formData = () => {
  const form = new FormData()
  form.append('boq_file', new Blob(['mock boq']), 'estimate.pdf')
  return form
}

for (const [name, send] of [
  ['BOQ', (form, token) => api.sendBOQRequest(form, token, 2000)],
  ['Quote', (form, token) => api.sendQuoteRequest(form, token, 2000)],
  ['Visit', (form, token) => api.sendVisitRequest(form, token, 2000)],
]) {
  test(`${name} request parses a plain 201 response exactly once`, async () => {
    reset()
    const body = { success: true, message: 'created', data: { id: `${name}-1` } }
    state.responses.push(response(body, 201))

    assert.deepEqual(await send(formData(), 'turnstile-token'), body)
    assert.equal(state.calls.length, 1)
  })
}

for (const [name, send] of [
  ['BOQ', (form, token) => api.sendBOQRequest(form, token, 2000)],
  ['Quote', (form, token) => api.sendQuoteRequest(form, token, 2000)],
  ['Visit', (form, token) => api.sendVisitRequest(form, token, 2000)],
]) {
  test(`${name} request refreshes OPTIONAL_AUTH_INVALID once and parses the retry 201`, async () => {
    reset()
    state.accessToken = 'expired-token'
    const form = formData()
    const body = { success: true, message: 'created', data: { id: `${name}-retry` } }
    state.responses.push(
      response({ success: false, code: 'OPTIONAL_AUTH_INVALID', message: 'invalid' }, 401),
      response(body, 201),
    )

    assert.deepEqual(await send(form, 'same-turnstile-token'), body)
    assert.equal(state.refreshCount, 1)
    assert.equal(state.calls.length, 2)
    assert.equal(state.calls[0].options.body, form)
    assert.equal(state.calls[1].options.body, form)
    assert.equal(state.calls[0].options.headers['X-Turnstile-Token'], 'same-turnstile-token')
    assert.equal(state.calls[1].options.headers['X-Turnstile-Token'], 'same-turnstile-token')
  })
}

test('refresh failure retries once as guest and returns the successful body', async () => {
  reset()
  state.accessToken = 'expired-token'
  state.refreshToken = null
  const form = formData()
  const body = { success: true, data: { id: 'guest-retry' } }
  state.responses.push(
    response({ success: false, code: 'OPTIONAL_AUTH_INVALID' }, 401),
    response(body, 201),
  )

  assert.deepEqual(await api.sendBOQRequest(form, 'same-turnstile-token', 2000), body)
  assert.equal(state.refreshCount, 1)
  assert.equal(state.clearCount, 1)
  assert.equal(state.calls.length, 2)
  assert.equal(state.calls[1].options.body, form)
  assert.equal(state.calls[1].options.headers.Authorization, undefined)
  assert.equal(state.calls[1].options.headers['X-Turnstile-Token'], 'same-turnstile-token')
})

test('a second OPTIONAL_AUTH_INVALID response is returned as a known 401 without another retry', async () => {
  reset()
  state.accessToken = 'expired-token'
  state.responses.push(
    response({ code: 'OPTIONAL_AUTH_INVALID', message: 'first invalid' }, 401),
    response({ code: 'OPTIONAL_AUTH_INVALID', message: 'retry invalid' }, 401),
  )

  await assert.rejects(api.sendBOQRequest(formData(), 'token', 2000), (error) => {
    assert.equal(error.status, 401)
    assert.equal(error.code, 'OPTIONAL_AUTH_INVALID')
    return true
  })
  assert.equal(state.refreshCount, 1)
  assert.equal(state.calls.length, 2)
})

for (const status of [400, 403, 429]) {
  test(`HTTP ${status} is rejected as a known API error with status and code`, async () => {
    reset()
    state.responses.push(response({ code: `HTTP_${status}`, message: 'rejected' }, status))

    await assert.rejects(api.sendBOQRequest(formData(), 'token', 2000), (error) => {
      assert.equal(error.status, status)
      assert.equal(error.code, `HTTP_${status}`)
      return true
    })
  })
}

test('fetch rejection is tagged as a network request error', async () => {
  reset()
  const fetchError = new TypeError('Failed to fetch')
  state.responses.push(fetchError)

  await assert.rejects(api.sendBOQRequest(formData(), 'token', 2000), (error) => {
    assert.equal(error.isNetworkRequestError, true)
    assert.equal(error.cause, fetchError)
    return true
  })
})

test('Contact parses its direct fetch response once', async () => {
  reset()
  const body = { message: 'sent' }
  state.responses.push(response(body, 201))

  assert.deepEqual(await api.sendContactMessage({ message: 'hello' }, 'token', 2000), body)
  assert.equal(state.calls.length, 1)
})
